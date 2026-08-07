/**
 * Seed komprehensif BinGo MVP demo.
 *
 * Mengisi:
 * - 14 demo users (Warga, Pemulung, UMKM, penyetor & operator mitra tambahan)
 *   dengan password `demo12345678`
 * - 4 produk WasteMart (kemasan ramah lingkungan)
 * - 6 pickup requests Jakarta (berbagai status) + 4 permintaan PENDING di Beji,
 *   Depok untuk mendemokan radar pemulung
 * - 4 reports (berbagai status) beserta baris verifikasinya
 * - 3 transaksi UMKM
 * - 28 bukti timbang di tiga wilayah, sumber data papan harga
 * - verifikasi berjenjang pemulung: satu akun di setiap tingkat (0, 1, 2),
 *   penjaminan berstatus MENUNGGU dan DICABUT, jejak audit, serta satu bukti
 *   timbang yang disengketakan penyetor
 *
 * Idempoten — aman dijalankan ulang (cek by phone/itemName/imageUrl/nomor bukti).
 */
import { config as loadDotEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import type { AttestorType, MaterialGrade, MaterialType } from '@bingo/shared-types';
import { MATERIAL_GRADES, deriveVerificationLevel, normalizeRegionKey } from '@bingo/shared-types';

for (const p of [resolve(__dirname, '../.env'), resolve(__dirname, '../../../.env')]) {
  if (existsSync(p)) {
    loadDotEnv({ path: p });
    break;
  }
}

// Seed memakai fungsi normalisasi wilayah yang sama dengan backend dan mobile.
// Bila paket bersama belum dibangun, `dist`-nya belum memuat fungsi ini dan
// bukti timbang akan tersimpan dengan regionKey kosong — papan harga lalu
// tampak kosong tanpa sebab yang jelas. Lebih baik gagal di sini, dengan
// petunjuk yang bisa langsung dikerjakan.
if (typeof normalizeRegionKey !== 'function') {
  throw new Error(
    'normalizeRegionKey tidak ditemukan di @bingo/shared-types. ' +
      'Jalankan `pnpm shared:build` lebih dahulu, lalu ulangi seed.',
  );
}

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'demo12345678';
const BCRYPT_ROUNDS = 10;

// ─── Demo Users ──────────────────────────────────────────────

interface SeedUser {
  name: string;
  phone: string;
  role: 'CITIZEN' | 'WASTE_AGENT' | 'MSME';
  pointsBalance: number;
  /**
   * Diisi hanya untuk akun operator mitra terdaftar. Kolom ini tidak dapat
   * disetel dari aplikasi — pendaftaran mitra dilakukan di luar BinGo, supaya
   * dua akun Tingkat 0 tidak bisa saling menjamin untuk naik tingkat.
   */
  partnerType?: AttestorType;
  partnerName?: string;
}

/**
 * Perhatikan tidak adanya kolom NIK di sini maupun di tabel `users`.
 * Verifikasi pemulung dilakukan lewat penjaminan mitra; lihat SEED_ATTESTATIONS
 * di bawah.
 */

/** Tiga akun utama yang dipakai saat demo login. */
const DEMO_USERS: SeedUser[] = [
  {
    name: 'Budi Santoso',
    phone: '+6281111111111',
    role: 'CITIZEN',
    pointsBalance: 75,
  },
  {
    name: 'Agus Pramono',
    phone: '+6282222222222',
    role: 'WASTE_AGENT',
    pointsBalance: 0,
  },
  {
    name: 'Siti Rahayu',
    phone: '+6283333333333',
    role: 'MSME',
    pointsBalance: 0,
  },
];

/**
 * Pemeran pendukung.
 *
 * Papan harga hanya bermakna bila datanya berasal dari banyak orang: sebaran
 * harga yang seluruhnya berasal dari satu penyetor dan satu penerima bukanlah
 * informasi pasar, melainkan catatan pribadi. Karena itu seed menyediakan
 * empat penyetor dan beberapa operator mitra tambahan.
 *
 * Tiga pemulung terakhir menyiapkan demo verifikasi berjenjang: Hendra sudah
 * Tingkat 2, Agus/Slamet/Yanti Tingkat 1, dan Tono masih Tingkat 0.
 */
const SUPPORTING_USERS: SeedUser[] = [
  {
    name: 'Dewi Anggraini',
    phone: '+6281234500011',
    role: 'CITIZEN',
    pointsBalance: 120,
  },
  {
    name: 'Rina Kartika',
    phone: '+6281234500012',
    role: 'CITIZEN',
    pointsBalance: 95,
  },
  {
    name: 'Joko Susilo',
    phone: '+6281234500013',
    role: 'CITIZEN',
    pointsBalance: 60,
  },
  {
    name: 'Marni Sulastri',
    phone: '+6281234500014',
    role: 'CITIZEN',
    pointsBalance: 45,
  },
  {
    name: 'Slamet Riyadi',
    phone: '+6281234500021',
    role: 'WASTE_AGENT',
    pointsBalance: 0,
    // Pemilik lapak yang juga menjemput sendiri — lazim di lapangan, dan
    // membuatnya sekaligus dapat menjamin pemulung lain.
    partnerType: 'LAPAK',
    partnerName: 'Lapak Pak Slamet',
  },
  {
    name: 'Yanti Marlina',
    phone: '+6281234500022',
    role: 'WASTE_AGENT',
    pointsBalance: 0,
    partnerType: 'LAPAK',
    partnerName: 'Pengepul Berkah Jaya',
  },
  {
    name: 'Operator Bank Sampah Melati',
    phone: '+6281234500031',
    role: 'WASTE_AGENT',
    pointsBalance: 0,
    partnerType: 'BANK_SAMPAH',
    partnerName: 'Bank Sampah Melati',
  },
  {
    name: 'Operator TPS3R Beji Bersih',
    phone: '+6281234500032',
    role: 'WASTE_AGENT',
    pointsBalance: 0,
    partnerType: 'TPS3R',
    partnerName: 'TPS3R Beji Bersih',
  },
  {
    name: 'Ketua RT 05 RW 03 Beji',
    phone: '+6281234500033',
    role: 'WASTE_AGENT',
    pointsBalance: 0,
    partnerType: 'RT_RW',
    partnerName: 'RT 05 RW 03 Beji',
  },
  {
    name: 'Hendra Gunawan',
    phone: '+6281234500042',
    role: 'WASTE_AGENT',
    pointsBalance: 0,
  },
  {
    name: 'Tono Wijaya',
    phone: '+6281234500041',
    role: 'WASTE_AGENT',
    pointsBalance: 0,
  },
];

const BUDI = '+6281111111111';
const AGUS = '+6282222222222';
const SITI = '+6283333333333';
const DEWI = '+6281234500011';
const RINA = '+6281234500012';
const JOKO = '+6281234500013';
const MARNI = '+6281234500014';
const SLAMET = '+6281234500021';
const YANTI = '+6281234500022';
const MELATI_OP = '+6281234500031';
const TPS3R_OP = '+6281234500032';
const RTRW_OP = '+6281234500033';
const TONO = '+6281234500041';
const HENDRA = '+6281234500042';

// ─── WasteMart Products ─────────────────────────────────────

const SEED_ITEMS = [
  {
    supplierName: 'CV Hijau Lestari',
    itemName: 'Kantong kraft food-grade 30x40 cm',
    description:
      'Kantong kertas kraft food-grade tahan minyak, cocok untuk usaha kuliner. Dapat didaur ulang.',
    price: 1500,
    minOrderQty: 100,
    stock: 5000,
    imageUrl: 'https://picsum.photos/seed/bingomart1/800/600',
  },
  {
    supplierName: 'UD Bumi Bersih',
    itemName: 'Sedotan bambu reusable 21 cm',
    description: 'Sedotan bambu organik, dapat dicuci & dipakai berulang. Pengganti sedotan plastik.',
    price: 2500,
    minOrderQty: 50,
    stock: 2000,
    imageUrl: 'https://picsum.photos/seed/bingomart2/800/600',
  },
  {
    supplierName: 'CV Daur Mandiri',
    itemName: 'Kotak makan bagasse 750 ml',
    description: 'Kotak makan dari ampas tebu, mudah terurai 90 hari. Aman microwave & oven.',
    price: 1750,
    minOrderQty: 200,
    stock: 3000,
    imageUrl: 'https://picsum.photos/seed/bingomart3/800/600',
  },
  {
    supplierName: 'PT Eco Wraps Nusantara',
    itemName: 'Beeswax wrap pengganti plastik (3 ukuran)',
    description:
      'Pembungkus makanan dari kain katun + lilin lebah. Reusable hingga 1 tahun, bebas plastik sekali pakai.',
    price: 75000,
    minOrderQty: 5,
    stock: 200,
    imageUrl: 'https://picsum.photos/seed/bingomart4/800/600',
  },
];

// ─── Pickup Requests (Jakarta area) ─────────────────────────

const PICKUP_REQUESTS = [
  {
    status: 'PENDING' as const,
    lat: -6.2088,
    lng: 106.8456,
    address: 'Jl. Sudirman Kav. 52-53, Jakarta Pusat',
    materialType: 'PET' as const,
    estimatedWeightKg: 3.5,
    notes: 'Botol air mineral bekas, sudah dicuci.',
  },
  {
    status: 'PENDING' as const,
    lat: -6.1751,
    lng: 106.827,
    address: 'Jl. Kemang Raya No. 18, Jakarta Selatan',
    materialType: 'PAPER' as const,
    estimatedWeightKg: 8.0,
    notes: 'Kardus bekas belanja online, sudah dilipat rapi.',
  },
  {
    status: 'ACCEPTED' as const,
    lat: -6.2297,
    lng: 106.6895,
    address: 'Jl. Meruya Ilir No. 7, Jakarta Barat',
    materialType: 'METAL' as const,
    estimatedWeightKg: 5.0,
    notes: 'Kaleng minuman dan tutup botol.',
    needAgent: true,
  },
  {
    status: 'COMPLETED' as const,
    lat: -6.1862,
    lng: 106.8348,
    address: 'Jl. Menteng Raya No. 31, Jakarta Pusat',
    materialType: 'HDPE' as const,
    estimatedWeightKg: 2.0,
    notes: null,
    needAgent: true,
  },
  {
    status: 'COMPLETED' as const,
    lat: -6.2383,
    lng: 106.7942,
    address: 'Jl. Pesanggrahan Raya, Jakarta Selatan',
    materialType: 'GLASS' as const,
    estimatedWeightKg: 6.5,
    notes: 'Botol kaca bekas sirup, hati-hati pecah.',
    needAgent: true,
  },
  {
    status: 'CANCELLED' as const,
    lat: -6.1475,
    lng: 106.8694,
    address: 'Jl. Kelapa Gading Boul., Jakarta Utara',
    materialType: 'MIXED' as const,
    estimatedWeightKg: 1.5,
    notes: 'Batal — sampah sudah diambil petugas RT.',
  },
];

/** Titik acuan wilayah demo. */
const BEJI_CENTER = { lat: -6.376, lng: 106.818 };
const CIMANGGIS_CENTER = { lat: -6.3689, lng: 106.872 };
const SUKMAJAYA_CENTER = { lat: -6.3925, lng: 106.8352 };

/**
 * Permintaan PENDING di sekitar Beji, Depok — bahan demo radar pemulung.
 *
 * Sengaja ditebar ke empat arah mata angin yang berbeda dari titik acuan,
 * dengan jenis material dan berat yang berbeda pula, supaya `bearingDegrees`
 * serta saringan `materialType` dan `minWeightKg` semuanya kelihatan bekerja
 * pada satu layar.
 */
const RADAR_PICKUPS: Array<{
  sellerPhone: string;
  lat: number;
  lng: number;
  address: string;
  materialType: MaterialType;
  estimatedWeightKg: number;
  notes: string | null;
  hoursAgo: number;
}> = [
  {
    sellerPhone: DEWI,
    lat: -6.3652,
    lng: 106.818,
    address: 'Jl. Kemiri Raya No. 12, Beji, Depok',
    materialType: 'PET',
    estimatedWeightKg: 9.5,
    notes: 'Botol bening satu karung besar, sudah dipipihkan.',
    hoursAgo: 1,
  },
  {
    sellerPhone: RINA,
    lat: -6.376,
    lng: 106.8315,
    address: 'Jl. Palakali Raya No. 45, Beji Timur, Depok',
    materialType: 'PAPER',
    estimatedWeightKg: 24.0,
    notes: 'Kardus toko, tolong bawa gerobak.',
    hoursAgo: 4,
  },
  {
    sellerPhone: JOKO,
    lat: -6.3887,
    lng: 106.8053,
    address: 'Jl. Krukut Raya No. 8, Beji, Depok',
    materialType: 'METAL',
    estimatedWeightKg: 2.2,
    notes: 'Kaleng minuman, jumlahnya sedikit.',
    hoursAgo: 26,
  },
  {
    sellerPhone: MARNI,
    lat: -6.382,
    lng: 106.823,
    address: 'Jl. Tanah Baru No. 77, Beji, Depok',
    materialType: 'PP',
    estimatedWeightKg: 13.0,
    notes: 'Gelas plastik bekas hajatan, sudah dibilas.',
    hoursAgo: 50,
  },
];

// ─── Reports ────────────────────────────────────────────────

/**
 * `verifiers` menentukan siapa saja yang menyatakan laporan ini benar.
 *
 * `verification_count` tidak lagi ditulis sebagai angka lepas: ia dihitung
 * ulang dari baris `report_verifications` yang benar-benar ada, persis seperti
 * yang dilakukan ReportsService.verify(). Dengan begitu data demo tidak dapat
 * menampilkan angka yang tidak punya orang di belakangnya.
 */
const SEED_REPORTS: Array<{
  status: 'DILAPORKAN' | 'DIVERIFIKASI' | 'SELESAI';
  lat: number;
  lng: number;
  description: string;
  imageUrl: string;
  verifiers: string[];
}> = [
  {
    status: 'DILAPORKAN',
    lat: -6.2146,
    lng: 106.8451,
    description: 'Tumpukan sampah plastik di pinggir sungai Ciliwung dekat jembatan.',
    imageUrl: 'https://picsum.photos/seed/bingoreport1/800/600',
    verifiers: [AGUS],
  },
  {
    status: 'DILAPORKAN',
    lat: -6.1944,
    lng: 106.823,
    description: 'Kantong sampah dibuang di trotoar depan minimarket, mengganggu pejalan kaki.',
    imageUrl: 'https://picsum.photos/seed/bingoreport2/800/600',
    verifiers: [],
  },
  {
    status: 'DIVERIFIKASI',
    lat: -6.2408,
    lng: 106.7984,
    description: 'Pembuangan limbah konstruksi ilegal di lahan kosong RT 05.',
    imageUrl: 'https://picsum.photos/seed/bingoreport3/800/600',
    verifiers: [AGUS, SITI, DEWI],
  },
  {
    status: 'SELESAI',
    lat: -6.1753,
    lng: 106.8278,
    description: 'Sampah organik pasar yang menumpuk, sudah dibersihkan petugas DLH.',
    imageUrl: 'https://picsum.photos/seed/bingoreport4/800/600',
    verifiers: [AGUS, SITI, DEWI, RINA],
  },
];

// ─── Bukti timbang & papan harga ────────────────────────────

interface SeedReceiptLine {
  grade: MaterialGrade;
  weightKg: number;
  pricePerKg: number;
  deductionKg?: number;
  deductionReason?: string;
  deductionAmount?: number;
}

interface SeedReceipt {
  /** Nomor urut untuk nomor bukti yang deterministik (idempotensi). */
  seq: number;
  daysAgo: number;
  sellerPhone: string;
  agentPhone: string;
  partnerName: string;
  /** Ejaan wilayah sengaja berbeda-beda; lihat catatan di bawah. */
  region: string;
  scaleTeraNo: string | null;
  walkIn?: boolean;
  notes?: string;
  /** Bila diisi, penyetor mempersoalkan bukti ini setelah `daysAgo` berlalu. */
  disputed?: { daysAgo: number; reason: string };
  lines: SeedReceiptLine[];
}

/**
 * Bukti timbang demo.
 *
 * Tiga hal disengaja di sini dan ketiganya adalah inti demo papan harga:
 *
 * 1. EJAAN WILAYAH BERBEDA-BEDA. "Kecamatan Beji, Depok", "Kec. Beji, Depok",
 *    "Kelurahan Beji, Kota Depok", dan "kecamatan beji depok" semuanya menjadi
 *    regionKey `beji depok` dan menyatu di papan yang sama. Inilah bukti bahwa
 *    normalisasi wilayah bekerja — tanpanya keempat ejaan ini akan menjadi
 *    empat wilayah terpisah yang tak satu pun cukup datanya.
 *
 * 2. HARGA BERBEDA ANTAR-MITRA untuk grade yang sama. Gelas plastik bening
 *    dihargai Rp1.300 di satu bank sampah dan Rp2.400 di pengepul lain pada
 *    wilayah yang sama. Sebaran P25–median–P75 yang lebar itulah keluaran
 *    papan harga; papan yang semua angkanya sama tidak memberi tahu apa pun.
 *    Angka mengikuti rentang yang tercatat di lapangan: gelas plastik bening
 *    Rp1.200–2.480 di Depok, botol PET bening Rp3.000–4.500, kardus
 *    Rp1.200–2.000, kaleng/aluminium Rp10.000–14.000 per kilogram.
 *
 * 3. DUA BUKTI YANG SENGAJA DIKELUARKAN dari papan (seq 16 dan 17), dengan
 *    harga yang jauh di atas pasar. Bila aturan pengecualian rusak, keduanya
 *    akan langsung terlihat menarik median ke atas.
 */
const SEED_RECEIPTS: SeedReceipt[] = [
  // ── Beji, Depok — tujuh hari terakhir (masuk papan harga bawaan) ──
  {
    seq: 1,
    daysAgo: 1,
    sellerPhone: DEWI,
    agentPhone: AGUS,
    partnerName: 'Bank Sampah Melati',
    region: 'Kecamatan Beji, Depok',
    scaleTeraNo: 'DPK-2026-001183',
    lines: [
      { grade: 'PP_GELAS_BENING', weightKg: 12.4, pricePerKg: 1300 },
      { grade: 'KERTAS_KARDUS', weightKg: 18.0, pricePerKg: 1250 },
    ],
  },
  {
    seq: 2,
    daysAgo: 2,
    sellerPhone: RINA,
    agentPhone: SLAMET,
    partnerName: 'Lapak Pak Slamet',
    region: 'Kec. Beji, Depok',
    scaleTeraNo: 'DPK-2026-002047',
    lines: [
      { grade: 'PP_GELAS_BENING', weightKg: 9.8, pricePerKg: 1800 },
      { grade: 'PET_BOTOL_BENING', weightKg: 6.5, pricePerKg: 3600 },
    ],
  },
  {
    seq: 3,
    daysAgo: 2,
    sellerPhone: JOKO,
    agentPhone: YANTI,
    partnerName: 'Pengepul Berkah Jaya',
    region: 'Kelurahan Beji, Kota Depok',
    scaleTeraNo: 'DPK-2026-003390',
    lines: [
      { grade: 'PP_GELAS_BENING', weightKg: 15.2, pricePerKg: 2400 },
      { grade: 'LOGAM_KALENG', weightKg: 3.4, pricePerKg: 13500 },
    ],
  },
  {
    seq: 4,
    daysAgo: 3,
    sellerPhone: MARNI,
    agentPhone: AGUS,
    partnerName: 'Bank Sampah Melati',
    region: 'kecamatan beji depok',
    scaleTeraNo: 'DPK-2026-001183',
    lines: [
      { grade: 'PET_BOTOL_BENING', weightKg: 11.0, pricePerKg: 3000 },
      {
        grade: 'KERTAS_KARDUS',
        weightKg: 22.5,
        pricePerKg: 1400,
        deductionKg: 1.5,
        deductionReason: 'Kardus lembap karena kehujanan',
      },
    ],
  },
  {
    seq: 5,
    daysAgo: 4,
    sellerPhone: BUDI,
    agentPhone: SLAMET,
    partnerName: 'Lapak Pak Slamet',
    region: 'Kecamatan Beji, Depok',
    scaleTeraNo: 'DPK-2026-002047',
    lines: [
      { grade: 'PET_BOTOL_BENING', weightKg: 8.2, pricePerKg: 4200 },
      { grade: 'LOGAM_KALENG', weightKg: 2.1, pricePerKg: 10500 },
    ],
  },
  {
    seq: 6,
    daysAgo: 5,
    sellerPhone: DEWI,
    agentPhone: YANTI,
    partnerName: 'Pengepul Berkah Jaya',
    region: 'Kec. Beji, Depok',
    scaleTeraNo: 'DPK-2026-003390',
    lines: [
      { grade: 'KERTAS_KARDUS', weightKg: 30.0, pricePerKg: 1900 },
      {
        grade: 'LOGAM_KALENG',
        weightKg: 4.8,
        pricePerKg: 12000,
        deductionAmount: 5000,
        deductionReason: 'Biaya angkut dari rumah ke lapak',
      },
    ],
  },
  {
    seq: 7,
    daysAgo: 5,
    sellerPhone: RINA,
    agentPhone: AGUS,
    partnerName: 'Bank Sampah Melati',
    region: 'Kecamatan Beji, Depok',
    scaleTeraNo: 'DPK-2026-001183',
    lines: [
      { grade: 'PP_GELAS_BENING', weightKg: 7.6, pricePerKg: 1500 },
      {
        grade: 'PET_BOTOL_BENING',
        weightKg: 5.4,
        pricePerKg: 3300,
        deductionAmount: 3000,
        deductionReason: 'Biaya karung dan tali',
      },
    ],
  },
  {
    seq: 8,
    daysAgo: 6,
    sellerPhone: JOKO,
    agentPhone: SLAMET,
    partnerName: 'Lapak Pak Slamet',
    region: 'Kelurahan Beji, Kota Depok',
    scaleTeraNo: 'DPK-2026-002047',
    lines: [
      { grade: 'KERTAS_KARDUS', weightKg: 26.0, pricePerKg: 1600 },
      { grade: 'LOGAM_ALUMINIUM', weightKg: 1.8, pricePerKg: 12500 },
    ],
  },
  {
    seq: 9,
    daysAgo: 6,
    sellerPhone: MARNI,
    agentPhone: YANTI,
    partnerName: 'Pengepul Berkah Jaya',
    region: 'kecamatan beji depok',
    scaleTeraNo: 'DPK-2026-003390',
    lines: [
      { grade: 'PP_GELAS_BENING', weightKg: 10.5, pricePerKg: 2100 },
      {
        grade: 'LOGAM_KALENG',
        weightKg: 3.0,
        pricePerKg: 11500,
        deductionKg: 0.4,
        deductionReason: 'Kaleng masih basah dan bersisa cairan',
      },
    ],
  },

  // ── Beji, Depok — lebih lama dari 7 hari (tampil pada windowDays=30) ──
  {
    seq: 10,
    daysAgo: 12,
    sellerPhone: DEWI,
    agentPhone: AGUS,
    partnerName: 'Bank Sampah Melati',
    region: 'Kecamatan Beji, Depok',
    scaleTeraNo: 'DPK-2026-001183',
    lines: [
      { grade: 'PP_GELAS_BENING', weightKg: 14.0, pricePerKg: 1250 },
      { grade: 'KERTAS_KARDUS', weightKg: 20.0, pricePerKg: 1200 },
    ],
  },
  {
    seq: 11,
    daysAgo: 18,
    sellerPhone: RINA,
    agentPhone: SLAMET,
    partnerName: 'Lapak Pak Slamet',
    region: 'Kec. Beji, Depok',
    scaleTeraNo: 'DPK-2026-002047',
    lines: [
      { grade: 'PET_BOTOL_BENING', weightKg: 9.4, pricePerKg: 3100 },
      { grade: 'LOGAM_KALENG', weightKg: 2.6, pricePerKg: 10800 },
    ],
  },
  {
    seq: 12,
    daysAgo: 25,
    sellerPhone: JOKO,
    agentPhone: YANTI,
    partnerName: 'Pengepul Berkah Jaya',
    region: 'Kelurahan Beji, Kota Depok',
    scaleTeraNo: 'DPK-2026-003390',
    lines: [
      { grade: 'PP_GELAS_BENING', weightKg: 11.2, pricePerKg: 2480 },
      { grade: 'KERTAS_KARDUS', weightKg: 17.5, pricePerKg: 2000 },
    ],
  },
  {
    seq: 13,
    daysAgo: 29,
    sellerPhone: MARNI,
    agentPhone: AGUS,
    partnerName: 'Bank Sampah Melati',
    region: 'Kecamatan Beji, Depok',
    scaleTeraNo: 'DPK-2026-001183',
    lines: [
      { grade: 'LOGAM_ALUMINIUM', weightKg: 2.4, pricePerKg: 14000 },
      { grade: 'PET_BOTOL_BENING', weightKg: 7.0, pricePerKg: 3450 },
    ],
  },

  // ── Cimanggis, Depok — sengaja tipis, untuk keadaan "data belum cukup" ──
  // Dua bukti dari SATU mitra saja. Sampelnya boleh saja terlihat banyak,
  // tetapi satu mitra berarti angkanya adalah pengumuman satu pembeli, bukan
  // informasi pasar — dan papan harga harus mengatakan itu apa adanya.
  {
    seq: 14,
    daysAgo: 3,
    sellerPhone: BUDI,
    agentPhone: AGUS,
    partnerName: 'Bank Sampah Anggrek',
    region: 'Kecamatan Cimanggis, Depok',
    scaleTeraNo: 'DPK-2026-004512',
    lines: [
      { grade: 'PP_GELAS_BENING', weightKg: 6.0, pricePerKg: 1600 },
      { grade: 'PET_BOTOL_BENING', weightKg: 4.2, pricePerKg: 3400 },
    ],
  },
  {
    seq: 15,
    daysAgo: 6,
    sellerPhone: DEWI,
    agentPhone: AGUS,
    partnerName: 'Bank Sampah Anggrek',
    region: 'Kec. Cimanggis, Depok',
    scaleTeraNo: 'DPK-2026-004512',
    lines: [
      { grade: 'PP_GELAS_BENING', weightKg: 5.5, pricePerKg: 1550 },
      { grade: 'KERTAS_KARDUS', weightKg: 12.0, pricePerKg: 1350 },
    ],
  },

  // ── Dua bukti yang sengaja TIDAK boleh masuk papan harga ──
  {
    seq: 16,
    daysAgo: 2,
    sellerPhone: RINA,
    agentPhone: SLAMET,
    partnerName: 'Lapak Pak Slamet',
    region: 'Kecamatan Beji, Depok',
    scaleTeraNo: 'DPK-2026-002047',
    walkIn: true,
    notes:
      'Setoran langsung ke lapak tanpa penjemputan. Tercatat penuh, tetapi tidak dihitung ke papan harga.',
    lines: [
      { grade: 'PP_GELAS_BENING', weightKg: 8.0, pricePerKg: 5000 },
      { grade: 'PET_BOTOL_BENING', weightKg: 6.0, pricePerKg: 6000 },
    ],
  },
  {
    seq: 17,
    daysAgo: 4,
    sellerPhone: JOKO,
    agentPhone: AGUS,
    partnerName: 'Bank Sampah Melati',
    region: 'Kecamatan Beji, Depok',
    scaleTeraNo: null,
    notes:
      'Timbangan mitra belum ditera ulang. Bukti tetap sah bagi kedua pihak, tetapi beratnya tidak dapat dipertanggungjawabkan sehingga tidak masuk papan harga.',
    lines: [{ grade: 'KERTAS_KARDUS', weightKg: 15.0, pricePerKg: 2600 }],
  },
];

// ─── Rekam jejak Tingkat 2 (Sukmajaya, Depok) ───────────────

const SUKMAJAYA_PARTNERS = [
  { name: 'Bank Sampah Tunas Mekar', tera: 'DPK-2026-005120' },
  { name: 'Lapak Sukmajaya Jaya', tera: 'DPK-2026-006233' },
];

const SUKMAJAYA_SELLERS = [DEWI, RINA, JOKO, MARNI, BUDI];

/**
 * Sebelas bukti timbang milik Hendra Gunawan di Sukmajaya, sepuluh di antaranya
 * nirsengketa.
 *
 * Ini bukan data pengisi. Syarat kedua Tingkat 2 berbunyi "sekurang-kurangnya
 * sepuluh transaksi nirsengketa", dan syarat itu hanya dapat dibuktikan
 * bekerja bila ada akun yang benar-benar memilikinya. Bukti terakhir (seq 111)
 * sengaja dipersoalkan penyetor: dengan begitu Hendra memiliki sebelas
 * transaksi tetapi tepat sepuluh yang dihitung — bila aturan "nirsengketa"
 * rusak dan sengketa ikut terhitung, tidak ada yang berubah pada tingkatnya,
 * tetapi bila satu bukti lagi disengketakan ia harus turun ke Tingkat 1.
 *
 * Wilayahnya sengaja ketiga, terpisah dari Beji dan Cimanggis, supaya sebaran
 * papan harga kedua wilayah demo itu tidak bergeser oleh data ini.
 */
const SUKMAJAYA_RECEIPTS: SeedReceipt[] = Array.from({ length: 11 }, (_, i) => {
  const seq = 101 + i;
  const partner = SUKMAJAYA_PARTNERS[i % SUKMAJAYA_PARTNERS.length]!;
  const isLast = i === 10;
  return {
    seq,
    daysAgo: 2 + i * 2,
    sellerPhone: SUKMAJAYA_SELLERS[i % SUKMAJAYA_SELLERS.length]!,
    agentPhone: HENDRA,
    partnerName: partner.name,
    region: i % 3 === 0 ? 'Kecamatan Sukmajaya, Depok' : 'Kec. Sukmajaya, Depok',
    scaleTeraNo: partner.tera,
    disputed: isLast
      ? {
          daysAgo: 1,
          reason:
            'Potongan berat 2 kg dicatat karena "kadar air", padahal kardus diserahkan dalam keadaan kering.',
        }
      : undefined,
    // Angka berat sengaja hanya satu desimal supaya tetap eksak tanpa
    // pembulatan — helper `round2` belum terdefinisi pada saat modul ini
    // dievaluasi.
    lines: [
      {
        grade: 'PET_BOTOL_BENING',
        weightKg: 6 + (i % 4) * 1.5,
        pricePerKg: 3100 + (i % 5) * 220,
      },
      {
        grade: 'KERTAS_KARDUS',
        weightKg: 14 + (i % 3) * 4,
        pricePerKg: 1300 + (i % 4) * 180,
      },
    ],
  };
});

// ─── Verifikasi berjenjang pemulung ─────────────────────────

interface SeedAttestation {
  /** Pemulung yang dijamin. */
  agentPhone: string;
  /** Akun operator mitra yang menjamin. */
  attestorPhone: string;
  status: 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK' | 'DICABUT';
  requestedDaysAgo: number;
  decidedDaysAgo?: number;
  note?: string;
  /** Catatan pada langkah keputusan, tersimpan di jejak audit. */
  decisionNote?: string;
}

/**
 * Penjaminan demo.
 *
 * Empat keadaan sengaja hadir semua, karena keempatnya harus dapat diperiksa
 * juri tanpa harus mengarang data sendiri:
 *   - DISETUJUI  → menaikkan tingkat (Agus, Slamet, Yanti, Hendra ×2);
 *   - MENUNGGU   → belum menaikkan apa pun (Tono);
 *   - DICABUT    → pernah disetujui lalu ditarik, dan tingkatnya turun
 *                  kembali (Tono). Inilah yang paling sulit dipercaya bila
 *                  hanya ditulis di proposal.
 */
const SEED_ATTESTATIONS: SeedAttestation[] = [
  {
    agentPhone: AGUS,
    attestorPhone: MELATI_OP,
    status: 'DISETUJUI',
    requestedDaysAgo: 120,
    decidedDaysAgo: 118,
    note: 'Menyetor rutin ke Bank Sampah Melati sejak 2023.',
    decisionNote: 'Dikenal pengurus, tidak pernah ada keluhan warga.',
  },
  {
    agentPhone: SLAMET,
    attestorPhone: MELATI_OP,
    status: 'DISETUJUI',
    requestedDaysAgo: 100,
    decidedDaysAgo: 99,
    decisionNote: 'Pemilik lapak mitra, alamat lapak terverifikasi pengurus.',
  },
  {
    agentPhone: YANTI,
    attestorPhone: TPS3R_OP,
    status: 'DISETUJUI',
    requestedDaysAgo: 95,
    decidedDaysAgo: 92,
    decisionNote: 'Menyetor residu ke TPS3R dua kali sepekan.',
  },
  // Hendra: dua lembaga berbeda → syarat pertama Tingkat 2 terpenuhi.
  {
    agentPhone: HENDRA,
    attestorPhone: MELATI_OP,
    status: 'DISETUJUI',
    requestedDaysAgo: 150,
    decidedDaysAgo: 149,
    decisionNote: 'Anggota bank sampah sejak awal berdiri.',
  },
  {
    agentPhone: HENDRA,
    attestorPhone: TPS3R_OP,
    status: 'DISETUJUI',
    requestedDaysAgo: 60,
    decidedDaysAgo: 58,
    decisionNote: 'Ikut piket pemilahan di TPS3R setiap Sabtu.',
  },
  // Tono: satu pengajuan yang belum dijawab, satu yang pernah disetujui lalu
  // dicabut. Keduanya membuatnya tetap Tingkat 0.
  {
    agentPhone: TONO,
    attestorPhone: MELATI_OP,
    status: 'MENUNGGU',
    requestedDaysAgo: 3,
    note: 'Baru mulai menyetor bulan ini, mohon dijamin.',
  },
  {
    agentPhone: TONO,
    attestorPhone: RTRW_OP,
    status: 'DICABUT',
    requestedDaysAgo: 40,
    decidedDaysAgo: 12,
    decisionNote: 'Yang bersangkutan pindah keluar wilayah RT 05, penjaminan ditarik.',
  },
];

interface SeedEndorsement {
  agentPhone: string;
  endorserPhone: string;
  note: string;
}

/**
 * Rekomendasi sesama pemulung Tingkat 2 — syarat ketiga.
 *
 * Hanya Hendra yang berada di Tingkat 2, jadi Slamet dan Yanti masing-masing
 * baru mengumpulkan satu dari dua rekomendasi yang dibutuhkan. Ini keadaan
 * yang paling sering ditemui di lapangan dan justru yang paling perlu
 * ditampilkan: layar pemulung harus bisa mengatakan "kurang satu rekomendasi
 * lagi", bukan sekadar "belum memenuhi syarat".
 */
const SEED_ENDORSEMENTS: SeedEndorsement[] = [
  {
    agentPhone: SLAMET,
    endorserPhone: HENDRA,
    note: 'Satu wilayah sejak 2022, timbangannya selalu ditera.',
  },
  {
    agentPhone: YANTI,
    endorserPhone: HENDRA,
    note: 'Pernah bersama menangani setoran hajatan, potongannya selalu dijelaskan.',
  },
];

/** Jalan-jalan di sekitar Beji & Cimanggis untuk alamat penjemputan. */
const DEPOK_STREETS = [
  'Jl. Margonda Raya',
  'Jl. Kemiri Raya',
  'Jl. Palakali Raya',
  'Jl. Tanah Baru',
  'Jl. Krukut Raya',
  'Jl. Bhakti Jaya',
  'Jl. Raya Bogor',
];

// ─── Helper ─────────────────────────────────────────────────

const log = (msg: string): void => {
  // eslint-disable-next-line no-console
  console.log(msg);
};

const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

const daysAgoDate = (days: number): Date => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const hoursAgoDate = (hours: number): Date => new Date(Date.now() - hours * 60 * 60 * 1000);

/**
 * Nomor bukti deterministik berformat `BG-YYMMDD-XXXX`.
 *
 * Harus deterministik supaya seed dapat dijalankan ulang tanpa membuat bukti
 * ganda; huruf dipilih dari abjad yang sama dengan yang dipakai backend
 * (tanpa 0/O dan 1/I yang mudah tertukar saat dibacakan).
 */
function seedReceiptNo(seq: number, createdAt: Date): string {
  const yy = String(createdAt.getFullYear()).slice(-2);
  const mm = String(createdAt.getMonth() + 1).padStart(2, '0');
  const dd = String(createdAt.getDate()).padStart(2, '0');
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let n = seq * 7919;
  let suffix = '';
  for (let i = 0; i < 4; i += 1) {
    suffix += alphabet[n % alphabet.length];
    n = Math.floor(n / alphabet.length);
  }
  return `BG-${yy}${mm}${dd}-${suffix}`;
}

/** Perhitungan baris & total, mengikuti WeighingReceiptsService secara persis. */
function computeReceipt(lines: SeedReceiptLine[]) {
  const computed = lines.map((line) => {
    const deductionKg = line.deductionKg ?? 0;
    const deductionAmount = line.deductionAmount ?? 0;
    const netWeightKg = round2(line.weightKg - deductionKg);
    const grossAmount = Math.round(netWeightKg * line.pricePerKg);
    return {
      grade: line.grade,
      weightKg: line.weightKg,
      deductionKg,
      deductionReason: line.deductionReason ?? null,
      pricePerKg: line.pricePerKg,
      deductionAmount,
      grossAmount,
      subtotal: grossAmount - deductionAmount,
    };
  });

  return {
    lines: computed,
    totals: {
      totalWeightKg: round2(computed.reduce((s, l) => s + l.weightKg, 0)),
      totalDeductionKg: round2(computed.reduce((s, l) => s + l.deductionKg, 0)),
      totalGrossAmount: computed.reduce((s, l) => s + l.grossAmount, 0),
      totalDeductionAmount: computed.reduce((s, l) => s + l.deductionAmount, 0),
      totalNetAmount: computed.reduce((s, l) => s + l.subtotal, 0),
    },
  };
}

/** Koordinat dengan sebaran deterministik di sekitar titik acuan wilayah. */
function scatter(center: { lat: number; lng: number }, seq: number) {
  return {
    lat: round6(center.lat + ((seq % 7) - 3) * 0.0035),
    lng: round6(center.lng + ((seq % 5) - 2) * 0.0042),
  };
}

const round6 = (value: number): number => Math.round(value * 1e6) / 1e6;

// ─── Main ───────────────────────────────────────────────────

async function main(): Promise<void> {
  log('🌱 Memulai seeding BinGo MVP demo...\n');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);

  // --- Users ---
  const userIdByPhone: Record<string, string> = {};
  for (const u of [...DEMO_USERS, ...SUPPORTING_USERS]) {
    let existing = await prisma.user.findUnique({ where: { phone: u.phone } });
    if (!existing) {
      existing = await prisma.user.create({
        data: {
          name: u.name,
          phone: u.phone,
          role: u.role,
          passwordHash,
          pointsBalance: u.pointsBalance,
          partnerType: u.partnerType ?? null,
          partnerName: u.partnerName ?? null,
        },
      });
      log(`+ user: ${u.name} (${u.role})${u.partnerName ? ` — mitra ${u.partnerName}` : ''}`);
    } else {
      // Selaraskan saldo poin dan status mitra pada eksekusi ulang.
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          pointsBalance: u.pointsBalance,
          partnerType: u.partnerType ?? null,
          partnerName: u.partnerName ?? null,
        },
      });
      log(`✓ user sudah ada: ${u.name} (${u.role})`);
    }
    userIdByPhone[u.phone] = existing.id;
  }

  const userId = (phone: string): string => {
    const id = userIdByPhone[phone];
    if (!id) throw new Error(`User dengan telepon ${phone} tidak ditemukan di seed`);
    return id;
  };

  const citizenId = userId(BUDI);
  const agentId = userId(AGUS);
  const msmeId = userId(SITI);

  // --- Marketplace Items ---
  const itemIds: string[] = [];
  for (const item of SEED_ITEMS) {
    let existing = await prisma.marketplaceItem.findFirst({
      where: { itemName: item.itemName },
    });
    if (!existing) {
      existing = await prisma.marketplaceItem.create({ data: item });
      log(`+ produk: ${item.itemName}`);
    } else {
      log(`✓ produk sudah ada: ${item.itemName}`);
    }
    itemIds.push(existing.id);
  }

  // --- Pickup Requests (Jakarta) ---
  const existingPickupsCount = await prisma.pickupRequest.count({ where: { citizenId } });
  if (existingPickupsCount === 0) {
    for (const p of PICKUP_REQUESTS) {
      const { needAgent, ...rest } = p as typeof p & { needAgent?: boolean };
      await prisma.pickupRequest.create({
        data: {
          ...rest,
          citizenId,
          agentId: needAgent ? agentId : null,
        },
      });
      log(`+ pickup: ${rest.address} [${rest.status}]`);
    }
  } else {
    log(`✓ pickup requests sudah ada (${existingPickupsCount} baris)`);
  }

  // --- Pickup Requests PENDING di Beji, Depok (bahan demo radar) ---
  for (const r of RADAR_PICKUPS) {
    const sellerId = userId(r.sellerPhone);
    const existing = await prisma.pickupRequest.findFirst({
      where: { citizenId: sellerId, address: r.address },
    });
    if (existing) {
      log(`✓ pickup radar sudah ada: ${r.address}`);
      continue;
    }
    await prisma.pickupRequest.create({
      data: {
        citizenId: sellerId,
        agentId: null,
        status: 'PENDING',
        lat: r.lat,
        lng: r.lng,
        address: r.address,
        materialType: r.materialType,
        estimatedWeightKg: r.estimatedWeightKg,
        notes: r.notes,
        createdAt: hoursAgoDate(r.hoursAgo),
      },
    });
    log(`+ pickup radar: ${r.address} [PENDING]`);
  }

  // --- Reports + verifikasinya ---
  for (const r of SEED_REPORTS) {
    let report = await prisma.report.findFirst({ where: { imageUrl: r.imageUrl } });
    if (!report) {
      report = await prisma.report.create({
        data: {
          citizenId,
          status: r.status,
          lat: r.lat,
          lng: r.lng,
          description: r.description,
          imageUrl: r.imageUrl,
          verificationCount: 0,
        },
      });
      log(`+ laporan: ${r.description.slice(0, 40)}... [${r.status}]`);
    } else {
      log(`✓ laporan sudah ada: ${r.description.slice(0, 40)}...`);
    }

    // Satu baris verifikasi per warga. `skipDuplicates` membuat langkah ini
    // aman diulang tanpa melanggar kunci unik (report_id, user_id).
    if (r.verifiers.length > 0) {
      await prisma.reportVerification.createMany({
        data: r.verifiers.map((phone) => ({ reportId: report.id, userId: userId(phone) })),
        skipDuplicates: true,
      });
    }
    // Hitung ulang dari baris yang benar-benar ada, bukan dari angka tetap.
    const verificationCount = await prisma.reportVerification.count({
      where: { reportId: report.id },
    });
    await prisma.report.update({
      where: { id: report.id },
      data: { verificationCount, status: r.status },
    });
  }

  // --- Transactions (MSME) ---
  const existingTxCount = await prisma.transaction.count({ where: { buyerId: msmeId } });
  if (existingTxCount === 0 && itemIds.length >= 3) {
    const txData = [
      { itemId: itemIds[0]!, qty: 200, totalPrice: 200 * 1500, status: 'COMPLETED' as const },
      { itemId: itemIds[1]!, qty: 100, totalPrice: 100 * 2500, status: 'PENDING' as const },
      { itemId: itemIds[2]!, qty: 400, totalPrice: 400 * 1750, status: 'SHIPPED' as const },
    ];
    for (const tx of txData) {
      await prisma.transaction.create({ data: { buyerId: msmeId, ...tx } });
      log(`+ transaksi: item=${tx.itemId.slice(0, 8)}... qty=${tx.qty} [${tx.status}]`);
    }
  } else {
    log(`✓ transaksi sudah ada (${existingTxCount} baris)`);
  }

  // --- Bukti timbang (sumber data papan harga) ---
  await seedWeighingReceipts(userId);

  // --- Verifikasi berjenjang pemulung ---
  // Dijalankan SETELAH bukti timbang, karena syarat "10 transaksi nirsengketa"
  // dihitung dari bukti yang sudah ada. Menghitung tingkat lebih dulu akan
  // menyimpan angka yang langsung basi.
  await seedAgentVerifications(userId);

  // --- Ringkasan papan harga ---
  await printPriceBoardSummary();
  await printVerificationSummary();

  log(`
╔════════════════════════════════════════════════════════════════╗
║  ✅ Seeding selesai — BinGo siap untuk demo!                   ║
║                                                                ║
║  Password semua akun demo: ${DEMO_PASSWORD}                    ║
║                                                                ║
║  • Warga:    081111111111  (Budi Santoso)                      ║
║  • Pemulung: 082222222222  (Agus Pramono)                      ║
║  • UMKM:     083333333333  (Siti Rahayu)                       ║
║                                                                ║
║  Akun pendukung papan harga:                                   ║
║  • Warga:    081234500011  (Dewi Anggraini)                    ║
║  • Warga:    081234500012  (Rina Kartika)                      ║
║  • Warga:    081234500013  (Joko Susilo)                       ║
║  • Warga:    081234500014  (Marni Sulastri)                    ║
║  • Pemulung: 081234500021  (Slamet Riyadi)                     ║
║  • Pemulung: 081234500022  (Yanti Marlina)                     ║
║                                                                ║
║  Verifikasi berjenjang pemulung:                               ║
║  • Tingkat 0: 081234500041 (Tono Wijaya)                       ║
║      1 pengajuan MENUNGGU + 1 penjaminan DICABUT               ║
║  • Tingkat 1: 082222222222 (Agus Pramono)                      ║
║      1 penjaminan Bank Sampah Melati                           ║
║  • Tingkat 2: 081234500042 (Hendra Gunawan)                    ║
║      2 lembaga penjamin + 10 transaksi nirsengketa             ║
║                                                                ║
║  Akun operator mitra (penjamin):                               ║
║  • 081234500031 (Bank Sampah Melati)                           ║
║  • 081234500032 (TPS3R Beji Bersih)                            ║
║  • 081234500033 (RT 05 RW 03 Beji)                             ║
║                                                                ║
║  Papan harga: wilayah "Kecamatan Beji, Depok"                  ║
║  Data belum cukup: wilayah "Kecamatan Cimanggis, Depok"        ║
╚════════════════════════════════════════════════════════════════╝
`);
}

