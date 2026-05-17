import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../src/styles/global.css';
import { useAuthStore } from '../src/store/authStore';

/**
 * Layout root aplikasi BinGo.
 * - Memuat token dari SecureStore saat aplikasi pertama kali boot.
 * - Phase 4+ akan menambahkan provider React Query & error boundary global.
 */
export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
