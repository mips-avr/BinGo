import type {
  CreatePickupRequest,
  NearbyPickupQuery,
  PickupRequestDto,
  RadarPickupDto,
  RadarQuery,
} from '@bingo/shared-types';
import { api } from '../../lib/api/client';
import { ENDPOINTS } from '../../lib/api/endpoints';

export interface NearbyPickupResult extends PickupRequestDto {
  distanceMeters: number;
}

export async function listMyPickups(): Promise<PickupRequestDto[]> {
  const { data } = await api.get<PickupRequestDto[]>(ENDPOINTS.pickups.mine);
  return data;
}

export async function listAssignedPickups(): Promise<PickupRequestDto[]> {
  const { data } = await api.get<PickupRequestDto[]>(ENDPOINTS.pickups.assigned);
  return data;
}

export async function listNearbyPickups(q: NearbyPickupQuery): Promise<NearbyPickupResult[]> {
  const { data } = await api.get<NearbyPickupResult[]>(ENDPOINTS.pickups.nearby, {
    params: { lat: q.lat, lng: q.lng, radiusKm: q.radiusKm ?? 5 },
  });
  return data;
}

/**
 * Radar pemulung. Sama seperti `nearby`, tetapi setiap titik membawa arah
 * (`bearingDegrees`), nama warga, dan umur permintaan — yang dibutuhkan agar
 * pemulung bisa memutuskan sambil berjalan tanpa membuka peta.
 *
 * Parameter opsional yang tidak diisi sengaja tidak dikirim: mengirim
 * `materialType=` kosong akan ditolak validasi backend.
 */
export async function listRadarPickups(q: RadarQuery): Promise<RadarPickupDto[]> {
  const { data } = await api.get<RadarPickupDto[]>(ENDPOINTS.pickups.radar, {
    params: {
      lat: q.lat,
      lng: q.lng,
      radiusKm: q.radiusKm ?? 5,
      ...(q.materialType ? { materialType: q.materialType } : {}),
      ...(q.minWeightKg != null ? { minWeightKg: q.minWeightKg } : {}),
    },
  });
  return data;
}

export async function getPickup(id: string): Promise<PickupRequestDto> {
  const { data } = await api.get<PickupRequestDto>(ENDPOINTS.pickups.byId(id));
  return data;
}

export async function createPickup(body: CreatePickupRequest): Promise<PickupRequestDto> {
  const { data } = await api.post<PickupRequestDto>(ENDPOINTS.pickups.root, body);
  return data;
}

export async function cancelPickup(id: string): Promise<PickupRequestDto> {
  const { data } = await api.patch<PickupRequestDto>(ENDPOINTS.pickups.cancel(id));
  return data;
}

export async function acceptPickup(id: string): Promise<PickupRequestDto> {
  const { data } = await api.patch<PickupRequestDto>(ENDPOINTS.pickups.accept(id));
  return data;
}

export async function completePickup(id: string): Promise<PickupRequestDto> {
  const { data } = await api.patch<PickupRequestDto>(ENDPOINTS.pickups.complete(id));
  return data;
}

/** ACCEPTED → IN_PROGRESS. Catatan: ini POST, bukan PATCH seperti transisi lain. */
export async function startPickup(id: string): Promise<PickupRequestDto> {
  const { data } = await api.post<PickupRequestDto>(ENDPOINTS.pickups.start(id));
  return data;
}

/**
 * Melepas pekerjaan: ACCEPTED|IN_PROGRESS → PENDING dengan `agentId` dikosongkan.
 *
 * Tanpa jalan keluar ini, pemulung yang terlanjur menerima lalu berhalangan
 * hanya punya dua pilihan: menyelesaikan penjemputan yang tidak pernah terjadi,
 * atau meninggalkan permintaan warga menggantung selamanya.
 */
export async function releasePickup(id: string): Promise<PickupRequestDto> {
  const { data } = await api.patch<PickupRequestDto>(ENDPOINTS.pickups.release(id));
  return data;
}
