import { useEffect, useState } from 'react';

/**
 * Menunda perubahan nilai sampai pengetikan berhenti selama `delayMs`.
 *
 * Kolom pencarian di WasteMart dan kolom wilayah pada papan harga sebelumnya
 * memicu satu permintaan jaringan per ketukan tombol — mahal pada paket data
 * terbatas dan membuat daftar berkedip di setiap huruf.
 */
export function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
