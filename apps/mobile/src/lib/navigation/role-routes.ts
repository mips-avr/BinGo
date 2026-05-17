import type { UserRole } from '@bingo/shared-types';

/** Rute home Expo Router setelah autentikasi, per peran. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAuthenticatedHome(role: UserRole): any {
  switch (role) {
    case 'WASTE_AGENT':
      return '/(agent-tabs)' as const;
    case 'MSME':
      return '/(msme-tabs)' as const;
    case 'CITIZEN':
    default:
      return '/(tabs)' as const;
  }
}
