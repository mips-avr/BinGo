import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreatePickupRequest } from '@bingo/shared-types';
import { queryKeys } from '../../lib/query/client';
import {
  cancelPickup,
  createPickup,
  getPickup,
  listMyPickups,
} from './api';

export function useMyPickups() {
  return useQuery({ queryKey: queryKeys.pickups.mine, queryFn: listMyPickups });
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
