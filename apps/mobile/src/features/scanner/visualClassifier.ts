import { MaterialType } from '@bingo/shared-types';
import * as ImageManipulator from 'expo-image-manipulator';
import { base64ToBytes } from '../../lib/codec/base64';
import { decodePng } from './pngDecode';

/**
 * TrashScan tahap 2 — dugaan visual.
 *
 * APA YANG BERUBAH DARI VERSI SEBELUMNYA
 * --------------------------------------
 * Versi sebelumnya mengaku "enhanced heuristic (multi-feature color/edge
 * analysis)" padahal seluruh fiturnya dihitung dari byte berkas PNG yang masih
 * termampatkan DEFLATE. Angka-angkanya nyata sebagai angka, tetapi tidak
 * berhubungan dengan foto. Sekarang piksel benar-benar didekode (lihat
 * `pngDecode.ts`), dan bila dekode gagal fungsi ini mengembalikan `null` —
 * tidak ada lagi tebakan cadangan yang dikarang dari hash nama berkas.
 *
 * APA YANG DIHAPUS
 * ----------------
 * - Histogram 512 bin: dibangun tiap pemindaian tetapi tidak pernah dibaca satu
 *   pun penilai. Fitur yang tidak dipakai hanya membuat pipeline terlihat lebih
 *   canggih daripada kenyataannya.
 * - `warmth` = (R+G)/(G+B): tidak punya arti fisik yang bisa dipertahankan.
 * - Lantai keyakinan 0,35: membuat layar hasil mustahil menunjukkan keraguan.
 * - Basis 1,0 tanpa syarat pada OTHER_PLASTIC: membuat MIXED — keranjang "saya
 *   tidak tahu" — secara struktural tidak pernah bisa menang.
 *
 * BATAS KEJUJURAN
 * ---------------
 * Yang tersisa adalah heuristik warna dan tekstur sederhana, bukan model
 * terlatih. Ia memang bisa memisahkan styrofoam putih dari daun basah, tetapi
 * tidak bisa memisahkan PET dari PP yang sama-sama bening. Karena itu
 * keluarannya selalu berlabel "perkiraan visual" dan tunduk pada ambang
 * `VISUAL_CONFIDENCE_THRESHOLD` di bawah.
 */

// ─── Konstanta ───────────────────────────────────────────────

/** Sisi thumbnail yang dianalisis. 64×64 = 4.096 piksel, cukup dan cepat. */
export const ANALYSIS_SIZE = 64;

/**
 * Ambang keterpisahan tahap visual.
 *
 * Yang diukur adalah selisih ternormalisasi antara dugaan teratas dan dugaan
 * kedua: `(skor1 − skor2) / skor1`. Nilai 0 berarti dua kelas terikat sama
 * kuat; nilai 1 berarti hanya satu kelas yang mengumpulkan bukti sama sekali.
 *
 * Besaran inilah — bukan "probabilitas" — yang menentukan boleh-tidaknya sistem
 * menyimpulkan, karena kegagalan khas heuristik warna adalah dua kelas yang
 * sama-sama masuk akal (styrofoam vs plastik film, botol PET biru vs gelas PP
 * biru), bukan ketiadaan bukti.
 *
 * 0,3 dipilih karena di bawah itu dugaan kedua masih membawa lebih dari 70%
 * bukti pemenang — pada keadaan tersebut satu-satunya jawaban yang jujur adalah
 * "belum yakin". Di bawah ambang ini layar hasil TIDAK boleh memberi instruksi
 * pembuangan dan wajib meminta pengguna memotret simbol daur ulang atau memilih
 * jenis materialnya sendiri.
 */
export const VISUAL_CONFIDENCE_THRESHOLD = 0.3;

/**
 * Bukti absolut minimum yang harus dikumpulkan pemenang.
 *
 * Tanpa ini, foto yang tidak memicu aturan apa pun tetap menghasilkan pemenang
 * hanya karena skornya kebetulan paling tinggi di antara skor-skor kecil.
 * Di bawah ambang ini hasilnya dipaksa menjadi `MIXED` — kelas "tidak
 * teridentifikasi" yang sekarang benar-benar bisa tercapai.
 */
export const MIN_VISUAL_EVIDENCE = 3;

// ─── Fitur ───────────────────────────────────────────────────

/**
 * Fitur yang dihitung dari piksel sungguhan.
 *
 * Setiap medan di sini dipakai oleh minimal satu aturan penilaian. Bila sebuah
 * fitur berhenti dipakai, hapus — jangan biarkan menggantung sebagai hiasan.
 */
