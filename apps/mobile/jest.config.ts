import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/**/__tests__/**/*.test.{ts,tsx}'],
  // Pola ini menentukan paket-paket di node_modules yang TETAP ditransformasi
  // oleh Babel (Jest default-nya melewati node_modules). RN+Expo memublikasikan
  // banyak modul Flow/JSX yang belum dikompilasi. `.pnpm` dimasukkan eksplisit
  // ke allow-list supaya file di virtual-store pnpm tetap ditransformasi
  // sampai segmen `node_modules/<paket>` berikutnya yang akan diperiksa ulang.
  transformIgnorePatterns: [
    'node_modules/(?!\\.pnpm|(jest-)?react-native|@react-native|expo(nent)?|@expo(nent)?|@expo-google-fonts|react-navigation|@react-navigation|@unimodules|unimodules|sentry-expo|native-base|react-native-svg|nativewind|@bingo)',
  ],
  moduleNameMapper: {
    '^@bingo/shared-types$': '<rootDir>/../../packages/shared-types/src',
    '^@bingo/shared-utils$': '<rootDir>/../../packages/shared-utils/src',
    '^@bingo/i18n$': '<rootDir>/../../packages/i18n/src',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
};

export default config;
