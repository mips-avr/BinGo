import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { UserProfile } from '@bingo/shared-types';
import { queryKeys } from '../../lib/query/client';
import { useAuthStore } from '../../store/authStore';
import { meApi } from './api';

/**
 * Profil pengguna yang sedang masuk, sebagai kueri React Query.
 *
 * Sebelum ini `queryKeys.me` hanya pernah di-*invalidate* (oleh
 * `useCompletePickup` dan `useVerifyReport`) tanpa ada satu pun pelanggan.
 * Invalidasi terhadap kunci yang tidak dilanggan siapa pun tidak melakukan
 * apa-apa, sehingga saldo poin di beranda warga baru berubah setelah aplikasi
 * ditutup dan dibuka kembali — persis pada momen yang seharusnya paling terasa
 * memuaskan, yaitu ketika penjemputannya baru saja selesai.
 *
 * Nilai yang berhasil dimuat juga disalin ke `authStore` supaya layar lain yang
 * membaca `useAuthStore((s) => s.user)` (profil, header pemulung) ikut segar
 * tanpa harus dipindah ke React Query satu per satu.
 */
export function useMe() {
  const status = useAuthStore((s) => s.status);
  const cachedUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const query = useQuery<UserProfile>({
    queryKey: queryKeys.me,
    queryFn: meApi,
    enabled: status === 'authenticated',
    // Profil sudah ada di store hasil hydrate/login, jadi tampilkan dulu itu
    // dan biarkan jaringan menyusul — tidak ada kedipan kerangka di beranda.
    initialData: cachedUser ?? undefined,
    // `0` menandai data awal itu sudah basi sejak awal, sehingga penyegaran di
    // latar tetap berjalan begitu layar terbuka. Tanpa ini React Query
    // menganggap nilai dari store segar selama `staleTime`, dan saldo poin
    // kembali tertinggal — persis bug yang sedang diperbaiki.
    initialDataUpdatedAt: 0,
    staleTime: 30 * 1000,
  });

  const fresh = query.data;
  useEffect(() => {
    if (fresh && fresh !== cachedUser) setUser(fresh);
  }, [fresh, cachedUser, setUser]);

  return query;
}
