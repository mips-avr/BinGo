import type { MaterialType } from './pickup';

/**
 * Grade material sebagaimana dipakai titik penerima (bank sampah, lapak, dan
 * pengepul) di lapangan.
 *
 * Ini sengaja dipisahkan dari `MaterialType`, yang menggolongkan berdasarkan
 * jenis polimer. Penggolongan polimer benar secara teknis tetapi tidak dipakai
 * saat transaksi: dua barang dengan polimer sama bisa berbeda harganya beberapa
 * kali lipat. Gelas plastik bening dan gelas plastik berwarna sama-sama PP,
 * tetapi pada satu bank sampah yang sama tercatat Rp3.700/kg berbanding
 * Rp1.700/kg.
 */
export const MaterialGrade = {
  PET_BOTOL_BENING: 'PET_BOTOL_BENING',
  PET_BOTOL_WARNA: 'PET_BOTOL_WARNA',
  PP_GELAS_BENING: 'PP_GELAS_BENING',
  PP_GELAS_WARNA: 'PP_GELAS_WARNA',
  PP_PLASTIK_PUTIH: 'PP_PLASTIK_PUTIH',
  LDPE_KRESEK: 'LDPE_KRESEK',
  PLASTIK_CAMPUR: 'PLASTIK_CAMPUR',
  KERTAS_KORAN: 'KERTAS_KORAN',
  KERTAS_ARSIP: 'KERTAS_ARSIP',
  KERTAS_KARDUS: 'KERTAS_KARDUS',
  KERTAS_DUPLEX: 'KERTAS_DUPLEX',
  LOGAM_ALUMINIUM: 'LOGAM_ALUMINIUM',
  LOGAM_TEMBAGA: 'LOGAM_TEMBAGA',
  LOGAM_BESI: 'LOGAM_BESI',
  LOGAM_KALENG: 'LOGAM_KALENG',
  KACA_BELING: 'KACA_BELING',
  MINYAK_JELANTAH: 'MINYAK_JELANTAH',
  MULTILAYER_SACHET: 'MULTILAYER_SACHET',
} as const;
export type MaterialGrade = (typeof MaterialGrade)[keyof typeof MaterialGrade];

export interface MaterialGradeInfo {
  grade: MaterialGrade;
  /** Nama yang dipakai di lapangan. Inilah yang ditampilkan ke pengguna. */
  label: string;
  /** Kelas material yang dikeluarkan TrashScan. Beberapa grade berbagi satu kelas. */
  materialType: MaterialType;
  /** Syarat kondisi agar material diterima pada grade ini. */
  conditions: string[];
  /**
   * `false` berarti grade ini umumnya tidak dibeli titik penerima. Aplikasi
   * harus menyarankan pengurangan pemakaian, bukan penyetoran.
   */
  sellable: boolean;
}

/**
 * Pemetaan grade ke kelas TrashScan, label lapangan, dan syarat kondisinya.
 *
 * Catatan penting: berkas ini sengaja TIDAK memuat harga. Harga bervariasi
 * ekstrem antar-wilayah — gelas plastik bening tercatat Rp1.200–2.480/kg di
 * Depok dan Rp3.700/kg di Sumatera Utara, sementara satu bank sampah di Bantul
 * tidak memiliki kategori ini sama sekali dan hanya membeli plastik umum pada
 * Rp20–50/kg. Karena itu harga hanya boleh berasal dari papan harga mitra di
 * wilayah pengguna, bukan dari konstanta di dalam kode.
 */
