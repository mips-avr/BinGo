import { formatRelativeId, formatTanggalID, formatWaktuID } from '../date';

describe('formatRelativeId', () => {
  const NOW = new Date('2026-05-17T12:00:00Z');

  it('mengembalikan "baru saja" untuk <30 detik', () => {
    expect(formatRelativeId(new Date('2026-05-17T11:59:55Z'), NOW)).toBe('baru saja');
  });

  it('mengembalikan menit yang lalu', () => {
    expect(formatRelativeId(new Date('2026-05-17T11:55:00Z'), NOW)).toBe('5 menit lalu');
  });

  it('mengembalikan jam yang lalu', () => {
    expect(formatRelativeId(new Date('2026-05-17T09:00:00Z'), NOW)).toBe('3 jam lalu');
  });

  it('mengembalikan "kemarin"', () => {
    expect(formatRelativeId(new Date('2026-05-16T12:00:00Z'), NOW)).toBe('kemarin');
  });

  it('mengembalikan tanggal panjang untuk >= 7 hari', () => {
    const out = formatRelativeId(new Date('2026-05-01T00:00:00Z'), NOW);
    expect(out).toMatch(/Mei 2026/);
  });
});

describe('formatTanggalID & formatWaktuID', () => {
  it('memformat dalam zona WIB', () => {
    const iso = '2026-05-17T05:00:00Z'; // 12:00 WIB
    expect(formatTanggalID(iso)).toMatch(/17 Mei 2026/);
    expect(formatWaktuID(iso)).toMatch(/12.00/);
  });
});