export interface ImageFeatures {
  /** Rata-rata kanal, 0–255. */
  avgR: number;
  avgG: number;
  avgB: number;
  /** Hue warna rata-rata, 0–360. Hanya bermakna bila `saturation` cukup besar. */
  hue: number;
  /** Rata-rata saturasi PER PIKSEL (0–1) — bukan saturasi dari warna rata-rata. */
  saturation: number;
  /** Rata-rata terang PER PIKSEL (0–1). */
  lightness: number;
  /** Simpangan baku luminansi, 0–255. Tinggi = permukaan memantul / bertekstur. */
  lumStdDev: number;
  /** Bagian piksel yang bertetangga dengan gradien luminansi tajam, 0–1. */
  edgeDensity: number;
  /** Porsi tiap kanal terhadap jumlah ketiganya. */
  redRatio: number;
  greenRatio: number;
  blueRatio: number;
}

/**
 * Memperkecil gambar lalu mendekode pikselnya.
 *
 * PNG dipilih sebagai format perantara karena lossless: statistik warna yang
 * dihitung setelahnya adalah statistik foto, bukan statistik artefak kompresi.
 * Mengembalikan `null` bila gambar tidak dapat dibaca — pemanggil harus
 * menyampaikannya sebagai kegagalan, bukan sebagai hasil pemindaian.
 */
export async function extractFeatures(imageUri: string): Promise<ImageFeatures | null> {
  let base64: string | undefined;
  try {
    const resized = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: ANALYSIS_SIZE, height: ANALYSIS_SIZE } }],
      { base64: true, format: ImageManipulator.SaveFormat.PNG },
    );
    base64 = resized.base64 ?? undefined;
  } catch {
    return null;
  }
  if (!base64) return null;

  const bytes = base64ToBytes(base64);
  if (!bytes) return null;

  const image = decodePng(bytes);
  if (!image) return null;

  return computeFeatures(image.rgba, image.width, image.height);
}

/**
 * Menghitung fitur dari buffer RGBA sungguhan.
 *
 * `width` dan `height` wajib diberikan: deteksi tepi membandingkan piksel
 * dengan tetangga atas dan kirinya, jadi ia harus tahu di mana baris berakhir.
 * Versi sebelumnya mengasumsikan lebar 64 apa pun isi buffernya, sehingga
 * "tepi" yang dihitung membandingkan piksel yang berjauhan di dalam gambar.
 */
export function computeFeatures(rgba: Uint8Array, width: number, height: number): ImageFeatures {
  const pixelCount = width * height;
  if (pixelCount <= 0 || rgba.length < pixelCount * 4) return emptyFeatures();

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let sumSaturation = 0;
  let sumLightness = 0;
  let sumLum = 0;
  let sumLumSq = 0;
  let edgeCount = 0;
  let edgeSamples = 0;

  const rowLum = new Float32Array(width);
  const previousRowLum = new Float32Array(width);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = rgba[i]!;
      const g = rgba[i + 1]!;
      const b = rgba[i + 2]!;

      sumR += r;
      sumG += g;
      sumB += b;

      const { s, l } = rgbToHsl(r, g, b);
      sumSaturation += s;
      sumLightness += l;

      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      sumLum += lum;
      sumLumSq += lum * lum;
      rowLum[x] = lum;

      // Tepi = beda luminansi tajam terhadap tetangga kiri atau atas. Ambang 30
      // pada skala 0–255 kira-kira setara batas benda pada foto ponsel biasa.
      if (x > 0 || y > 0) {
        const horizontal = x > 0 ? Math.abs(lum - rowLum[x - 1]!) : 0;
        const vertical = y > 0 ? Math.abs(lum - previousRowLum[x]!) : 0;
        edgeSamples++;
        if (horizontal > 30 || vertical > 30) edgeCount++;
      }
    }
    previousRowLum.set(rowLum);
  }

  const avgR = sumR / pixelCount;
  const avgG = sumG / pixelCount;
  const avgB = sumB / pixelCount;
  const lumMean = sumLum / pixelCount;
  const variance = sumLumSq / pixelCount - lumMean * lumMean;
  const colorSum = avgR + avgG + avgB || 1;

  return {
    avgR,
    avgG,
    avgB,
    hue: rgbToHsl(avgR, avgG, avgB).h,
    saturation: sumSaturation / pixelCount,
    lightness: sumLightness / pixelCount,
    lumStdDev: Math.sqrt(Math.max(0, variance)),
    edgeDensity: edgeSamples > 0 ? edgeCount / edgeSamples : 0,
    redRatio: avgR / colorSum,
    greenRatio: avgG / colorSum,
    blueRatio: avgB / colorSum,
  };
}

