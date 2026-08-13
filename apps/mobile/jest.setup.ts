/**
 * Jest tidak memuat `app.config.ts`, jadi `Constants.expoConfig.extra` kosong
 * dan `src/lib/config.ts` — yang sengaja tidak lagi punya nilai bawaan — gagal
 * saat modulnya diimpor.
 *
 * Alamat dummy-nya dipasok di sini, bukan sebagai bawaan di dalam kode
 * aplikasi. Bedanya penting: berkas ini tidak pernah ikut ter-bundle, sehingga
 * pemeriksa "Verify baked API URL" di CD tetap berarti — satu-satunya alamat
 * yang bisa muncul di bundel produksi adalah yang benar-benar dipakai.
 */
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: { apiBaseUrl: 'http://127.0.0.1:3000' },
    },
  },
}));
