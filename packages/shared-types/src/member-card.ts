import type { VerificationLevel } from './user';

/**
 * Kartu Mitra — identitas fisik untuk penyetor yang tidak punya ponsel.
 *
 * Masalah yang diselesaikan: seluruh nilai BinGo — bukti timbang, riwayat,
 * tingkat verifikasi — mensyaratkan akun, dan akun mensyaratkan ponsel. Justru
 * pihak yang paling butuh bukti timbang adalah yang paling mungkin tidak
 * memilikinya.
 *
 * Bentuk penyelesaiannya: bank sampah menerbitkan kartu, dan kartu itu **adalah
 * akunnya**. Pemegang kartu punya `User` sungguhan dengan riwayat dan tingkat
 * verifikasi yang sama seperti pengguna beraplikasi; yang berbeda hanya cara
 * mengaksesnya — ditempelkan di konter, bukan dibuka di ponsel sendiri. Ketika
 * ia kelak punya ponsel, akun yang sama tinggal diklaim, dan seluruh riwayatnya
 * ikut. Bukan akun bayangan.
 *
 * Empat keputusan desain yang diambil dari preseden yang berhasil dan dari
 * kegagalan yang terdokumentasi:
 *
 * 1. **Tanpa syarat KTP.** Kajian Fair Circularity Initiative 2025 menemukan
 *    pemulung tersingkir dari jaminan sosial justru karena KTP tidak ada atau
 *    alamatnya tidak cocok akibat mobilitas kerja. Kartu yang mensyaratkan KTP
 *    akan menolak orang yang paling membutuhkannya. Penjaminnya adalah bank
 *    sampah penerbit, lewat mekanisme `AgentVerification` yang sudah ada.
 *
 * 2. **Kartu membawa hak, bukan sekadar pendataan.** Registri tanpa hak hanya
 *    menghasilkan basis data lokasi dan pendapatan orang miskin. Kartu Pune
 *    (1995) memberi wewenang memungut plus pinjaman tanpa bunga dan asuransi;
 *    registri Bogotá melekat pada tarif pembayaran. Di sini kartu memberi bukti
 *    timbang yang sah dan riwayat yang bisa dibawa.
 *
 * 3. **Tidak terkunci pada satu penerbit.** Kartu diterbitkan satu bank sampah,
 *    tetapi berlaku di seluruh mitra. Ketika Octopus berhenti beroperasi pada
 *    2024, "pelestari"-nya kehilangan akses ke pendapatan yang sudah tercatat.
 *    Identitas ekonomi seseorang tidak boleh bergantung pada solvabilitas satu
 *    perusahaan.
 *
 * 4. **Tanpa biometrik.** Sidik jari pekerja manual aus karena pekerjaannya
 *    sendiri; sistem berbasis sidik jari justru paling sering gagal pada
 *    kelompok ini.
 */
export type MemberCardStatus = 'AKTIF' | 'DIBEKUKAN' | 'HILANG';

export const MEMBER_CARD_STATUS_LABEL: Record<MemberCardStatus, string> = {
  AKTIF: 'Aktif',
  DIBEKUKAN: 'Dibekukan',
  HILANG: 'Dilaporkan hilang',
};

export interface MemberCardDto {
  id: string;
  /** Nomor tercetak di kartu. Inilah jalur cadangan ketika NFC gagal dibaca. */
  cardNumber: string;
  /** UID chip NFC. Disembunyikan sebagian; hanya penerbit yang melihat utuh. */
  cardUidMasked: string | null;
  holderName: string;
  holderPhone: string | null;
  /** Akun yang diwakili kartu ini. Akun sungguhan, bukan bayangan. */
  holderUserId: string;
  verificationLevel: VerificationLevel;
  status: MemberCardStatus;
  issuedByName: string;
  issuedAt: string;
  lastUsedAt: string | null;
  region: string;
  regionKey: string;
  /** Sudah pernah diklaim pemegangnya lewat ponsel sendiri. */
  claimed: boolean;
  note: string | null;
}

/** Ringkasan yang muncul di konter begitu kartu ditempel. */
export interface CardTapResultDto {
  card: MemberCardDto;
  receiptCount: number;
  totalWeightKg: number;
  totalNetAmount: number;
  lastReceiptAt: string | null;
}

export const CARD_NUMBER_PREFIX = 'BG';
export const CARD_NUMBER_LENGTH = 12;

/**
 * Format nomor kartu: `BG-XXXX-XXXX`, memakai alfabet Crockford Base32 yang
 * membuang I, L, O, dan U — huruf yang paling sering tertukar dengan 1 dan 0
 * ketika seseorang membacakan nomor lewat telepon atau menyalinnya dari kartu
 * yang sudah kotor.
 */
export const CARD_NUMBER_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

const CARD_NUMBER_PATTERN = /^BG-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/;

export function isValidCardNumber(value: string): boolean {
  return CARD_NUMBER_PATTERN.test(value.trim().toUpperCase());
}

export function normalizeCardNumber(value: string): string {
  const raw = value
    .trim()
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    // Toleransi salah baca yang paling lazim, dinormalkan ke alfabetnya.
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1')
    .replace(/U/g, 'V');
  const body = raw.startsWith('BG') ? raw.slice(2) : raw;
  if (body.length !== 8) return value.trim().toUpperCase();
  return `BG-${body.slice(0, 4)}-${body.slice(4)}`;
}

/** Menyisakan empat karakter terakhir; sisanya ditutup. */
export function maskCardUid(uid: string): string {
  const clean = uid.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
  if (clean.length <= 4) return clean;
  return `${'•'.repeat(Math.max(0, clean.length - 4))}${clean.slice(-4)}`;
}
