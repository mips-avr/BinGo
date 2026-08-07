import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import type { LatLng } from '@bingo/shared-types';

/**
 * Menyusun URL peta yang benar untuk tiap platform.
 *
 * Android memakai skema `geo:` RFC 5870 dengan parameter `q` agar penanda
 * benar-benar muncul di titiknya — `geo:lat,lng` saja hanya menggeser kamera
 * peta tanpa menandai apa pun, sehingga pemulung tidak tahu rumah mana yang
 * dimaksud. iOS memakai `maps://` bawaan Apple Maps.
 *
 * Koordinat sengaja tidak dibulatkan: lima desimal sudah setara ±1 meter dan
 * itulah ketelitian yang dibutuhkan untuk menemukan satu rumah di gang sempit.
 */
export function buildMapUrl(coords: LatLng, label?: string): string {
  const lat = coords.lat.toFixed(6);
  const lng = coords.lng.toFixed(6);
  const name = label?.trim() ? encodeURIComponent(label.trim()) : '';

  if (Platform.OS === 'ios') {
    // `ll` menempatkan kamera, `q` memberi nama penanda.
    return `maps://?ll=${lat},${lng}&q=${name || `${lat},${lng}`}`;
  }
  return `geo:${lat},${lng}?q=${lat},${lng}${name ? `(${name})` : ''}`;
}

/**
 * Membuka koordinat di aplikasi peta bawaan.
 *
 * Mengembalikan `false` bila tidak ada aplikasi yang bisa menangani tautannya —
 * kasus nyata pada perangkat murah tanpa Google Maps terpasang — supaya
 * pemanggil menampilkan pesan alih-alih diam saja.
 */
export async function openInMaps(coords: LatLng, label?: string): Promise<boolean> {
  const url = buildMapUrl(coords, label);
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      // Cadangan lintas platform: peta berbasis web selalu bisa dibuka peramban.
      const web = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
      if (!(await Linking.canOpenURL(web))) return false;
      await Linking.openURL(web);
      return true;
    }
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
