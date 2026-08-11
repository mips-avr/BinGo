import { useQuery } from '@tanstack/react-query';

import { DEFAULT_DROP_POINT_RADIUS_KM, type MaterialType } from '@bingo/shared-types';

import { queryKeys } from '../../lib/query/client';
import { getDropPointsByRegion, getNearbyDropPoints } from './api';

/**
 * Kuantisasi koordinat sebelum masuk kunci cache.
 *
 * Alasannya sama persis seperti pada radar pemulung: GPS bergeser beberapa
 * meter tiap detik walaupun ponselnya diam di meja. Koordinat mentah di dalam
 * kunci membuat setiap pembaruan posisi melahirkan entri cache baru, daftar
 * titik setor berkedip kosong, dan permintaan jaringan berlipat pada paket data
 * yang mahal. Tiga desimal ≈ 110 meter — jauh lebih halus daripada yang berarti
 * bagi keputusan "ke mana saya bawa ini".
 */
function quantize(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function useNearbyDropPoints(
  coords: { lat: number; lng: number } | null,
  material: MaterialType | null = null,
  radiusKm: number = DEFAULT_DROP_POINT_RADIUS_KM,
) {
  const lat = coords ? quantize(coords.lat) : 0;
  const lng = coords ? quantize(coords.lng) : 0;

  return useQuery({
    queryKey: coords
      ? queryKeys.dropPoints.nearby(lat, lng, radiusKm, material)
      : (['drop-points', 'nearby', 'noop'] as const),
    queryFn: () => getNearbyDropPoints(lat, lng, radiusKm, material),
    enabled: Boolean(coords),
    staleTime: 10 * 60 * 1000,
  });
}

export function useDropPointsByRegion(region: string, material: MaterialType | null = null) {
  const trimmed = region.trim();
  return useQuery({
    queryKey:
      trimmed.length >= 3
        ? queryKeys.dropPoints.byRegion(trimmed, material)
        : (['drop-points', 'region', 'noop'] as const),
    queryFn: () => getDropPointsByRegion(trimmed, material),
    enabled: trimmed.length >= 3,
    staleTime: 10 * 60 * 1000,
  });
}
