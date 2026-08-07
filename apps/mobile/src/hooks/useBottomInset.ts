import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../theme';

/**
 * Padding bawah aman untuk konten yang bisa digulir pada layar `headerShown:false`.
 *
 * Layar yang didorong di atas stack tidak mendapat inset bawah dari mana pun,
 * sehingga tombol terakhir (biasanya tombol kirim) bisa berhenti persis di
 * bawah home indicator pada perangkat tanpa tombol fisik.
 */
export function useBottomInset(base: number = spacing.xxl): number {
  const insets = useSafeAreaInsets();
  return base + insets.bottom;
}
