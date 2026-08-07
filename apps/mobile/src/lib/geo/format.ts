import { t } from '../../i18n';

/** Format jarak meter menjadi teks ramah (Bahasa Indonesia). */
export function formatDistanceMeters(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return '—';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/** Delapan penjuru mata angin. */
export type CompassPoint = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

const COMPASS_POINTS: CompassPoint[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

/**
 * Membulatkan bearing 0–360° ke delapan penjuru.
 *
 * Pemulung di jalan tidak memakai derajat; ia memakai "ke timur laut". Delapan
 * penjuru sudah cukup untuk memutuskan arah belok dan jauh lebih mudah
 * diucapkan pembaca layar daripada "37 derajat".
 */
export function bearingToCompass(bearingDegrees: number): CompassPoint {
  if (!Number.isFinite(bearingDegrees)) return 'N';
  const normalized = ((bearingDegrees % 360) + 360) % 360;
  const index = Math.round(normalized / 45) % 8;
  return COMPASS_POINTS[index] as CompassPoint;
}

/** Nama arah dalam Bahasa Indonesia, untuk dibacakan pembaca layar. */
export function formatBearing(bearingDegrees: number): string {
  return t.agent.nearby.direction[bearingToCompass(bearingDegrees)];
}
