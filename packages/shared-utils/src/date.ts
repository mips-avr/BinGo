/**
 * Helper tanggal/zona waktu Indonesia.
 * Default ke WIB (Asia/Jakarta).
 */

export type IndonesianTimezone = 'Asia/Jakarta' | 'Asia/Makassar' | 'Asia/Jayapura';

/** Format ISO timestamp menjadi tanggal lokal Indonesia. */
export function formatTanggalID(
  iso: string | Date,
  tz: IndonesianTimezone = 'Asia/Jakarta',
): string {
  const d = iso instanceof Date ? iso : new Date(iso);
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: tz,
  }).format(d);
}

/** Format ISO timestamp menjadi tanggal + jam lokal Indonesia. */
export function formatWaktuID(
  iso: string | Date,
  tz: IndonesianTimezone = 'Asia/Jakarta',
): string {
  const d = iso instanceof Date ? iso : new Date(iso);
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: tz,
  }).format(d);
}
