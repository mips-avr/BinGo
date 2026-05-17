import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreatePickupRequest } from '@bingo/shared-types';
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

export function useNearbyPickups(
  lat: number | undefined,
  lng: number | undefined,
  radiusKm = 5,
) {
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
      qc.invalidateQueries({ queryKey: queryKeys.pickups.assigned });
      qc.invalidateQueries({ queryKey: queryKeys.pickups.detail(pickup.id) });
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
      qc.invalidateQueries({ queryKey: queryKeys.me });
    },
  });
}
