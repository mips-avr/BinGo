import { VerificationLevel } from './user';

/**
 * Verifikasi berjenjang pemulung — pengganti verifikasi identitas berbasis NIK.
 *
 * Alasannya bukan kenyamanan, melainkan hukum: akses data kependudukan diatur
 * Permendagri 102/2019 dan hanya terbuka bagi lembaga yang sudah menandatangani
 * perjanjian kerja sama dengan Ditjen Dukcapil. Sebuah tim mahasiswa tidak
 * termasuk di dalamnya, sehingga NIK yang dikumpulkan aplikasi ini tidak akan
 * pernah bisa dicocokkan ke sumber resmi mana pun. Yang tersisa hanyalah 16
 * digit angka yang menanggung risiko kebocoran tanpa memberi jaminan apa pun.
 *
 * Karena itu akuntabilitas dibangun dari orang yang benar-benar mengenal
 * pemulung di lapangan: mitra penerima material dan pengurus lingkungan. Yang
 * disimpan sistem hanya identitas penjamin, tanggal, status verifikasi, dan
 * jejak audit — bukan dokumen kependudukan.
 */

/** Jenis lembaga yang boleh menjamin seorang pemulung. */
export const AttestorType = {
  BANK_SAMPAH: 'BANK_SAMPAH',
  LAPAK: 'LAPAK',
  TPS3R: 'TPS3R',
  KSM_PERSAMPAHAN: 'KSM_PERSAMPAHAN',
  RT_RW: 'RT_RW',
} as const;
export type AttestorType = (typeof AttestorType)[keyof typeof AttestorType];

/** Status satu penjaminan. */
export const AgentVerificationStatus = {
  /** Diajukan pemulung, menunggu jawaban penjamin. Belum menaikkan tingkat. */
  MENUNGGU: 'MENUNGGU',
  DISETUJUI: 'DISETUJUI',
  DITOLAK: 'DITOLAK',
  /** Pernah disetujui lalu ditarik kembali oleh penjamin. */
  DICABUT: 'DICABUT',
} as const;
export type AgentVerificationStatus =
  (typeof AgentVerificationStatus)[keyof typeof AgentVerificationStatus];

/** Satu langkah pada jejak audit penjaminan. */
export const AgentVerificationAction = {
  DIAJUKAN: 'DIAJUKAN',
  DISETUJUI: 'DISETUJUI',
  DITOLAK: 'DITOLAK',
  DICABUT: 'DICABUT',
} as const;
export type AgentVerificationAction =
  (typeof AgentVerificationAction)[keyof typeof AgentVerificationAction];

/** Status penjaminan yang boleh dipilih penjamin saat memutuskan. */
export const DECIDABLE_VERIFICATION_STATUSES: readonly AgentVerificationStatus[] = [
  AgentVerificationStatus.DISETUJUI,
  AgentVerificationStatus.DITOLAK,
  AgentVerificationStatus.DICABUT,
];

// ---------------------------------------------------------------------------
// Ambang Tingkat 2
// ---------------------------------------------------------------------------

/** Banyaknya lembaga penjamin berbeda yang memenuhi syarat pertama Tingkat 2. */
export const DISTINCT_INSTITUTIONS_REQUIRED = 2;

/** Banyaknya transaksi nirsengketa untuk syarat kedua Tingkat 2. */
export const DISPUTELESS_TRANSACTIONS_REQUIRED = 10;

/** Banyaknya rekomendasi sesama pemulung Tingkat 2 untuk syarat ketiga. */
export const PEER_ENDORSEMENTS_REQUIRED = 2;

/** Berapa dari tiga syarat tambahan yang harus terpenuhi untuk naik ke Tingkat 2. */
export const LEVEL_TWO_CRITERIA_REQUIRED = 2;

/**
 * Batas berat yang membuat sebuah permintaan tergolong bernilai tinggi.
 *
 * Permintaan besar berarti uang besar berpindah tangan sekaligus, dan itulah
 * yang paling merugikan warga bila pemulungnya tidak dapat dipertanggung-
 * jawabkan. Karena itu hanya pemulung Tingkat 2 yang boleh mengambilnya.
 */
export const HIGH_VALUE_MIN_WEIGHT_KG = 20;

// ---------------------------------------------------------------------------
// DTO
// ---------------------------------------------------------------------------

/** Satu baris jejak audit penjaminan. */
export interface AgentVerificationEventDto {
  action: AgentVerificationAction;
  /** Pengguna yang melakukan langkah ini (pemulung atau penjamin). */
  actorId: string | null;
  note: string | null;
  createdAt: string;
}

/**
 * Satu penjaminan.
 *
 * Perhatikan yang TIDAK ada di sini: tidak ada nomor identitas, tidak ada
 * tanggal lahir, tidak ada unggahan dokumen. Hanya siapa yang menjamin, kapan,
 * dan bagaimana statusnya sekarang.
 */
