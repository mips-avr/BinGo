/**
 * Normalisasi nama wilayah menjadi kunci pencocokan (`regionKey`).
 *
 * Papan harga selalu terikat wilayah, dan wilayah diketik manusia. Di lapangan
 * satu kecamatan yang sama ditulis dengan belasan ejaan: "Kecamatan Beji,
 * Depok", "Kec. Beji, Depok", "kecamatan beji depok", "Kelurahan Beji, Kota
 * Depok". Bila papan harga mencocokkan teks mentah, setiap ejaan menjadi
 * wilayah tersendiri, tidak ada satu pun yang mencapai ambang minimum data,
 * dan papan harga tidak pernah terbentuk.
 *
 * Karena itu setiap bukti timbang menyimpan dua nilai: `region` (ejaan asli
 * yang diketik penerbit, tetap ditampilkan apa adanya agar pengguna mengenali
 * wilayahnya) dan `regionKey` (hasil fungsi ini, dipakai untuk agregasi).
 *
 * Berkas ini sengaja diletakkan di paket bersama supaya aplikasi mobile
 * memakai fungsi yang persis sama. Bila mobile menormalkan dengan cara
 * berbeda, autocomplete akan menawarkan wilayah yang tidak pernah cocok
 * dengan agregat backend.
 *
 * Aturan (berurutan):
 *   1. huruf kecil semua;
 *   2. setiap karakter selain a–z dan 0–9 menjadi pemisah;
 *   3. buang awalan administratif Indonesia yang tidak membedakan wilayah;
 *   4. gabungkan kembali dengan satu spasi, tanpa spasi di ujung.
 *
 * Contoh:
 *   normalizeRegionKey('Kecamatan Beji, Depok')      === 'beji depok'
 *   normalizeRegionKey('  KEC. BEJI   -  DEPOK  ')   === 'beji depok'
 *   normalizeRegionKey('Kelurahan Beji, Kota Depok') === 'beji depok'
 */

/**
 * Kata yang menandai tingkat administrasi, bukan identitas wilayah.
 *
 * `kec`, `kel`, dan `kab` adalah bentuk singkat yang di lapangan hampir selalu
 * ditulis dengan titik ("Kec."). Titik sudah dihapus pada langkah 2, sehingga
 * yang tersisa dan perlu dibuang di sini adalah bentuk tanpa titiknya.
 *
 * Perhatikan bahwa "kota" ikut dibuang. Ini berarti "Kota Depok" dan "Depok"
 * menjadi kunci yang sama — memang itu yang diinginkan, karena keduanya
 * merujuk wilayah yang sama dalam percakapan sehari-hari.
 */
const ADMINISTRATIVE_PREFIXES: ReadonlySet<string> = new Set([
  'kecamatan',
  'kec',
  'kelurahan',
  'kel',
  'desa',
  'kota',
  'kabupaten',
  'kab',
  'provinsi',
]);

/**
 * Mengubah nama wilayah bebas-ketik menjadi kunci agregasi papan harga.
 *
 * Mengembalikan string kosong bila masukan tidak menyisakan kata apa pun
 * (misalnya hanya berisi tanda baca, atau hanya kata "Kecamatan"). Pemanggil
 * wajib memperlakukan hasil kosong sebagai masukan tidak sah — wilayah tanpa
 * nama tidak bisa menjadi papan harga.
 */
export function normalizeRegionKey(input: string): string {
  if (typeof input !== 'string') return '';

  const tokens = input
    .toLowerCase()
    // Semua karakter non-alfanumerik (koma, titik, tanda hubung, tab, dsb.)
    // menjadi pemisah. Menghapusnya tanpa mengganti spasi akan menyatukan
    // "beji,depok" menjadi "bejidepok".
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((token) => token.length > 0 && !ADMINISTRATIVE_PREFIXES.has(token));

  return tokens.join(' ');
}

/** Panjang maksimum `regionKey` sesuai kolom `weighing_receipts.region_key`. */
export const REGION_KEY_MAX_LENGTH = 140;

/**
 * Ringkasan satu wilayah yang sudah punya bukti timbang.
 *
 * Dipakai aplikasi mobile untuk autocomplete wilayah pada papan harga, supaya
 * pengguna memilih wilayah yang memang punya data alih-alih mengetik buta dan
 * selalu mendapat papan kosong.
 */
export interface RegionSummaryDto {
  /** Ejaan `region` dari bukti timbang terbaru pada wilayah ini. */
  label: string;
  /** Kunci agregasi hasil `normalizeRegionKey`. Inilah yang dikirim ke papan harga. */
  regionKey: string;
  /** Banyaknya bukti timbang pada wilayah ini (termasuk yang tidak masuk papan harga). */
  receiptCount: number;
}
