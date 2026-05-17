/**
 * Format angka menjadi mata uang Rupiah (IDR) dengan separator titik.
 * Contoh: 1500000 → "Rp 1.500.000".
 *
 * Menggunakan `Intl.NumberFormat('id-ID')` sehingga sesuai konvensi
 * akuntansi Indonesia (titik sebagai ribuan, koma sebagai desimal).
 */
export function formatIDR(amount: number, options: { withSymbol?: boolean } = {}): string {
  const { withSymbol = true } = options;
  if (!Number.isFinite(amount)) {
    return withSymbol ? 'Rp 0' : '0';
  }
  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
  return withSymbol ? `Rp ${formatted}` : formatted;
}
