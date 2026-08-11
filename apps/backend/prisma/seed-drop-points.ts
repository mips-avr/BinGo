/**
 * Direktori titik setor — data kurasi manual dari sumber publik.
 *
 * Setiap baris di berkas ini disertai `sourceUrl` dan `verifiedAt`, dan
 * keduanya sampai ke layar pengguna. Itu bukan hiasan: direktori semacam ini
 * sudah ada di beberapa tempat (Peta Minim Sampah, e-Bank Sampah Jakarta,
 * BPS-RW), dan setidaknya satu direktori resmi — Pesapakawan milik DLH DKI —
 * ditemukan dalam keadaan tabelnya kosong. Yang membedakan direktori ini bukan
 * keberadaannya, melainkan kejujurannya soal umur datanya.
 *
 * Yang sengaja TIDAK dimasukkan, beserta alasannya:
 *
 * - **Octopus.** Berhenti beroperasi; domainnya tidak dapat di-resolve pada
 *   Agustus 2026 dan ada laporan tunggakan gaji sejak akhir 2023.
 * - **eRecycle.** Domain tidak dapat di-resolve pada Agustus 2026; arsip
 *   terakhir yang tersedia November 2025. Status sebenarnya tidak diketahui.
 * - **MallSampah.** Aktif, tetapi tidak ada sumber yang mengonfirmasi ia
 *   melayani Jakarta; alamat pengembangnya Makassar.
 * - **Waste4Change.** Aktif, tetapi daftar titik penerimanya tidak dapat
 *   dibaca dari sumber publik, dan sumber cakupan terakhir berasal dari 2022.
 * - **Ratusan titik Plasticpay dan ribuan Bank Sampah Unit.** Petanya publik,
 *   tetapi koordinat per titik dimuat lewat JavaScript dan belum diambil satu
 *   per satu. Yang belum diverifikasi tidak dimasukkan, meskipun itu membuat
 *   direktori tampak lebih kecil.
 *
 * Menambahkan entri yang tidak terverifikasi akan membuatnya tampil sama
 * meyakinkannya dengan yang terverifikasi, dan pengguna tidak punya cara
 * membedakannya. Direktori kecil yang benar lebih berguna daripada direktori
 * besar yang tidak bisa dipercaya.
 */
import type { MaterialType, PrismaClient } from '@prisma/client';

import { normalizeRegionKey } from '@bingo/shared-types';

type SeedDropPoint = {
  name: string;
  operator: 'BINGO_MITRA' | 'BANK_SAMPAH_DKI' | 'REKOSISTEM' | 'PLASTICPAY' | 'DLH_DKI_EWASTE' | 'LAINNYA';
  operatorName?: string;
  address: string;
  lat: number;
  lng: number;
  acceptedMaterials: MaterialType[];
  reward: 'TUNAI' | 'POIN' | 'TIDAK_ADA';
  minWeightKg?: number;
  openingNote?: string;
  externalUrl?: string;
  sourceUrl: string;
  verifiedAt: string;
  note?: string;
  region: string;
};

/**
 * Dropbox limbah elektronik DLH DKI Jakarta.
 *
 * `acceptedMaterials` sengaja dikosongkan, dan itu keputusan yang berarti:
 * limbah elektronik belum menjadi nilai `MaterialType`, dan memaksakannya ke
 * `METAL` atau `OTHER_PLASTIC` akan mengarahkan orang yang membawa sekantong
 * kaleng ke kotak berlubang 20 × 5 cm yang hanya muat ponsel. Array kosong
 * membuat titik-titik ini tidak pernah muncul pada pencarian berdasarkan
 * material — persis perilaku yang benar — sementara ia tetap muncul pada
 * penelusuran wilayah dengan catatan yang menjelaskan.
 *
 * Menambahkan `E_WASTE` ke enum `MaterialType` adalah perbaikan yang tepat dan
 * sudah dicatat sebagai pekerjaan berikutnya.
 */
const EWASTE_SOURCE =
  'https://news.detik.com/berita/d-7929039/cara-buang-sampah-elektronik-di-jakarta-hingga-lokasi-dropbox-e-waste';
const EWASTE_VERIFIED = '2026-08-08T00:00:00.000Z';

