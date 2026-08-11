/**
 * Peran pengguna dalam ekosistem BinGo.
 * Selaras dengan enum Prisma `UserRole`.
 */
export const UserRole = {
  CITIZEN: 'CITIZEN',
  WASTE_AGENT: 'WASTE_AGENT',
  MSME: 'MSME',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/**
 * Tingkat verifikasi berjenjang pemulung.
 *
 * BinGo tidak mengumpulkan NIK: tim mahasiswa tidak dapat mengakses data
 * Dukcapil secara sah (Permendagri 102/2019), sehingga "identitas terverifikasi"
 * lewat NIK adalah janji yang tidak bisa ditepati. Akuntabilitas dibangun dari
 * penjaminan berjenjang oleh mitra yang benar-benar mengenal pemulung di
 * lapangan — bank sampah, lapak, TPS3R, KSM persampahan, atau RT/RW.
 *
 *   0 — Terdaftar     : nama panggilan + nomor telepon + kata sandi, tanpa
 *                       dokumen apa pun. Boleh melihat papan harga dan peta
 *                       permintaan (radar), tidak boleh menerima pekerjaan.
 *   1 — Dijamin Mitra : satu penjaminan disetujui mitra terdaftar. Boleh
 *                       menerima penjemputan dan menerbitkan bukti timbang.
 *   2 — Dijamin Ganda : dua dari tiga syarat tambahan terpenuhi. Boleh
 *                       mengambil pekerjaan bernilai tinggi dan mendapat
 *                       prioritas radar.
 *
 * Catatan kejujuran: nomor telepon BELUM diverifikasi lewat OTP — pendaftaran
 * memakai kata sandi, dan tidak ada gerbang SMS pada MVP ini. Wilayah operasi
 * juga belum disimpan pada profil. Jangan menuliskan keduanya sebagai syarat
 * Tingkat 0 di dokumen mana pun sebelum kodenya benar-benar ada.
 */
export const VerificationLevel = {
  TERDAFTAR: 0,
  DIJAMIN_MITRA: 1,
  DIJAMIN_GANDA: 2,
} as const;
export type VerificationLevel = (typeof VerificationLevel)[keyof typeof VerificationLevel];

/** Profil publik pengguna (tanpa data sensitif). */
export interface UserProfile {
  id: string;
  name: string;
  /**
   * `null` untuk akun yang diterbitkan lewat Kartu Mitra. Akun seperti itu
   * memang belum punya nomor — justru itulah alasan kartunya ada. Nomor terisi
   * ketika pemegangnya mengklaim akunnya dari ponsel sendiri.
   */
  phone: string | null;
  role: UserRole;
  pointsBalance: number;
  /**
   * Tingkat verifikasi berjenjang. Bermakna hanya untuk `WASTE_AGENT`;
   * peran lain selalu 0 karena tidak melalui penjaminan mitra.
   */
  verificationLevel: VerificationLevel;
  createdAt: string;
}
