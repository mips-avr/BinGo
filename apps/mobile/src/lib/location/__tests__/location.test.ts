import * as Location from 'expo-location';
import { getCurrentLocation } from '../index';

describe('getCurrentLocation', () => {
  afterEach(() => jest.clearAllMocks());

  it('mengembalikan koordinat & alamat saat izin diberikan', async () => {
    const res = await getCurrentLocation();
    expect(res.coords).toEqual({ lat: -6.1944, lng: 106.8229 });
    expect(res.address).toContain('Jakarta');
  });

  it('melempar error berbahasa Indonesia saat izin ditolak', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: Location.PermissionStatus.DENIED,
    });
    await expect(getCurrentLocation()).rejects.toThrow(/Izin lokasi ditolak/);
  });

  it('tetap mengembalikan koordinat walau reverse geocode gagal', async () => {
    (Location.reverseGeocodeAsync as jest.Mock).mockRejectedValueOnce(new Error('offline'));
    const res = await getCurrentLocation();
    expect(res.coords).toBeDefined();
    expect(res.address).toBeUndefined();
  });
});
