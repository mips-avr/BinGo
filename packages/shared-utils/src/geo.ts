/**
 * Helper geospasial murni (tanpa dependensi runtime eksternal).
 *
 * Catatan: untuk query produksi gunakan PostGIS (`ST_DWithin`, `ST_Distance`).
 * Fungsi-fungsi di sini dipakai untuk validasi input, perhitungan client-side,
 * dan unit test.
 */

const EARTH_RADIUS_KM = 6371;

export interface LatLngLiteral {
  lat: number;
  lng: number;
}

const toRadians = (deg: number): number => (deg * Math.PI) / 180;

/**
 * Jarak haversine (km) antara dua titik di permukaan bumi.
 * Akurat untuk jarak ≤ ~10.000 km dengan toleransi <0.5%.
 */
export function haversineKm(a: LatLngLiteral, b: LatLngLiteral): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Validasi koordinat WGS84 (lat ∈ [-90,90], lng ∈ [-180,180]). */
export function isValidLatLng(p: LatLngLiteral): boolean {
  return (
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng) &&
    p.lat >= -90 &&
    p.lat <= 90 &&
    p.lng >= -180 &&
    p.lng <= 180
  );
}

/**
 * Cek apakah koordinat berada dalam bounding box wilayah Indonesia
 * (lat -11..6, lng 95..141). Bermanfaat untuk validasi cepat input pengguna.
 */
export function isWithinIndonesia(p: LatLngLiteral): boolean {
  return p.lat >= -11 && p.lat <= 6 && p.lng >= 95 && p.lng <= 141;
}