export const MATERIAL_GRADES: Record<MaterialGrade, MaterialGradeInfo> = {
  PET_BOTOL_BENING: {
    grade: 'PET_BOTOL_BENING',
    label: 'Botol plastik bening',
    materialType: 'PET',
    conditions: ['Bersih dan kering', 'Label dan tutup dilepas', 'Dipipihkan'],
    sellable: true,
  },
  PET_BOTOL_WARNA: {
    grade: 'PET_BOTOL_WARNA',
    label: 'Botol plastik berwarna',
    materialType: 'PET',
    conditions: ['Bersih dan kering', 'Label dan tutup dilepas', 'Dipipihkan'],
    sellable: true,
  },
  PP_GELAS_BENING: {
    grade: 'PP_GELAS_BENING',
    label: 'Gelas plastik bening',
    materialType: 'PP',
    conditions: ['Bersih dan kering', 'Sisa lem segel dibersihkan'],
    sellable: true,
  },
  PP_GELAS_WARNA: {
    grade: 'PP_GELAS_WARNA',
    label: 'Gelas plastik berwarna',
    materialType: 'PP',
    conditions: ['Bersih dan kering', 'Sisa lem segel dibersihkan'],
    sellable: true,
  },
  PP_PLASTIK_PUTIH: {
    grade: 'PP_PLASTIK_PUTIH',
    label: 'Plastik putih',
    materialType: 'PP',
    conditions: ['Kering'],
    sellable: true,
  },
  LDPE_KRESEK: {
    grade: 'LDPE_KRESEK',
    label: 'Kantong kresek',
    materialType: 'LDPE',
    conditions: ['Kering'],
    sellable: true,
  },
  PLASTIK_CAMPUR: {
    grade: 'PLASTIK_CAMPUR',
    label: 'Plastik campur',
    materialType: 'OTHER_PLASTIC',
    conditions: ['Kering'],
    sellable: true,
  },
  KERTAS_KORAN: {
    grade: 'KERTAS_KORAN',
    label: 'Koran',
    materialType: 'PAPER',
    conditions: ['Kering', 'Tidak tercampur plastik'],
    sellable: true,
  },
  KERTAS_ARSIP: {
    grade: 'KERTAS_ARSIP',
    label: 'Arsip / HVS',
    materialType: 'PAPER',
    conditions: ['Kering', 'Klip dan lakban dilepas'],
    sellable: true,
  },
  KERTAS_KARDUS: {
    grade: 'KERTAS_KARDUS',
    label: 'Kardus',
    materialType: 'PAPER',
    conditions: ['Kering', 'Dilipat', 'Bebas selotip'],
    sellable: true,
  },
  KERTAS_DUPLEX: {
    grade: 'KERTAS_DUPLEX',
    label: 'Duplex',
    materialType: 'PAPER',
    conditions: ['Kering'],
    sellable: true,
  },
  LOGAM_ALUMINIUM: {
    grade: 'LOGAM_ALUMINIUM',
    label: 'Aluminium',
    materialType: 'METAL',
    conditions: ['Bersih'],
    sellable: true,
  },
  LOGAM_TEMBAGA: {
    grade: 'LOGAM_TEMBAGA',
    label: 'Tembaga',
    materialType: 'METAL',
    conditions: ['Bersih', 'Terpisah dari kabel dan isolator'],
    sellable: true,
  },
  LOGAM_BESI: {
    grade: 'LOGAM_BESI',
    label: 'Besi',
    materialType: 'METAL',
    conditions: ['Bersih', 'Tidak berkarat berat'],
    sellable: true,
  },
  LOGAM_KALENG: {
    grade: 'LOGAM_KALENG',
    label: 'Kaleng',
    materialType: 'METAL',
    conditions: ['Bersih dan kering'],
    sellable: true,
  },
  KACA_BELING: {
    grade: 'KACA_BELING',
    label: 'Beling',
    materialType: 'GLASS',
    conditions: ['Dikemas aman agar tidak melukai'],
    sellable: true,
  },
  MINYAK_JELANTAH: {
    grade: 'MINYAK_JELANTAH',
    label: 'Minyak jelantah',
    materialType: 'ORGANIC',
    conditions: ['Disaring', 'Dalam wadah tertutup'],
    sellable: true,
  },
  MULTILAYER_SACHET: {
    grade: 'MULTILAYER_SACHET',
    label: 'Kemasan sachet / multilayer',
    materialType: 'MIXED',
    conditions: [],
    sellable: false,
  },
};

/** Grade yang mungkin untuk satu kelas keluaran TrashScan. */
export function gradesForMaterial(materialType: MaterialType): MaterialGradeInfo[] {
  return Object.values(MATERIAL_GRADES).filter((g) => g.materialType === materialType);
}

// ---------------------------------------------------------------------------
// Bukti timbang (e-receipt)
// ---------------------------------------------------------------------------

/**
 * Satu baris bukti timbang.
 *
 * Potongan sengaja dipecah menjadi dua field terpisah dan tidak boleh
 * dilebur ke dalam `pricePerKg`. Ketidakadilan yang paling sering dikeluhkan
 * di lapangan bukan harga per kilogram, melainkan potongan berat dan potongan
 * rupiah yang tidak dijelaskan. Menyembunyikannya di dalam harga membuat bukti
 * timbang kehilangan seluruh gunanya.
 */
