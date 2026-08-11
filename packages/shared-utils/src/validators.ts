/**
 * Validator khas Indonesia.
 *
 * Berkas ini pernah memuat `isValidNIK()`. Fungsi itu dihapus bersama seluruh
 * jalur pengumpulan NIK: validasi lokal atas nomor kependudukan hanya memeriksa
 * bentuknya (16 digit, tanggal lahir masuk akal) dan tidak pernah bisa
 * memastikan nomor itu benar-benar milik penggunanya. Pencocokan ke sumber
 * resmi memerlukan akses Dukcapil yang diatur Permendagri 102/2019 dan tidak
 * terbuka bagi tim ini. Yang tersisa dari validator itu hanyalah rasa aman
 * palsu, ditambah kewajiban menyimpan data pribadi berisiko tinggi.
 *
 * Akuntabilitas pemulung sekarang ditegakkan lewat verifikasi berjenjang —
 * lihat `AgentVerification` di backend dan `agent-verification.ts` di
 * @bingo/shared-types.
 */

/**
 * Normalisasi nomor telepon Indonesia ke format E.164 (+62…).
 * Mengembalikan `null` bila format tidak dikenali.
 *
 * Contoh:
 *   "08123456789"   → "+628123456789"
 *   "8123456789"    → "+628123456789"
 *   "+628123456789" → "+628123456789"
 */
export function normalizePhoneID(raw: string): string | null {
  const cleaned = raw.replace(/[\s-]/g, '');
  if (/^\+62\d{8,13}$/.test(cleaned)) return cleaned;
  if (/^62\d{8,13}$/.test(cleaned)) return `+${cleaned}`;
  if (/^0\d{8,13}$/.test(cleaned)) return `+62${cleaned.substring(1)}`;
  if (/^8\d{7,12}$/.test(cleaned)) return `+62${cleaned}`;
  return null;
}

export function isValidPhoneID(raw: string): boolean {
  return normalizePhoneID(raw) !== null;
}
