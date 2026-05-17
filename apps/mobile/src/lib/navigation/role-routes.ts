import type { UserRole } from '@bingo/shared-types';

/** Rute home Expo Router setelah autentikasi, per peran. */
export function getAuthenticatedHome(role: UserRole): string {
  switch (role) {
    case 'WASTE_AGENT':
      return '/(agent-tabs)';
    case 'CITIZEN':
    case 'MSME':
    default:
      return '/(tabs)';
  }
}
