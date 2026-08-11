import type { MaterialType } from './pickup';

/**
 * Titik setor sampah — milik mitra BinGo maupun milik pihak lain.
 *
 * Keputusan posisi yang tercermin di tipe ini: BinGo memilih menjadi
 * **integrator, bukan pesaing**. Direktori ini karena itu memuat titik yang
 * dioperasikan pihak lain, dan setiap entri wajib membawa `sourceUrl` dan
 * `verifiedAt` supaya pengguna tahu dari mana datanya dan kapan terakhir
 * diperiksa.
 *
 * Dua hal yang sengaja TIDAK ada di tipe ini, dan sebaiknya tidak ditambahkan:
 *
 * - **Ketersediaan atau kapasitas waktu-nyata.** Tidak satu pun operator di
 *   Indonesia membuka API publik untuk itu. Menampilkannya berarti mengarang.
 * - **Status kemitraan dengan operator luar.** Data ini disusun dari sumber
 *   publik; tidak ada perjanjian dengan Rekosistem, Plasticpay, maupun DLH DKI.
 *   `operator` menyatakan siapa yang mengoperasikan, bukan siapa yang bermitra.
 */
export type DropPointOperator =
  /** Bank sampah, lapak, atau TPS3R yang benar-benar terdaftar sebagai mitra BinGo. */
  | 'BINGO_MITRA'
  /** Terdaftar pada sistem e-Bank Sampah DLH DKI Jakarta. */
  | 'BANK_SAMPAH_DKI'
  /** Waste Station / Recycle Dropbox yang dikelola Rekosistem. */
  | 'REKOSISTEM'
  /** Reverse Vending Machine atau DropBox Plasticpay. */
  | 'PLASTICPAY'
  /** Dropbox limbah elektronik Dinas Lingkungan Hidup DKI Jakarta. */
  | 'DLH_DKI_EWASTE'
  | 'LAINNYA';

export const DROP_POINT_OPERATORS: DropPointOperator[] = [
  'BINGO_MITRA',
  'BANK_SAMPAH_DKI',
  'REKOSISTEM',
  'PLASTICPAY',
  'DLH_DKI_EWASTE',
  'LAINNYA',
];

export const DROP_POINT_OPERATOR_LABEL: Record<DropPointOperator, string> = {
  BINGO_MITRA: 'Mitra BinGo',
  BANK_SAMPAH_DKI: 'Bank Sampah (DLH DKI)',
  REKOSISTEM: 'Rekosistem',
  PLASTICPAY: 'Plasticpay',
  DLH_DKI_EWASTE: 'Dropbox e-waste DLH DKI',
  LAINNYA: 'Operator lain',
};

/** Apa yang didapat penyetor. Dibedakan karena selisihnya besar bagi pemulung. */
export type DropPointReward =
  /** Ditimbang dan dibayar tunai di tempat. */
  | 'TUNAI'
  /** Poin platform, nilainya ditetapkan operator secara sepihak. */
  | 'POIN'
  /** Tidak ada imbalan; murni layanan pembuangan. */
  | 'TIDAK_ADA';

export const DROP_POINT_REWARD_LABEL: Record<DropPointReward, string> = {
  TUNAI: 'Dibayar tunai',
  POIN: 'Poin platform',
  TIDAK_ADA: 'Tanpa imbalan',
};

export interface DropPointDto {
  id: string;
  name: string;
  operator: DropPointOperator;
  /** Nama operator sebagaimana ditulis sumbernya, bila berbeda dari label enum. */
  operatorName: string | null;
  address: string;
  lat: number;
  lng: number;
  /** Hanya terisi pada hasil pencarian terdekat. */
  distanceMeters: number | null;
  acceptedMaterials: MaterialType[];
  reward: DropPointReward;
  /** Berat minimum agar setoran diterima. Ambang inilah yang menyingkirkan
   *  setoran harian pemulung yang kecil dan campur. `null` berarti tanpa ambang. */
  minWeightKg: number | null;
  openingNote: string | null;
  /** Tautan ke layanan operator. Membuka layanan pihak ketiga, bukan integrasi. */
  externalUrl: string | null;
  /** Dari mana entri ini disusun. Wajib ada dan wajib ditampilkan. */
  sourceUrl: string;
  /** Kapan terakhir diperiksa manusia. Ditampilkan apa adanya, termasuk bila lama. */
  verifiedAt: string;
  note: string | null;
  region: string;
  regionKey: string;
}

/**
 * Empat kategori pilah wajib menurut Instruksi Gubernur DKI Jakarta No. 5
 * Tahun 2026, berlaku sejak 10 Mei 2026.
 *
 * Kewajiban memilahnya sudah ada; yang belum ada adalah petunjuk ke mana tiap
 * kategori dibawa. Pemetaan di bawah ini yang menjembatani keduanya.
 */
export type IngubCategory = 'ORGANIK' | 'ANORGANIK' | 'B3' | 'RESIDU';

export const INGUB_CATEGORY_LABEL: Record<IngubCategory, string> = {
  ORGANIK: 'Organik',
  ANORGANIK: 'Anorganik',
  B3: 'Bahan berbahaya dan beracun (B3)',
  RESIDU: 'Residu',
};

export const INGUB_CATEGORY_ACTION: Record<IngubCategory, string> = {
  ORGANIK:
    'Kompos di rumah, atau serahkan ke Bank Sampah Pengelola RW (BPS-RW) di wilayahmu.',
  ANORGANIK:
    'Punya nilai jual. Setorkan ke bank sampah, lapak, atau titik setor di bawah.',
  B3: 'Jangan dicampur. Antar ke dropbox e-waste atau TPS B3; sebagian melayani jemput gratis.',
  RESIDU:
    'Tidak bisa didaur ulang. Buang lewat jalur pengangkutan reguler, jangan dibakar.',
};

const MATERIAL_TO_INGUB: Record<MaterialType, IngubCategory> = {
  PET: 'ANORGANIK',
  HDPE: 'ANORGANIK',
  PVC: 'ANORGANIK',
  LDPE: 'ANORGANIK',
  PP: 'ANORGANIK',
  PS: 'ANORGANIK',
  OTHER_PLASTIC: 'ANORGANIK',
  PAPER: 'ANORGANIK',
  METAL: 'ANORGANIK',
  GLASS: 'ANORGANIK',
  ORGANIC: 'ORGANIK',
  MIXED: 'RESIDU',
};

/** Kategori Ingub 5/2026 untuk sebuah jenis material. */
export function ingubCategoryFor(materialType: MaterialType): IngubCategory {
  return MATERIAL_TO_INGUB[materialType];
}

export interface NearbyDropPointQuery {
  lat: number;
  lng: number;
  radiusKm?: number;
  material?: MaterialType;
}

/** Radius bawaan pencarian titik setor, dalam kilometer. */
export const DEFAULT_DROP_POINT_RADIUS_KM = 5;
export const MAX_DROP_POINT_RADIUS_KM = 25;