// ─── Penilaian ───────────────────────────────────────────────

/**
 * Memberi skor tiap jenis material.
 *
 * Bobot di bawah adalah aturan tangan, bukan parameter hasil pelatihan. Semua
 * aturan ditulis sebagai pernyataan yang bisa diperiksa orang lain — misalnya
 * "styrofoam sangat terang, hampir tanpa warna, dan permukaannya rata" — supaya
 * kesalahannya dapat diperdebatkan alih-alih disembunyikan di balik bobot.
 *
 * `MIXED` sengaja tidak punya aturan. Ia dicapai lewat `MIN_VISUAL_EVIDENCE`,
 * yaitu ketika tidak ada kelas yang mengumpulkan bukti memadai.
 */
export function scoreMaterials(f: ImageFeatures): Map<MaterialType, number> {
  const scores = new Map<MaterialType, number>();
  const colorful = f.saturation > 0.12;

  // PET — botol bening / kebiruan, memantul.
  scores.set(
    MaterialType.PET,
    sum([
      f.blueRatio > 0.36 ? 2.5 : 0,
      colorful && inHueRange(f.hue, 180, 260) ? 2.5 : 0,
      f.lightness > 0.55 ? 1.0 : 0,
      f.lumStdDev > 40 ? 1.0 : 0,
    ]),
  );

  // HDPE — wadah buram terang (jeriken, botol susu), permukaan bertekstur sedang.
  scores.set(
    MaterialType.HDPE,
    sum([
      f.lightness > 0.62 ? 1.5 : 0,
      f.saturation < 0.18 ? 1.5 : 0,
      f.lumStdDev > 20 && f.lumStdDev < 55 ? 1.5 : 0,
      f.edgeDensity > 0.1 ? 1.0 : 0,
    ]),
  );

  // PVC — plastik keras gelap, permukaannya seragam.
  scores.set(
    MaterialType.PVC,
    sum([f.lightness < 0.35 ? 2.5 : 0, f.saturation < 0.2 ? 1.0 : 0, f.lumStdDev < 28 ? 1.0 : 0]),
  );

  // LDPE — lembaran/kantong tipis: terang, nyaris tak berwarna, sangat rata.
  scores.set(
    MaterialType.LDPE,
    sum([
      f.lightness > 0.6 ? 1.5 : 0,
      f.saturation < 0.12 ? 2.0 : 0,
      f.lumStdDev < 22 ? 2.0 : 0,
      f.edgeDensity < 0.08 ? 1.5 : 0,
    ]),
  );

  // PP — gelas dan tutup berwarna, bertepi jelas.
  scores.set(
    MaterialType.PP,
    sum([
      f.saturation > 0.32 ? 2.0 : 0,
      f.edgeDensity > 0.12 ? 1.5 : 0,
      f.lightness > 0.4 && f.lightness < 0.72 ? 1.5 : 0,
    ]),
  );

  // PS — styrofoam: sangat terang, hampir tanpa warna, permukaan rata.
  scores.set(
    MaterialType.PS,
    sum([
      f.lightness > 0.8 ? 2.5 : 0,
      f.saturation < 0.08 ? 2.0 : 0,
      f.edgeDensity < 0.07 ? 2.0 : 0,
      f.lumStdDev < 18 ? 1.5 : 0,
    ]),
  );

  // Plastik lain — berwarna, terstruktur, tidak menonjol ke mana pun.
  // Tanpa basis tanpa syarat: kelas ini harus menang karena bukti, bukan karena
  // hadiah gratis 1,0 seperti sebelumnya.
  scores.set(
    MaterialType.OTHER_PLASTIC,
    sum([
      f.saturation > 0.25 ? 1.5 : 0,
      f.edgeDensity > 0.1 ? 1.0 : 0,
      f.lightness > 0.3 && f.lightness < 0.7 ? 1.0 : 0,
    ]),
  );

  // Kertas / kardus — terang, pucat, condong hangat (merah > biru).
  scores.set(
    MaterialType.PAPER,
    sum([
      f.lightness > 0.66 ? 2.0 : 0,
      f.saturation < 0.22 ? 1.5 : 0,
      f.avgR > f.avgB + 12 ? 2.0 : 0,
      f.lumStdDev > 12 && f.lumStdDev < 45 ? 1.0 : 0,
      f.edgeDensity > 0.05 && f.edgeDensity < 0.22 ? 1.0 : 0,
    ]),
  );

  // Logam — abu-abu netral dengan pantulan kuat (simpangan luminansi besar).
  scores.set(
    MaterialType.METAL,
    sum([
      f.lumStdDev > 48 ? 2.5 : 0,
      f.saturation < 0.14 ? 2.0 : 0,
      Math.abs(f.avgR - f.avgG) < 14 && Math.abs(f.avgG - f.avgB) < 14 ? 2.0 : 0,
      f.edgeDensity > 0.14 ? 1.5 : 0,
    ]),
  );

  // Kaca — tembus pandang: kontras ekstrem dan banyak tepi dari pembiasan.
  scores.set(
    MaterialType.GLASS,
    sum([
      f.lumStdDev > 52 ? 2.5 : 0,
      f.edgeDensity > 0.2 ? 2.0 : 0,
      f.saturation < 0.2 ? 1.0 : 0,
      colorful && inHueRange(f.hue, 80, 180) ? 1.5 : 0,
    ]),
  );

  // Organik — hijau/cokelat pekat, gelap, bentuknya tidak bersudut.
  scores.set(
    MaterialType.ORGANIC,
    sum([
      f.greenRatio > 0.375 ? 2.5 : 0,
      f.saturation > 0.18 && inHueRange(f.hue, 20, 160) ? 2.5 : 0,
      f.saturation > 0.28 ? 1.5 : 0,
      f.lightness < 0.55 ? 1.0 : 0,
    ]),
  );

  // MIXED = tidak teridentifikasi. Tidak ada aturan; lihat `pickBest`.
  scores.set(MaterialType.MIXED, 0);

  return scores;
}

