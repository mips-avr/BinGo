import type { UserRole } from '@bingo/shared-types';

/** Rute home Expo Router setelah autentikasi, per peran. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAuthenticatedHome(role: UserRole): any {
  switch (role) {
    case 'PLATFORM_ADMIN':
      return '/(platform)' as const;
    case 'MANAGER_ADMIN':
    case 'MANAGER_OPERATOR':
      return '/(manager)' as const;
    case 'COLLECTOR':
      return '/(collector-tabs)' as const;
    case 'BUSINESS_BUYER':
      return '/(business)' as const;
    case 'HOUSEHOLD':
      return '/(tabs)' as const;
    case 'WASTE_AGENT':
      return '/(collector-tabs)' as const;
    case 'MSME':
      return '/(business)' as const;
    case 'CITIZEN':
    default:
      return '/(tabs)' as const;
  }
}