/**
 * Membuat bukti timbang beserta permintaan penjemputan yang menopangnya.
 *
 * Setiap bukti yang bukan walk-in HARUS punya permintaan penjemputan milik
 * penyetor dan dipegang penerbitnya — aturan yang sama yang ditegakkan
 * WeighingReceiptsService.create(). Seed sengaja tidak menempuh jalan pintas
 * di sini: data demo yang melanggar aturannya sendiri akan langsung terlihat
 * begitu ada yang memeriksa, dan itu justru yang akan diperiksa juri.
 */
async function seedWeighingReceipts(userId: (phone: string) => string): Promise<void> {
  for (const r of [...SEED_RECEIPTS, ...SUKMAJAYA_RECEIPTS]) {
    const createdAt = daysAgoDate(r.daysAgo);
    const receiptNo = seedReceiptNo(r.seq, createdAt);

    const existing = await prisma.weighingReceipt.findUnique({ where: { receiptNo } });
    if (existing) {
      log(`✓ bukti timbang sudah ada: ${receiptNo}`);
      continue;
    }

    const sellerId = userId(r.sellerPhone);
    const issuedById = userId(r.agentPhone);
    const { lines, totals } = computeReceipt(r.lines);
    const area = areaOf(r.region);

    let pickupRequestId: string | null = null;
    if (!r.walkIn) {
      const firstGrade = r.lines[0]!.grade;
      const point = scatter(area.center, r.seq);
      const pickup = await prisma.pickupRequest.create({
        data: {
          citizenId: sellerId,
          agentId: issuedById,
          status: 'COMPLETED',
          lat: point.lat,
          lng: point.lng,
          address: `${DEPOK_STREETS[r.seq % DEPOK_STREETS.length]} No. ${10 + r.seq}, ${
            area.label
          }, Depok`,
          materialType: MATERIAL_GRADES[firstGrade].materialType,
          estimatedWeightKg: totals.totalWeightKg,
          notes: 'Penjemputan selesai, bukti timbang diterbitkan di titik penerima.',
          // Permintaan dibuat dua jam sebelum bukti diterbitkan, supaya urutan
          // waktunya masuk akal saat riwayat dibuka berdampingan.
          createdAt: new Date(createdAt.getTime() - 2 * 60 * 60 * 1000),
        },
      });
      pickupRequestId = pickup.id;
    }

    await prisma.weighingReceipt.create({
      data: {
        receiptNo,
        pickupRequestId,
        sellerId,
        issuedById,
        partnerName: r.partnerName,
        scaleTeraNo: r.scaleTeraNo,
        region: r.region,
        regionKey: normalizeRegionKey(r.region),
        walkIn: r.walkIn ?? false,
        notes: r.notes ?? null,
        // Sengketa dicatat pada bukti itu sendiri, bukan menghapusnya: bukti
        // tetap dapat dibuka kedua pihak, hanya berhenti dihitung sebagai
        // rekam jejak nirsengketa penerbitnya.
        disputedAt: r.disputed ? daysAgoDate(r.disputed.daysAgo) : null,
        disputeReason: r.disputed?.reason ?? null,
        totalWeightKg: totals.totalWeightKg,
        totalDeductionKg: totals.totalDeductionKg,
        totalGrossAmount: totals.totalGrossAmount,
        totalDeductionAmount: totals.totalDeductionAmount,
        totalNetAmount: totals.totalNetAmount,
        createdAt,
        lines: { create: lines },
      },
    });

    const flags = [
      r.walkIn ? 'walk-in' : null,
      r.scaleTeraNo ? null : 'tanpa nomor tera',
      r.disputed ? 'disengketakan penyetor' : null,
    ].filter(Boolean);
    log(
      `+ bukti timbang ${receiptNo} — ${r.partnerName} @ ${r.region}` +
        `${flags.length > 0 ? ` (${flags.join(', ')})` : ''}`,
    );
  }
}

