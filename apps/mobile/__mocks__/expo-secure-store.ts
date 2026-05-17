/**
 * Mock in-memory untuk `expo-secure-store` saat berjalan di Jest (tanpa
 * native module). Cukup mensimulasikan get/set/delete yang dipakai aplikasi.
 */
const store = new Map<string, string>();

export async function getItemAsync(key: string): Promise<string | null> {
  return store.has(key) ? (store.get(key) ?? null) : null;
}
export async function setItemAsync(key: string, value: string): Promise<void> {
  store.set(key, value);
}
export async function deleteItemAsync(key: string): Promise<void> {
  store.delete(key);
}

export function __resetSecureStoreMock(): void {
  store.clear();
}
