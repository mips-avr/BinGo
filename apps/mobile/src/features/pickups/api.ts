import type {
  CreatePickupRequest,
  NearbyPickupQuery,
  PickupRequestDto,
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