/** Titik acuan dan label alamat untuk satu ejaan wilayah. */
function areaOf(region: string): { center: { lat: number; lng: number }; label: string } {
  const key = normalizeRegionKey(region);
  if (key === 'beji depok') return { center: BEJI_CENTER, label: 'Beji' };
  if (key === 'sukmajaya depok') return { center: SUKMAJAYA_CENTER, label: 'Sukmajaya' };
  return { center: CIMANGGIS_CENTER, label: 'Cimanggis' };
}

/**
 * Penjaminan, rekomendasi, dan tingkat verifikasi pemulung.
 *
 * Tingkat TIDAK ditulis sebagai angka tetap di sini. Ia dihitung dari baris
 * yang benar-benar ada, memakai `deriveVerificationLevel()` — fungsi yang sama
 * yang dipakai backend saat menegakkan aturan. Data demo yang menyetel
 * tingkatnya sendiri akan berbohong pada saat pertama kali aturannya berubah,
 * dan kebohongan itu tepat berada di tempat yang akan diperiksa juri.
 */
async function seedAgentVerifications(userId: (phone: string) => string): Promise<void> {
  for (const a of SEED_ATTESTATIONS) {
    const agentId = userId(a.agentPhone);
    const attestor = await prisma.user.findUniqueOrThrow({ where: { id: userId(a.attestorPhone) } });
    if (!attestor.partnerType || !attestor.partnerName) {
      throw new Error(
        `Akun ${attestor.phone} dipakai sebagai penjamin tetapi bukan operator mitra terdaftar`,
      );
    }
    const attestorKey = normalizeInstitutionKey(attestor.partnerName);

    const existing = await prisma.agentVerification.findUnique({
      where: { agentId_attestorKey: { agentId, attestorKey } },
    });
    if (existing) {
      log(`✓ penjaminan sudah ada: ${a.agentPhone} ← ${attestor.partnerName}`);
      continue;
    }

    const requestedAt = daysAgoDate(a.requestedDaysAgo);
    const decidedAt = a.decidedDaysAgo != null ? daysAgoDate(a.decidedDaysAgo) : null;

    // Jejak audit ditulis lengkap, termasuk langkah antara. Penjaminan yang
    // dicabut harus tetap memperlihatkan bahwa ia pernah disetujui — itulah
    // seluruh guna jejak audit.
    const events: Array<{
      action: 'DIAJUKAN' | 'DISETUJUI' | 'DITOLAK' | 'DICABUT';
      actorId: string;
      note: string | null;
      createdAt: Date;
    }> = [
      { action: 'DIAJUKAN', actorId: agentId, note: a.note ?? null, createdAt: requestedAt },
    ];
    if (a.status === 'DICABUT') {
      // Pencabutan mustahil tanpa persetujuan lebih dahulu.
      const approvedAt = daysAgoDate((a.decidedDaysAgo ?? 0) + 10);
      events.push({
        action: 'DISETUJUI',
        actorId: attestor.id,
        note: 'Warga RT 05, dikenal pengurus.',
        createdAt: approvedAt,
      });
    }
    if (a.status !== 'MENUNGGU' && decidedAt) {
      events.push({
        action: a.status,
        actorId: attestor.id,
        note: a.decisionNote ?? null,
        createdAt: decidedAt,
      });
    }

    await prisma.agentVerification.create({
      data: {
        agentId,
        attestorId: attestor.id,
        attestorType: attestor.partnerType,
        attestorName: attestor.partnerName,
        attestorPhone: attestor.phone,
        attestorKey,
        status: a.status,
        requestedAt,
        decidedAt,
        note: a.decisionNote ?? a.note ?? null,
        createdAt: requestedAt,
        events: { create: events },
      },
    });
    log(`+ penjaminan ${a.status}: ${a.agentPhone} ← ${attestor.partnerName}`);
  }

  for (const e of SEED_ENDORSEMENTS) {
    const agentId = userId(e.agentPhone);
    const endorserId = userId(e.endorserPhone);
    await prisma.agentEndorsement.upsert({
      where: { agentId_endorserId: { agentId, endorserId } },
      create: { agentId, endorserId, note: e.note },
      update: { note: e.note },
    });
    log(`+ rekomendasi: ${e.endorserPhone} → ${e.agentPhone}`);
  }

  await recomputeAllAgentLevels();
}

