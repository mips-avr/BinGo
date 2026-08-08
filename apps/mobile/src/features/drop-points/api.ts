import type { DropPointDto, MaterialType } from '@bingo/shared-types';

import { api } from '../../lib/api/client';
import { ENDPOINTS } from '../../lib/api/endpoints';

export async function getNearbyDropPoints(
  lat: number,
  lng: number,
  radiusKm: number,
  material: MaterialType | null,
): Promise<DropPointDto[]> {
  const { data } = await api.get<DropPointDto[]>(ENDPOINTS.dropPoints.nearby, {
    params: { lat, lng, radiusKm, ...(material ? { material } : {}) },
  });
  return data;
}

export async function getDropPointsByRegion(
  region: string,
  material: MaterialType | null,
): Promise<DropPointDto[]> {
  const { data } = await api.get<DropPointDto[]>(ENDPOINTS.dropPoints.byRegion, {
    params: { region, ...(material ? { material } : {}) },
  });
  return data;
}
