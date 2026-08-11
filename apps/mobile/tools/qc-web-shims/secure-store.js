// Shim khusus QC (web): expo-secure-store tidak tersedia di browser.
const mem = {};
function read(k) {
  try { return window.localStorage.getItem(k); } catch { return mem[k] ?? null; }
}
export async function getItemAsync(key) { return read(key); }
export async function setItemAsync(key, value) {
  try { window.localStorage.setItem(key, value); } catch { mem[key] = value; }
}
export async function deleteItemAsync(key) {
  try { window.localStorage.removeItem(key); } catch { delete mem[key]; }
}
export async function isAvailableAsync() { return true; }
export const WHEN_UNLOCKED = 'whenUnlocked';
export default { getItemAsync, setItemAsync, deleteItemAsync, isAvailableAsync };