/**
 * Menghitung ulang tingkat seluruh pemulung dari data yang tersimpan.
 *
 * Dua putaran, dan itu disengaja. Syarat ketiga menghitung rekomendasi dari
 * pemulung yang SUDAH Tingkat 2, sehingga putaran pertama harus menetapkan
 * siapa saja yang Tingkat 2 sebelum putaran kedua dapat menilai rekomendasi
 * mereka. Backend menghadapi hal yang sama dan menyelesaikannya dengan
 * menghitung ulang setiap kali ada perubahan.
 */
async function recomputeAllAgentLevels(): Promise<void> {
  for (let round = 0; round < 2; round += 1) {
    const agents = await prisma.user.findMany({
      where: { role: 'WASTE_AGENT' },
      select: { id: true },
    });
    for (const agent of agents) {
      const approved = await prisma.agentVerification.findMany({
        where: { agentId: agent.id, status: 'DISETUJUI' },
        select: { attestorKey: true },
      });
      const disputelessTransactionCount = await prisma.weighingReceipt.count({
        where: { issuedById: agent.id, walkIn: false, disputedAt: null },
      });
      const peerEndorsementCount = await prisma.agentEndorsement.count({
        where: { agentId: agent.id, endorser: { verificationLevel: { gte: 2 } } },
      });
      const { level } = deriveVerificationLevel({
        distinctInstitutionCount: new Set(approved.map((a) => a.attestorKey)).size,
        disputelessTransactionCount,
        peerEndorsementCount,
      });
      await prisma.user.update({ where: { id: agent.id }, data: { verificationLevel: level } });
    }
  }
}