export interface VisualVerdict {
  materialType: MaterialType;
  /**
   * Keterpisahan dugaan teratas dari dugaan kedua, `(skor1 − skor2) / skor1`,
   * dalam rentang 0–1. Bukan probabilitas dan tidak boleh disebut demikian.
   */
  score: number;
  confident: boolean;
}

/**
 * Memilih dugaan terbaik beserta kejujuran tentang seberapa lemah dugaan itu.
 *
 * Tidak ada penjepitan nilai. Bila dua kelas hampir seimbang, `score` memang
 * keluar mendekati nol dan `confident` bernilai `false` — itulah gunanya.
 * Versi sebelumnya menjepit hasilnya ke [0,35 – 0,96], sehingga tebakan paling
 * ragu pun tetap tampil sebagai "keyakinan 35%".
 */
export function pickBest(scores: Map<MaterialType, number>): VisualVerdict {
  let bestMaterial: MaterialType = MaterialType.MIXED;
  let bestScore = 0;
  let secondScore = 0;

  for (const [material, score] of scores) {
    if (score > bestScore) {
      secondScore = bestScore;
      bestScore = score;
      bestMaterial = material;
    } else if (score > secondScore) {
      secondScore = score;
    }
  }

  const score = bestScore > 0 ? (bestScore - secondScore) / bestScore : 0;
  const hasEvidence = bestScore >= MIN_VISUAL_EVIDENCE;

  return {
    materialType: hasEvidence ? bestMaterial : MaterialType.MIXED,
    score,
    confident: hasEvidence && score >= VISUAL_CONFIDENCE_THRESHOLD,
  };
}

/**
 * Tahap 2 lengkap: foto → fitur → skor → dugaan.
 * `null` berarti gambar tidak terbaca; pemanggil harus menampilkan galat.
 */
export async function estimateFromPhoto(imageUri: string): Promise<VisualVerdict | null> {
  const features = await extractFeatures(imageUri);
  if (!features) return null;
  return pickBest(scoreMaterials(features));
}

// ─── Pembantu ────────────────────────────────────────────────

/** Konversi RGB (0–255) ke HSL. */
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;

  if (d === 0) return { h: 0, s: 0, l };

  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;

  return { h: h * 360, s, l };
}

/** Apakah hue berada dalam rentang (menangani perputaran di 360°). */
function inHueRange(hue: number, min: number, max: number): boolean {
  if (min <= max) return hue >= min && hue <= max;
  return hue >= min || hue <= max;
}

function sum(values: number[]): number {
  let total = 0;
  for (const value of values) total += value;
  return total;
}

/** Fitur netral untuk buffer kosong/cacat. Tidak memenangkan kelas apa pun. */
function emptyFeatures(): ImageFeatures {
  return {
    avgR: 0,
    avgG: 0,
    avgB: 0,
    hue: 0,
    saturation: 0,
    lightness: 0,
    lumStdDev: 0,
    edgeDensity: 0,
    redRatio: 1 / 3,
    greenRatio: 1 / 3,
    blueRatio: 1 / 3,
  };
}
