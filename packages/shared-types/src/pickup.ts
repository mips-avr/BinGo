import type { LatLng } from './common';

/** Status alur permintaan penjemputan sampah. */
export const PickupStatus = {
  PENDING: 'PENDING',         // Dibuat oleh warga, menunggu diterima
  ACCEPTED: 'ACCEPTED',       // Diterima oleh pemulung
  IN_PROGRESS: 'IN_PROGRESS', // Pemulung dalam perjalanan / sedang menjemput
  COMPLETED: 'COMPLETED',     // Selesai (sampah terkumpul)
  CANCELLED: 'CANCELLED',     // Dibatalkan warga atau sistem
} as const;
export type PickupStatus = (typeof PickupStatus)[keyof typeof PickupStatus];

/** Jenis material utama (acuan TrashScan). */
export const MaterialType = {
  PET: 'PET',
  HDPE: 'HDPE',
  PVC: 'PVC',
  LDPE: 'LDPE',
  PP: 'PP',
  PS: 'PS',
  OTHER_PLASTIC: 'OTHER_PLASTIC',
  PAPER: 'PAPER',
  METAL: 'METAL',
  GLASS: 'GLASS',
  ORGANIC: 'ORGANIC',
  MIXED: 'MIXED',
} as const;
export type MaterialType = (typeof MaterialType)[keyof typeof MaterialType];

export interface CreatePickupRequest {
  location: LatLng;
  address: string;
  materialType: MaterialType;
  estimatedWeightKg: number;
  notes?: string;
}

export interface PickupRequestDto {
  id: string;
  citizenId: string;
  agentId: string | null;
  status: PickupStatus;
  location: LatLng;
  address: string;
  materialType: MaterialType;
  estimatedWeightKg: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NearbyPickupQuery {
  lat: number;
  lng: number;
  /** Radius pencarian dalam kilometer (default 5). */
  radiusKm?: number;
}

/** Permintaan terdekat beserta jaraknya (hasil `GET /pickup-requests/nearby`). */
export interface PickupRequestWithDistanceDto extends PickupRequestDto {
  /** Jarak garis lurus dari posisi pemulung, dalam meter. */
  distanceMeters: number;
}

/** Parameter kueri radar pemulung. */
export interface RadarQuery {
  lat: number;
  lng: number;
  /** Radius pencarian dalam kilometer (default 5, maks 25). */
  radiusKm?: number;
  /** Saring menurut jenis material. */
  materialType?: MaterialType;
  /** Saring permintaan dengan estimasi berat minimal sekian kilogram. */
  minWeightKg?: number;
}

/**
 * Satu titik pada radar pemulung.
 *
 * Radar berbeda dari daftar "terdekat": selain jarak, ia memberi arah, sehingga
 * pemulung yang sedang di jalan tahu ke mana harus berbelok tanpa membuka peta.
 */
export interface RadarPickupDto extends PickupRequestDto {
  /** Jarak garis lurus dari posisi pemulung, dalam meter. */
  distanceMeters: number;
  /**
   * Arah dari posisi pemulung menuju permintaan, dalam derajat 0–360.
   * 0 = utara, 90 = timur, 180 = selatan, 270 = barat.
   */
  bearingDegrees: number;
  /** Nama warga yang membuat permintaan, untuk ditampilkan pada kartu radar. */
  citizenName: string;
  /** Umur permintaan dalam menit, dibulatkan ke menit terdekat. */
  ageMinutes: number;
  /**
   * Umur permintaan dalam bentuk kasar berbahasa Indonesia
   * ("baru saja", "20 menit lalu", "3 jam lalu", "2 hari lalu").
   *
   * Sengaja kasar: jam-menit yang presisi menggoda pemulung untuk berlomba
   * merebut permintaan terbaru, padahal yang berguna baginya hanyalah tahu
   * apakah permintaan masih segar atau sudah lama menganggur.
   */
  ageLabel: string;
  /**
   * `true` bila estimasi beratnya mencapai `HIGH_VALUE_MIN_WEIGHT_KG`.
   *
   * Permintaan seperti ini hanya dapat diambil pemulung Tingkat 2, dan pada
   * radar Tingkat 2 ia muncul lebih dahulu. Ditandai — bukan disembunyikan —
   * dari pemulung tingkat bawah, supaya jelas bahwa naik tingkat membuka
   * pekerjaan yang nyata dan bukan sekadar lencana.
   */
  highValue: boolean;
}
