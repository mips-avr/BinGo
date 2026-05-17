import type { ExpoConfig } from 'expo/config';

/**
 * Konfigurasi Expo dinamis.
 * Variabel dengan prefiks `EXPO_PUBLIC_*` akan otomatis ter-expose ke runtime.
 */
const config: ExpoConfig = {
  name: 'BinGo',
  slug: 'bingo',
  scheme: 'bingo',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  platforms: ['ios', 'android'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'id.bingo.app',
  },
  android: {
    package: 'id.bingo.app',
    adaptiveIcon: {
      backgroundColor: '#16A34A',
    },
  },
  experiments: {
    typedRoutes: true,
  },
  plugins: ['expo-router'],
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000',
  },
};

export default config;