const EWASTE_STOPS: Array<{ name: string; address: string; lat: number; lng: number; region: string }> = [
  { name: 'Dropbox e-waste — Halte Transjakarta Bundaran HI Astra', address: 'Halte Bundaran HI Astra, Jl. M.H. Thamrin, Jakarta Pusat', lat: -6.1944, lng: 106.8229, region: 'Menteng, Jakarta Pusat' },
  { name: 'Dropbox e-waste — Halte Transjakarta Harmoni', address: 'Halte Harmoni, Jl. Gajah Mada, Jakarta Pusat', lat: -6.1663, lng: 106.8195, region: 'Gambir, Jakarta Pusat' },
  { name: 'Dropbox e-waste — Halte Transjakarta Blok M', address: 'Halte Blok M, Jl. Sultan Hasanuddin, Jakarta Selatan', lat: -6.2444, lng: 106.7991, region: 'Kebayoran Baru, Jakarta Selatan' },
  { name: 'Dropbox e-waste — Halte Transjakarta Ragunan', address: 'Halte Ragunan, Jl. Harsono RM, Jakarta Selatan', lat: -6.3095, lng: 106.8206, region: 'Pasar Minggu, Jakarta Selatan' },
  { name: 'Dropbox e-waste — Halte Transjakarta Tegal Mampang', address: 'Halte Tegal Mampang, Jl. Mampang Prapatan Raya, Jakarta Selatan', lat: -6.2508, lng: 106.8218, region: 'Mampang Prapatan, Jakarta Selatan' },
  { name: 'Dropbox e-waste — Halte Transjakarta Cawang Sentral', address: 'Halte Cawang Sentral, Jl. Mayjen Sutoyo, Jakarta Timur', lat: -6.2447, lng: 106.8697, region: 'Kramat Jati, Jakarta Timur' },
  { name: 'Dropbox e-waste — Halte Transjakarta Kampung Melayu', address: 'Halte Kampung Melayu, Jl. Jatinegara Barat, Jakarta Timur', lat: -6.2244, lng: 106.8659, region: 'Jatinegara, Jakarta Timur' },
  { name: 'Dropbox e-waste — Halte Transjakarta Pulo Gadung', address: 'Halte Pulo Gadung, Jl. Perintis Kemerdekaan, Jakarta Timur', lat: -6.1854, lng: 106.9089, region: 'Pulo Gadung, Jakarta Timur' },
  { name: 'Dropbox e-waste — Halte Transjakarta Flyover Pramuka 2', address: 'Halte Flyover Pramuka 2, Jl. Pramuka, Jakarta Timur', lat: -6.1932, lng: 106.8687, region: 'Matraman, Jakarta Timur' },
  { name: 'Dropbox e-waste — Halte Transjakarta Kota', address: 'Halte Kota, Jl. Lada, Jakarta Barat', lat: -6.1376, lng: 106.8133, region: 'Taman Sari, Jakarta Barat' },
  { name: 'Dropbox e-waste — Stasiun KRL Cikini', address: 'Stasiun Cikini, Jl. Pegangsaan Timur, Jakarta Pusat', lat: -6.1985, lng: 106.8412, region: 'Menteng, Jakarta Pusat' },
];