/**
 * Kunci identitas lembaga penjamin — cerminan `normalizeInstitutionKey()` di
 * AgentVerificationsService. Bila salah satunya diubah, yang lain wajib ikut:
 * kunci yang berbeda membuat penjaminan hasil seed tidak dikenali backend.
 */
function normalizeInstitutionKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Ringkasan singkat agar hasil seed langsung dapat diperiksa mata. */
async function printPriceBoardSummary(): Promise<void> {
  const grouped = await prisma.weighingReceipt.groupBy({
    by: ['regionKey'],
    _count: { _all: true },
  });
  log('\nWilayah yang punya bukti timbang:');
  for (const g of grouped) {
    const eligible = await prisma.weighingReceipt.count({
      where: { regionKey: g.regionKey, walkIn: false, scaleTeraNo: { not: null } },
    });
    log(`  • ${g.regionKey}: ${g._count._all} bukti, ${eligible} di antaranya masuk papan harga`);
  }
}

/** Ringkasan tingkat verifikasi, agar ketiga tingkat langsung terlihat. */
async function printVerificationSummary(): Promise<void> {
  const agents = await prisma.user.findMany({
    where: { role: 'WASTE_AGENT' },
    select: { id: true, name: true, phone: true, verificationLevel: true, partnerName: true },
    orderBy: [{ verificationLevel: 'desc' }, { name: 'asc' }],
  });
  const LABEL = ['Terdaftar', 'Dijamin Mitra', 'Dijamin Ganda'];
  log('\nTingkat verifikasi pemulung:');
  for (const a of agents) {
    const approved = await prisma.agentVerification.count({
      where: { agentId: a.id, status: 'DISETUJUI' },
    });
    const disputeless = await prisma.weighingReceipt.count({
      where: { issuedById: a.id, walkIn: false, disputedAt: null },
    });
    const endorsements = await prisma.agentEndorsement.count({
      where: { agentId: a.id, endorser: { verificationLevel: { gte: 2 } } },
    });
    log(
      `  • Tingkat ${a.verificationLevel} (${LABEL[a.verificationLevel] ?? '?'}) — ${a.name} ` +
        `${a.phone}: ${approved} penjaminan, ${disputeless} transaksi nirsengketa, ` +
        `${endorsements} rekomendasi${a.partnerName ? ` | operator mitra: ${a.partnerName}` : ''}`,
    );
  }
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
