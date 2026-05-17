import { haversineKm, isValidLatLng, isWithinIndonesia } from '../geo';

describe('haversineKm', () => {
  it('mengembalikan 0 untuk titik identik', () => {
    expect(haversineKm({ lat: -6.2, lng: 106.8 }, { lat: -6.2, lng: 106.8 })).toBeCloseTo(0, 5);
  });

  it('menghitung jarak Jakarta–Bandung kira-kira ~120 km', () => {
    const jakarta = { lat: -6.2088, lng: 106.8456 };
    const bandung = { lat: -6.9175, lng: 107.6191 };
    const d = haversineKm(jakarta, bandung);
    expect(d).toBeGreaterThan(115);
    expect(d).toBeLessThan(135);
  });
});

describe('isValidLatLng', () => {
  it('menerima koordinat valid', () => {
    expect(isValidLatLng({ lat: 0, lng: 0 })).toBe(true);
    expect(isValidLatLng({ lat: -6.2, lng: 106.8 })).toBe(true);
  });

  it('menolak koordinat di luar rentang', () => {
    expect(isValidLatLng({ lat: 100, lng: 0 })).toBe(false);
    expect(isValidLatLng({ lat: 0, lng: 200 })).toBe(false);
    expect(isValidLatLng({ lat: Number.NaN, lng: 0 })).toBe(false);
  });
});

describe('isWithinIndonesia', () => {
  it('mengenali wilayah Indonesia', () => {
    expect(isWithinIndonesia({ lat: -6.2, lng: 106.8 })).toBe(true);   // Jakarta
    expect(isWithinIndonesia({ lat: -2.5, lng: 140.7 })).toBe(true);   // Jayapura
  });

  it('menolak titik di luar Indonesia', () => {
    expect(isWithinIndonesia({ lat: 35.6, lng: 139.7 })).toBe(false);  // Tokyo
  });
});
