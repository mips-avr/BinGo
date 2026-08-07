import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreatePickupRequest, MaterialType } from '@bingo/shared-types';
import { queryKeys } from '../../lib/query/client';
import {
  acceptPickup,
  cancelPickup,
  completePickup,
  createPickup,
  getPickup,
  listAssignedPickups,
  listMyPickups,
  listNearbyPickups,
  listRadarPickups,
  releasePickup,
  startPickup,
} from './api';

export function useMyPickups() {
  return useQuery({ queryKey: queryKeys.pickups.mine, queryFn: listMyPickups });
}

export function useAssignedPickups() {
  return useQuery({
    queryKey: queryKeys.pickups.assigned,
    queryFn: listAssignedPickups,
  });
}

export function useNearbyPickups(lat: number | undefined, lng: number | undefined, radiusKm = 5) {
  return useQuery({
    queryKey:
      lat != null && lng != null
        ? queryKeys.pickups.nearby(lat, lng, radiusKm)
        : ['pickups', 'nearby', 'disabled'],
    queryFn: () => listNearbyPickups({ lat: lat as number, lng: lng as number, radiusKm }),
    enabled: lat != null && lng != null,
    refetchInterval: 30_000,
  });
}

export interface RadarFilters {
  radiusKm?: number;
  materialType?: MaterialType | null;
  minWeightKg?: number | null;
}

/**
 * Radar permintaan.
 *
 * `lat`/`lng` diharapkan sudah dikuantisasi oleh `useAgentLocation`, sehingga
 * pergeseran GPS beberapa meter tidak memecah cache. Pemulung yang benar-benar
 * berpindah tetap mendapat kunci baru — yang dihilangkan hanyalah derau.
 */
export function useRadarPickups(
  lat: number | undefined,
  lng: number | undefined,
  { radiusKm = 5, materialType = null, minWeightKg = null }: RadarFilters = {},
) {
  const enabled = lat != null && lng != null;
  return useQuery({
    queryKey: enabled
      ? queryKeys.pickups.radar(lat, lng, radiusKm, materialType, minWeightKg)
      : ['pickups', 'radar', 'disabled'],
    queryFn: () =>
      listRadarPickups({
        lat: lat as number,
        lng: lng as number,
        radiusKm,
        materialType: materialType ?? undefined,
        minWeightKg: minWeightKg ?? undefined,
      }),
    enabled,
    refetchInterval: 30_000,
  });
}

export function usePickup(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.pickups.detail(id) : ['pickups', 'detail', 'noop'],
    queryFn: () => getPickup(id as string),
    enabled: Boolean(id),
  });
}

export function useCreatePickup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePickupRequest) => createPickup(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.pickups.mine });
    },
  });
}

export function useCancelPickup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelPickup(id),
    onSuccess: (pickup) => {
      qc.invalidateQueries({ queryKey: queryKeys.pickups.mine });
      qc.invalidateQueries({ queryKey: queryKeys.pickups.detail(pickup.id) });
    },
  });
}

export function useAcceptPickup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => acceptPickup(id),
    onSuccess: (pickup) => {
      qc.invalidateQueries({ queryKey: ['pickups', 'nearby'] });
      qc.invalidateQueries({ queryKey: ['pickups', 'radar'] });
      qc.invalidateQueries({ queryKey: queryKeys.pickups.assigned });
      qc.invalidateQueries({ queryKey: queryKeys.pickups.detail(pickup.id) });
    },
  });
}

/** ACCEPTED → IN_PROGRESS. */
export function useStartPickup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => startPickup(id),
    onSuccess: (pickup) => {
      qc.invalidateQueries({ queryKey: queryKeys.pickups.assigned });
      qc.invalidateQueries({ queryKey: queryKeys.pickups.detail(pickup.id) });
    },
  });
}

/** ACCEPTED|IN_PROGRESS → PENDING. Permintaan kembali muncul di radar semua orang. */
export function useReleasePickup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => releasePickup(id),
    onSuccess: (pickup) => {
      qc.invalidateQueries({ queryKey: queryKeys.pickups.assigned });
      qc.invalidateQueries({ queryKey: queryKeys.pickups.detail(pickup.id) });
      qc.invalidateQueries({ queryKey: ['pickups', 'nearby'] });
      qc.invalidateQueries({ queryKey: ['pickups', 'radar'] });
    },
  });
}

export function useCompletePickup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => completePickup(id),
    onSuccess: (pickup) => {
      qc.invalidateQueries({ queryKey: queryKeys.pickups.assigned });
      qc.invalidateQueries({ queryKey: queryKeys.pickups.detail(pickup.id) });
      // Poin warga bertambah di sisi server. `useMe` mendengarkan kunci ini,
      // sehingga saldo di beranda ikut berubah tanpa memulai ulang aplikasi —
      // dulu invalidasi ini tidak punya satu pun pelanggan.
      qc.invalidateQueries({ queryKey: queryKeys.me });
    },
  });
}
