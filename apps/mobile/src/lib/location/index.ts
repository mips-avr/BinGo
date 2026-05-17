import * as Location from 'expo-location';
import type { LatLng } from '@bingo/shared-types';

export interface LocationResult {
  coords: LatLng;
  accuracy: number | null;
  address?: string;
}

/**
 * Meminta izin & mengambil GPS warga sekali. Bila izin ditolak, melempar
 * error berbahasa Indonesia yang sudah siap ditampilkan ke UI.
 */
export async function getCurrentLocation(): Promise<LocationResult> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== Location.PermissionStatus.GRANTED) {
    throw new Error(
      'Izin lokasi ditolak. Aktifkan akses lokasi di pengaturan untuk menentukan titik pickup/laporan.',
    );
  }
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  let address: string | undefined;
  try {
    const reverse = await Location.reverseGeocodeAsync({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    });
    const first = reverse[0];
    if (first) {
      address = [first.street, first.subregion ?? first.city, first.region]
        .filter(Boolean)
        .join(', ');
    }
  } catch {
    // reverse geocode opsional — abaikan kegagalan
  }
  return {
    coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
    accuracy: pos.coords.accuracy ?? null,
    address,
  };
}
