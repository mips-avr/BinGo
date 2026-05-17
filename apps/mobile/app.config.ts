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
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'BinGo memakai lokasi Anda untuk menentukan titik penjemputan sampah & laporan ilegal.',
      NSCameraUsageDescription:
        'BinGo memerlukan kamera untuk TrashScan, laporan, dan foto bukti.',
      NSPhotoLibraryUsageDescription:
        'BinGo memerlukan akses foto untuk melampirkan bukti laporan.',
    },
  },
  android: {
    package: 'id.bingo.app',
    adaptiveIcon: {
      backgroundColor: '#16A34A',
    },
    permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION', 'CAMERA'],
  },
  experiments: {
    typedRoutes: true,
  },
  plugins: [
    'expo-router',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'BinGo memakai lokasi Anda untuk menentukan titik penjemputan sampah & laporan ilegal.',
      },
    ],
    [
      'expo-image-picker',
      {
        cameraPermission: 'BinGo memerlukan kamera untuk memotret bukti laporan.',
        photosPermission: 'BinGo memerlukan akses foto untuk melampirkan bukti laporan.',
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission: 'BinGo memakai kamera untuk TrashScan dan identifikasi kemasan.',
      },
    ],
  ],
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000',
  },
};

export default config;