export interface AgentVerificationDto {
  id: string;
  agentId: string;
  /** Akun operator mitra yang dimintai penjaminan. */
  attestorId: string;
  attestorType: AttestorType;
  /** Nama lembaga penjamin, disalin saat pengajuan agar riwayat tidak berubah. */
  attestorName: string;
  /** Nomor telepon lembaga penjamin saat pengajuan, untuk penelusuran. */
  attestorPhone: string;
  status: AgentVerificationStatus;
  requestedAt: string;
  decidedAt: string | null;
  note: string | null;
  /** Jejak audit, terurut dari yang paling lama. */
  events: AgentVerificationEventDto[];
}

/** Angka mentah yang menentukan tingkat seorang pemulung. */
export interface VerificationCounters {
  /** Lembaga penjamin BERBEDA di antara penjaminan berstatus DISETUJUI. */
  distinctInstitutionCount: number;
  /** Bukti timbang terlacak yang diterbitkan pemulung dan tidak disengketakan. */
  disputelessTransactionCount: number;
  /** Rekomendasi yang diterima dari pemulung Tingkat 2. */
  peerEndorsementCount: number;
}

/** Hasil penurunan tingkat beserta rincian syarat yang sudah terpenuhi. */
export interface DerivedVerificationLevel {
  level: VerificationLevel;
  criteria: AgentVerificationCriteriaDto;
  criteriaMetCount: number;
}

/**
 * Aturan penjenjangan — satu-satunya tempat aturan ini ditulis.
 *
 * Diletakkan di paket bersama, bukan di dalam service, karena tiga pemakainya
 * harus sepakat sampai ke angka terakhir: backend yang menegakkannya, seed yang
 * menyiapkan data demo, dan aplikasi mobile yang menjelaskan "kurang berapa
 * lagi" kepada pemulung. Aturan yang ditulis ulang di tiga tempat akan
 * berbeda pada perubahan pertama.
 */
export function deriveVerificationLevel(counters: VerificationCounters): DerivedVerificationLevel {
  const criteria: AgentVerificationCriteriaDto = {
    secondInstitution: counters.distinctInstitutionCount >= DISTINCT_INSTITUTIONS_REQUIRED,
    disputelessTransactions:
      counters.disputelessTransactionCount >= DISPUTELESS_TRANSACTIONS_REQUIRED,
    peerEndorsement: counters.peerEndorsementCount >= PEER_ENDORSEMENTS_REQUIRED,
  };
  const criteriaMetCount = [
    criteria.secondInstitution,
    criteria.disputelessTransactions,
    criteria.peerEndorsement,
  ].filter(Boolean).length;

  // Tanpa satu pun penjaminan yang disetujui, pemulung tetap Tingkat 0 —
  // berapa pun transaksi dan rekomendasi yang ia kumpulkan. Penjaminan mitra
  // adalah dasar seluruh jenjang ini, bukan salah satu poin yang bisa
  // digantikan poin lain.
  let level: VerificationLevel = VerificationLevel.TERDAFTAR;
  if (counters.distinctInstitutionCount >= 1) {
    level =
      criteriaMetCount >= LEVEL_TWO_CRITERIA_REQUIRED
        ? VerificationLevel.DIJAMIN_GANDA
        : VerificationLevel.DIJAMIN_MITRA;
  }

  return { level, criteria, criteriaMetCount };
}

/** Tiga syarat tambahan Tingkat 2; cukup dua yang terpenuhi. */
export interface AgentVerificationCriteriaDto {
  /** Penjaminan kedua dari lembaga yang berbeda. */
  secondInstitution: boolean;
  /** Sekurang-kurangnya `DISPUTELESS_TRANSACTIONS_REQUIRED` transaksi nirsengketa. */
  disputelessTransactions: boolean;
  /** Rekomendasi dari `PEER_ENDORSEMENTS_REQUIRED` pemulung Tingkat 2 lain. */
  peerEndorsement: boolean;
}

/** Ringkasan tingkat verifikasi seorang pemulung beserta dasar perhitungannya. */
export interface AgentVerificationStatusDto {
  agentId: string;
  level: VerificationLevel;
  /** Penjaminan berstatus DISETUJUI. */
  approvedCount: number;
  /** Lembaga penjamin berbeda di antara penjaminan yang disetujui. */
  distinctInstitutionCount: number;
  /** Bukti timbang terlacak yang diterbitkan pemulung dan tidak disengketakan. */
  disputelessTransactionCount: number;
  /** Rekomendasi yang diterima dari pemulung Tingkat 2. */
  peerEndorsementCount: number;
  criteria: AgentVerificationCriteriaDto;
  /** Berapa dari tiga syarat Tingkat 2 yang sudah terpenuhi. */
  criteriaMetCount: number;
  canAcceptJobs: boolean;
  canIssueReceipts: boolean;
  canTakeHighValueJobs: boolean;
  verifications: AgentVerificationDto[];
}

/** Pengajuan penjaminan oleh pemulung kepada satu mitra. */
export interface RequestAttestationRequest {
  /** Nomor telepon akun operator mitra yang dimintai penjaminan. */
  attestorPhone: string;
  note?: string;
}

/** Jawaban penjamin atas satu pengajuan. */
export interface DecideAttestationRequest {
  status: AgentVerificationStatus;
  note?: string;
}

/** Rekomendasi sesama pemulung Tingkat 2. */
export interface EndorseAgentRequest {
  /** Nomor telepon pemulung yang direkomendasikan. */
  agentPhone: string;
  note?: string;
}
