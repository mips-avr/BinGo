import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateWeighingReceiptRequest } from '@bingo/shared-types';
import { queryKeys } from '../../lib/query/client';
import { createReceipt, getPriceBoard, getReceipt, listMyReceipts } from './api';

export function useMyReceipts() {
  return useQuery({ queryKey: queryKeys.weighing.mine, queryFn: listMyReceipts });
}

export function useReceipt(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.weighing.detail(id) : ['weighing', 'detail', 'noop'],
    queryFn: () => getReceipt(id as string),
    enabled: Boolean(id),
  });
}

/**
 * Papan harga hanya diambil bila wilayah sudah diisi. Tidak ada papan harga
 * nasional, jadi kueri tanpa wilayah memang tidak punya arti.
 */
export function usePriceBoard(region: string, windowDays = 7) {
  const trimmed = region.trim();
  return useQuery({
    queryKey: trimmed
      ? queryKeys.weighing.priceBoard(trimmed, windowDays)
      : ['weighing', 'price-board', 'disabled'],
    queryFn: () => getPriceBoard(trimmed, windowDays),
    enabled: trimmed.length >= 3,
  });
}

export function useCreateReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWeighingReceiptRequest) => createReceipt(input),
    onSuccess: (receipt) => {
      qc.invalidateQueries({ queryKey: queryKeys.weighing.mine });
      qc.invalidateQueries({ queryKey: queryKeys.weighing.detail(receipt.id) });
      // Bukti baru mengubah sebaran harga di wilayahnya.
      qc.invalidateQueries({ queryKey: ['weighing', 'price-board'] });
      if (receipt.pickupRequestId) {
        qc.invalidateQueries({ queryKey: queryKeys.pickups.detail(receipt.pickupRequestId) });
      }
      qc.invalidateQueries({ queryKey: queryKeys.pickups.assigned });
    },
  });
}
