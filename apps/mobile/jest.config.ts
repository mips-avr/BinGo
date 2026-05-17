import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/**/__tests__/**/*.test.{ts,tsx}'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind|@bingo/.*))',
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
