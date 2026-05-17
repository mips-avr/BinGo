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

/**
 * Format relatif singkat dalam Bahasa Indonesia, mis. "baru saja",
 * "5 menit lalu", "2 jam lalu", "Selasa, 15 Mei". Cocok untuk feed list.
 */
export function formatRelativeId(
  iso: string | Date,
  now: Date = new Date(),
  tz: IndonesianTimezone = 'Asia/Jakarta',
): string {
  const d = iso instanceof Date ? iso : new Date(iso);
  const diffSec = Math.round((now.getTime() - d.getTime()) / 1000);
  if (diffSec < 30) return 'baru saja';
  if (diffSec < 60) return `${diffSec} detik lalu`;
  const min = Math.round(diffSec / 60);
  if (min < 60) return `${min} menit lalu`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} jam lalu`;
  const day = Math.round(hr / 24);
  if (day === 1) return 'kemarin';
  if (day < 7) return `${day} hari lalu`;
  return formatTanggalID(d, tz);
}
