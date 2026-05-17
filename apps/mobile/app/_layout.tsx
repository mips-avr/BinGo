import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../src/styles/global.css';

/**
 * Layout root aplikasi BinGo.
 * Phase berikutnya akan menambahkan provider Zustand, React Query, dan
 * konteks autentikasi di sini.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
