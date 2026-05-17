import * as SecureStore from 'expo-secure-store';

/**
 * Wrapper tipis di atas `expo-secure-store`. Mengembalikan `null` saat key
 * belum ada agar caller tidak perlu menangani undefined.
 *
 * Catatan: pada simulator/web (jest) SecureStore otomatis fallback ke
 * in-memory; di device sebenarnya nilai disimpan di Keychain (iOS) /
 * EncryptedSharedPreferences (Android).
 */
export const secureStorage = {
  async get(key: string): Promise<string | null> {
    const value = await SecureStore.getItemAsync(key);
    return value ?? null;
  },
  async set(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },
};

export const STORAGE_KEYS = {
  accessToken: 'bingo.accessToken',
} as const;