const DROP_POINTS: SeedDropPoint[] = [
  // --- Rekosistem Waste Station -------------------------------------------
  {
    name: 'Rekosistem Waste Station — MRT Blok M',
    operator: 'REKOSISTEM',
    operatorName: 'Rekosistem (PT Khazanah Hijau Indonesia)',
    address:
      'Taman Literasi Martha Christina Tiahahu, dekat tangga masuk Stasiun MRT Blok M BCA, Jakarta Selatan',
    lat: -6.2441,
    lng: 106.7983,
    acceptedMaterials: ['PET', 'HDPE', 'OTHER_PLASTIC', 'PAPER', 'METAL', 'GLASS'],
    reward: 'POIN',
    openingNote: 'Senin, Selasa, Kamis–Minggu (tutup Rabu). Kapasitas 120–150 kg/hari.',
    externalUrl: 'https://play.google.com/store/apps/details?id=com.rekosistem.mobile',
    sourceUrl:
      'https://www.antaranews.com/berita/5541184/waste-station-hadir-di-mrt-blok-m-ajak-warga-pilah-sampah-di-ruang-publik',
    verifiedAt: '2026-08-08T00:00:00.000Z',
    note:
      'Imbalan berupa poin, bukan tunai: 1 poin = Rp1, kisaran 100–6.000 poin per setoran tergantung material. Tekstil belum diterima.',
    region: 'Kebayoran Baru, Jakarta Selatan',
  },
  {
    name: 'Rekosistem Waste Station — MRT Dukuh Atas',
    operator: 'REKOSISTEM',
    operatorName: 'Rekosistem (PT Khazanah Hijau Indonesia)',
    address: 'Luar Stasiun MRT Dukuh Atas BNI, seberang Starbucks dekat pintu lift, Jakarta Pusat',
    lat: -6.2003,
    lng: 106.8229,
    acceptedMaterials: ['PET', 'HDPE', 'OTHER_PLASTIC', 'PAPER', 'METAL', 'GLASS'],
    reward: 'POIN',
    openingNote: 'Buka 8 jam per hari, termasuk akhir pekan.',
    externalUrl: 'https://play.google.com/store/apps/details?id=com.rekosistem.mobile',
    sourceUrl:
      'https://www.goodnewsfromindonesia.id/2026/05/25/setor-sampah-bisa-dapat-poin-aktivasi-waste-station-rekosistem-dukuh-atas-bareng-jerhemy-owen-dan-komunitas-lingkungan',
    verifiedAt: '2026-08-08T00:00:00.000Z',
    note: 'Imbalan berupa poin platform, bukan pembayaran tunai per kilogram.',
    region: 'Menteng, Jakarta Pusat',
  },

  // --- Plasticpay ----------------------------------------------------------
  {
    name: 'Reverse Vending Machine Plasticpay — ADHI Tower',
    operator: 'PLASTICPAY',
    operatorName: 'Plasticpay (PT Plasticpay Teknologi Daurulang)',
    address: 'ADHI Tower, Jl. Raya Pasar Minggu KM 18, Jakarta Selatan',
    lat: -6.2645,
    lng: 106.8449,
    acceptedMaterials: ['PET'],
    reward: 'POIN',
    openingNote: 'Mengikuti jam operasional gedung.',
    externalUrl: 'https://maps.plasticpay.net',
    sourceUrl:
      'https://adhi.co.id/adhi-hadirkan-rvm-plasticpay-kelola-sampah-plastik-untuk-keberlanjutan-lingkungan-di-adhi-tower/',
    verifiedAt: '2026-08-08T00:00:00.000Z',
    note:
      'Hanya menerima botol plastik kosong — cakupan tersempit di antara operator yang terdata. Peta lengkap 492 lokasi ada di maps.plasticpay.net.',
    region: 'Pasar Minggu, Jakarta Selatan',
  },

  // --- Bank sampah resmi DLH DKI ------------------------------------------
  {
    name: 'Cari Bank Sampah terdekat — e-Bank Sampah DKI Jakarta',
    operator: 'BANK_SAMPAH_DKI',
    operatorName: 'Dinas Lingkungan Hidup Provinsi DKI Jakarta',
    address: 'Peta resmi 2.253 Bank Sampah Unit dan 6 Bank Sampah Induk se-DKI Jakarta',
    lat: -6.1754,
    lng: 106.8272,
    acceptedMaterials: ['PET', 'HDPE', 'LDPE', 'PP', 'OTHER_PLASTIC', 'PAPER', 'METAL', 'GLASS'],
    reward: 'TUNAI',
    minWeightKg: 1,
    openingNote: 'Jam layanan ditetapkan masing-masing unit.',
    externalUrl: 'https://banksampah.jakarta.go.id/',
    sourceUrl: 'https://banksampah.jakarta.go.id/',
    verifiedAt: '2026-08-08T00:00:00.000Z',
    note:
      'Setiap unit menetapkan harga per kategori sendiri, dan nasabah hanya melihat harga unit tempat ia terdaftar. Satu anggota rumah tangga menjadi nasabah aktif membebaskan seluruh rumah dari retribusi kebersihan.',
    region: 'Gambir, Jakarta Pusat',
  },
];

export async function seedDropPoints(prisma: PrismaClient, log: (msg: string) => void) {
  const rows: SeedDropPoint[] = [
    ...DROP_POINTS,
    ...EWASTE_STOPS.map((s) => ({
      ...s,
      operator: 'DLH_DKI_EWASTE' as const,
      operatorName: 'Dinas Lingkungan Hidup Provinsi DKI Jakarta',
      // Kosong dengan sengaja — lihat catatan di kepala berkas.
      acceptedMaterials: [] as MaterialType[],
      reward: 'TIDAK_ADA' as const,
      openingNote: 'Mengikuti jam operasional halte/stasiun.',
      externalUrl: 'https://ewaste.dinaslhdki.id/',
      sourceUrl: EWASTE_SOURCE,
      verifiedAt: EWASTE_VERIFIED,
      note:
        'Hanya limbah elektronik. Bukaan dropbox 20 × 5 cm, jadi hanya muat barang kecil; ' +
        'untuk ≥5 kg tersedia jemput gratis bagi pemohon ber-KTP Jakarta. Tanpa imbalan.',
    })),
  ];

  let created = 0;
  for (const r of rows) {
    const existing = await prisma.dropPoint.findFirst({ where: { name: r.name } });
    if (existing) continue;

    // Kolom PostGIS `location` diisi trigger `bingo_drop_point_sync_location`
    // dari lat/lng, jadi tidak perlu — dan tidak boleh — ditulis dari sini.
    await prisma.dropPoint.create({
      data: {
        name: r.name,
        operator: r.operator,
        operatorName: r.operatorName ?? null,
        address: r.address,
        lat: r.lat,
        lng: r.lng,
        acceptedMaterials: r.acceptedMaterials,
        reward: r.reward,
        minWeightKg: r.minWeightKg ?? null,
        openingNote: r.openingNote ?? null,
        externalUrl: r.externalUrl ?? null,
        sourceUrl: r.sourceUrl,
        verifiedAt: new Date(r.verifiedAt),
        note: r.note ?? null,
        region: r.region,
        regionKey: normalizeRegionKey(r.region),
      },
    });
    created += 1;
  }

  log(
    `✓ Titik setor: ${created} baru, ${rows.length} total terdata ` +
      `(${DROP_POINTS.length} operator swasta/pemerintah + ${EWASTE_STOPS.length} dropbox e-waste)`,
  );
}
