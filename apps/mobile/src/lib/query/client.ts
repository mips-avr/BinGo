import { QueryClient } from '@tanstack/react-query';
import { extractApiErrorMessage } from '../api/client';

/**
 * Konfigurasi React Query untuk seluruh aplikasi.
 * - `staleTime` agak panjang (1 menit) karena data inti (laporan, pickup) tidak
 *   berubah per detik dan kita ingin tabbing antar layar terasa instan.
 * - `retry` default 1 — koneksi mobile sering goyang, namun 401/4xx tidak
 *   perlu diulang.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: (failureCount, error) => {
        const msg = extractApiErrorMessage(error, '');
        if (msg.match(/401|403|404/)) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const queryKeys = {
  pickups: {
    mine: ['pickups', 'mine'] as const,
    assigned: ['pickups', 'assigned'] as const,
    nearby: (lat: number, lng: number, radiusKm: number) =>
      ['pickups', 'nearby', lat, lng, radiusKm] as const,
    detail: (id: string) => ['pickups', 'detail', id] as const,
  },
  reports: {
    all: (status?: string) => ['reports', 'all', status ?? null] as const,
    mine: ['reports', 'mine'] as const,
    detail: (id: string) => ['reports', 'detail', id] as const,
  },
  marketplace: {
    items: (search: string) => ['marketplace', 'items', search] as const,
    item: (id: string) => ['marketplace', 'item', id] as const,
    myTransactions: ['marketplace', 'transactions', 'mine'] as const,
  },
  me: ['auth', 'me'] as const,
};