export interface WeighingLineDto {
  id: string;
  grade: MaterialGrade;
  /** Berat kotor hasil timbang, kilogram. */
  weightKg: number;
  /** Potongan berat, misalnya karena kadar air. Kilogram. */
  deductionKg: number;
  /** Alasan potongan, wajib diisi bila ada potongan. */
  deductionReason: string | null;
  /** Berat bersih = weightKg - deductionKg. */
  netWeightKg: number;
  /** Harga per kilogram dalam Rupiah. */
  pricePerKg: number;
  /** Potongan dalam Rupiah, misalnya biaya angkut. */
  deductionAmount: number;
  /** netWeightKg × pricePerKg, dibulatkan ke Rupiah terdekat. */
  grossAmount: number;
  /** grossAmount - deductionAmount. */
  subtotal: number;
}

export interface WeighingReceiptDto {
  id: string;
  /** Nomor bukti timbang yang dibacakan saat serah terima. */
  receiptNo: string;
  /** Permintaan penjemputan asal, bila bukti ini lahir dari alur pickup. */
  pickupRequestId: string | null;
  /** Pihak yang menyerahkan material. */
  sellerId: string;
  /** Pihak yang menerbitkan bukti timbang (Waste Agent atau operator mitra). */
  issuedById: string;
  /** Nama titik penerima. */
  partnerName: string;
  /**
   * Nomor tera timbangan mitra sesuai UU No. 2 Tahun 1981 tentang Metrologi
   * Legal. Boleh kosong, tetapi bukti timbang tanpa nomor tera ditandai
   * `scaleVerified: false` dan tidak dihitung ke papan harga.
   */
  scaleTeraNo: string | null;
  scaleVerified: boolean;
  /** Wilayah tingkat kecamatan atau kota. Papan harga selalu terikat wilayah. */
  region: string;
  lines: WeighingLineDto[];
  totalWeightKg: number;
  totalDeductionKg: number;
  totalNetWeightKg: number;
  totalGrossAmount: number;
  totalDeductionAmount: number;
  /** Jumlah yang benar-benar dibayarkan. */
  totalNetAmount: number;
  notes: string | null;
  createdAt: string;
}

export interface CreateWeighingLineRequest {
  grade: MaterialGrade;
  weightKg: number;
  pricePerKg: number;
  deductionKg?: number;
  deductionReason?: string;
  deductionAmount?: number;
}

export interface CreateWeighingReceiptRequest {
  pickupRequestId?: string;
  sellerId: string;
  partnerName: string;
  region: string;
  scaleTeraNo?: string;
  notes?: string;
  lines: CreateWeighingLineRequest[];
}

// ---------------------------------------------------------------------------
// Papan harga
// ---------------------------------------------------------------------------

/**
 * Sebaran harga satu grade di satu wilayah, dihitung dari bukti timbang yang
 * benar-benar tercatat.
 *
 * Ini adalah lapis kedua papan harga: harga transaksi nyata. Lapis pertama
 * adalah harga yang diumumkan sendiri oleh mitra, dan selisih antara keduanya
 * adalah keluaran paling berharga dari platform ini.
 */
export interface PriceBandDto {
  grade: MaterialGrade;
  label: string;
  region: string;
  /** Persentil 25, median, dan persentil 75 dalam Rupiah per kilogram. */
  p25: number;
  median: number;
  p75: number;
  /** Banyaknya baris bukti timbang yang menyusun sebaran ini. */
  sampleCount: number;
  /** Banyaknya mitra berbeda yang menyumbang data. */
  partnerCount: number;
  /** Bukti timbang terbaru yang dipakai. */
  lastReportedAt: string;
}

/**
 * Hasil kueri papan harga. Bila data belum memenuhi ambang minimum, `bands`
 * kosong dan `insufficient` memuat grade yang datanya belum cukup — aplikasi
 * menampilkan "data belum cukup untuk wilayah ini", bukan menyamarkan satu
 * laporan tunggal sebagai median.
 */
export interface PriceBoardDto {
  region: string;
  /** Jendela kesegaran data dalam hari. */
  windowDays: number;
  bands: PriceBandDto[];
  insufficient: MaterialGrade[];
}
