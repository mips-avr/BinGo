import { MaterialType } from '@bingo/shared-types';
import type { ScanResult, ScanSource } from './types';
import { DISPOSAL_TIPS_ID, SCAN_POINTS_HINT } from './disposal-tips';
import { estimateFromPhoto } from './visualClassifier';

/**
 * Pipeline TrashScan dua tahap.
 *
 *   Tahap 1 — KODE RESIN. Pengguna membaca angka di dalam segitiga daur ulang
 *             pada kemasan dan mengetuknya. Ini bukan tebakan: kode resin
 *             adalah penanda resmi yang dicetak produsen, jadi hasilnya
 *             ditegakkan langsung tanpa skor apa pun.
 *
 *   Tahap 2 — PERKIRAAN VISUAL. Dipakai hanya bila kodenya tidak terlihat
 *             (terhapus, tertutup label, kemasan terlalu kecil). Hasilnya
 *             selalu disajikan sebagai SARAN dan bisa berujung "belum yakin".
 *
 * Yang sengaja tidak ada di berkas ini: jalur cadangan yang mengarang hasil.
 * Versi sebelumnya, ketika kamera gagal, memanggil pengklasifikasi dengan URI
 * konstan `file:///fallback.jpg`, yang lalu di-hash menjadi satu material tetap
 * pada keyakinan 0,45 dan ditampilkan ke pengguna seolah-olah hasil pemindaian
 * sungguhan. Kegagalan sekarang mengembalikan `null`, dan layar pemindai wajib
 * menampilkannya sebagai galat.
 *
 * Tidak ada model AI di dalam BinGo saat ini. Tidak ada berkas `.tflite`, tidak
 * ada inferensi native, dan tidak ada cabang tipe yang berpura-pura ada.
 */

/** Peta kode resin 1–7 ke kelas material (standar SPI/ASTM D7611). */
const RESIN_CODE_MATERIAL: Record<number, MaterialType> = {
  1: MaterialType.PET,
  2: MaterialType.HDPE,
  3: MaterialType.PVC,
  4: MaterialType.LDPE,
  5: MaterialType.PP,
  6: MaterialType.PS,
  7: MaterialType.OTHER_PLASTIC,
};

function build(
  materialType: MaterialType,
  source: ScanSource,
  confident: boolean,
  visualScore: number | null,
  resinCode: number | null,
): ScanResult {
  return {
    materialType,
    source,
    confident,
    visualScore,
    resinCode,
    // Petunjuk pembuangan ditahan ketika sistem tidak yakin. Menyuruh orang
    // "cuci dan setorkan botol PET" atas dasar tebakan yang lemah adalah
    // kesalahan yang tidak bisa ditarik kembali setelah materialnya dibuang.
    disposalTip: confident ? DISPOSAL_TIPS_ID[materialType] : null,
    pointsHint: SCAN_POINTS_HINT[materialType],
  };
}

/**
 * Tahap 1 — kode resin yang ditunjuk pengguna pada kemasan.
 *
 * Tidak ada persentase keyakinan di sini, dan itu disengaja. Menampilkan
 * "Keyakinan model: 98%" atas masukan yang diketik pengguna sendiri — seperti
 * versi sebelumnya — memberi kesan ada model yang memeriksa, padahal tidak ada.
 */
export function classifyByRecyclingCode(code: number): ScanResult {
  const materialType = RESIN_CODE_MATERIAL[code];
  if (!materialType) {
    // Kode di luar 1–7 tidak memetakan ke resin mana pun: jangan tegakkan.
    return build(MaterialType.MIXED, 'resin-code', false, null, null);
  }
  return build(materialType, 'resin-code', true, null, code);
}

/**
 * Tahap 2 — perkiraan visual dari foto.
 *
 * Mengembalikan `null` bila foto tidak dapat didekode. Itu galat, bukan hasil.
 */
export async function analyzePhoto(imageUri: string): Promise<ScanResult | null> {
  const verdict = await estimateFromPhoto(imageUri);
  if (!verdict) return null;
  return build(verdict.materialType, 'visual-estimate', verdict.confident, verdict.score, null);
}

/** Pengguna mengoreksi atau memilih sendiri jenis materialnya di layar hasil. */
export function selectMaterialManually(materialType: MaterialType): ScanResult {
  return build(materialType, 'manual', true, null, null);
}
