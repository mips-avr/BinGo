/**
 * Validator khas Indonesia.
 */

/**
 * Validasi NIK (Nomor Induk Kependudukan).
 * Aturan dasar (ringkas):
 * - 16 digit angka.
 * - 6 digit pertama: kode provinsi (2) + kode kab/kota (2) + kode kecamatan (2),
 *   harus > 0. Validasi rinci memerlukan tabel master Dukcapil.
 * - 6 digit berikutnya: tanggal lahir DDMMYY (perempuan ditambah 40 pada hari).
 *
 * Untuk MVP kami hanya memvalidasi panjang, format angka, dan rentang tanggal lahir
 * yang masuk akal sehingga input pengguna tidak otomatis ditolak karena masalah
 * master data yang belum tersedia.
 */
export function isValidNIK(nik: string): boolean {
  if (!/^\d{16}$/.test(nik)) return false;

  const provinceCode = Number(nik.substring(0, 2));
  if (provinceCode <= 0 || provinceCode > 94) return false;

  let day = Number(nik.substring(6, 8));
  const month = Number(nik.substring(8, 10));
  const year = Number(nik.substring(10, 12));
  if (day > 40) day -= 40; // perempuan
  if (day < 1 || day > 31) return false;
  if (month < 1 || month > 12) return false;
  if (year < 0 || year > 99) return false;

  return true;
}

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
