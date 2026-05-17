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
