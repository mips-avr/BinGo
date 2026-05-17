import Constants from 'expo-constants';

/**
 * Akses tipemamah ke konfigurasi runtime yang dipasok via app.config.ts.
 */
interface AppExtra {
  apiBaseUrl: string;
}

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<AppExtra>;

export const appConfig = {
  apiBaseUrl: extra.apiBaseUrl ?? 'http://localhost:3000',
};
