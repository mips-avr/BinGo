import * as Location from 'expo-location';
import type { LatLng } from '@bingo/shared-types';
import { t } from '../../i18n';

export interface LocationResult {
  coords: LatLng;
  accuracy: number | null;
  address?: string;
}

/** Berhenti mengikuti posisi. Wajib dipanggil saat komponen dilepas. */
export interface LocationWatcher {
  remove: () => void;
}

/**
 * Mengikuti posisi secara terus-menerus.
 *
 * `distanceInterval` 25 meter dipilih sebagai kompromi: cukup rapat agar jarak
 * pada radar pemulung tetap benar saat ia berjalan atau naik motor pelan,
 * cukup renggang agar GPS tidak dibangunkan setiap detik. `timeInterval`
 * menjadi batas atas agar posisi tetap diperbarui walau derau GPS membuat
 * perpindahan tidak pernah menembus 25 meter.
 *
 * Melempar error berbahasa Indonesia bila izin ditolak.
 */
export async function watchLocation(onChange: (coords: LatLng) => void): Promise<LocationWatcher> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== Location.PermissionStatus.GRANTED) {
    throw new Error(t.pickup.locationPermissionDenied);
  }
  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 25,
      timeInterval: 15_000,
    },
    (position) => {
      onChange({ lat: position.coords.latitude, lng: position.coords.longitude });
    },
  );
}

/**
 * Meminta izin & mengambil GPS warga sekali. Bila izin ditolak, melempar
 * error berbahasa Indonesia yang sudah siap ditampilkan ke UI.
 */
export async function getCurrentLocation(): Promise<LocationResult> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== Location.PermissionStatus.GRANTED) {
    throw new Error(t.pickup.locationPermissionDenied);
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
