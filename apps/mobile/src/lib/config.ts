import Constants from 'expo-constants';

/**
 * Akses tipemamah ke konfigurasi runtime yang dipasok via app.config.ts.
 */
interface AppExtra {
  apiBaseUrl: string;
}

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<AppExtra>;

/**
 * Tidak ada nilai bawaan di sini, dan itu disengaja.
 *
 * `app.config.ts` selalu mengisi `extra.apiBaseUrl` saat build, jadi bawaan di
 * sini tidak pernah terpakai — tetapi literalnya tetap ikut ter-bundle. Di
 * bundel web produksi, literal alamat lokal yang menganggur itu
 * mustahil dibedakan dari alamat yang benar-benar terpakai, sehingga pemeriksa
 * di CD menolak bundel yang sebenarnya sehat. Menghapusnya membuat pemeriksaan
 * itu berarti lagi.
 */
const apiBaseUrl = extra.apiBaseUrl?.trim();

if (!apiBaseUrl) {
  throw new Error(
    'extra.apiBaseUrl kosong. Build ini dibuat tanpa app.config.ts yang benar; ' +
      'setel EXPO_PUBLIC_API_BASE_URL lalu build ulang.',
  );
}

export const appConfig = {
  apiBaseUrl,
};
