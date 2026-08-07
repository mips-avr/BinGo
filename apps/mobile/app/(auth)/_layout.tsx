import { Stack } from 'expo-router';
import { colors } from '../../src/theme';

/**
 * Latar stack harus sama persis dengan latar layar di dalamnya. Sebelumnya
 * stack ini dicat `#F0FDF4` sementara setiap layar auth mengecat `#F4F6F8`,
 * jadi dua latar berbeda saling bertumpuk dan terlihat saat transisi.
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bingo50 } }}
    />
  );
}
