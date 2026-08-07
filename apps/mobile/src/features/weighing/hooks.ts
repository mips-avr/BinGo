import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateWeighingReceiptRequest,
  MaterialGrade,
  WeighingReceiptDto,
} from '@bingo/shared-types';
import { queryKeys } from '../../lib/query/client';
import { createReceipt, getPriceBoard, getReceipt, listMyReceipts, listRegions } from './api';

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

export interface ReceiptForPickup {
  receipt: WeighingReceiptDto | null;
  loading: boolean;
}

/**
 * Bukti timbang yang lahir dari satu permintaan penjemputan.
 *
 * `PickupRequestDto` tidak memuat rujukan ke bukti timbangnya, jadi pencocokan
 * dilakukan di sisi klien dari `GET /weighing-receipts/mine`. Konsekuensinya
 * disengaja dan penting: daftar itu hanya berisi bukti milik pengguna yang
 * sedang masuk — penyetor melihat bukti miliknya, penerbit melihat bukti
 * terbitannya — sehingga tidak ada kebocoran data antar-pengguna.
 *
 * Tanpa ini, layar pekerjaan menawarkan "Timbang & terbitkan bukti" berulang
 * kali pada penjemputan yang buktinya sudah terbit, dan warga tidak punya
 * jalan sama sekali untuk membuka buktinya dari detail penjemputan.
 */
export function useReceiptForPickup(pickupRequestId: string | undefined): ReceiptForPickup {
  const query = useMyReceipts();
  const receipt = useMemo(() => {
    if (!pickupRequestId || !query.data) return null;
    return query.data.find((r) => r.pickupRequestId === pickupRequestId) ?? null;
  }, [pickupRequestId, query.data]);

  return { receipt, loading: query.isLoading };
}

/**
 * Papan harga hanya diambil bila wilayah sudah diisi. Tidak ada papan harga
 * nasional, jadi kueri tanpa wilayah memang tidak punya arti.
 */
export function usePriceBoard(region: string, windowDays = 7, grade: MaterialGrade | null = null) {
  const trimmed = region.trim();
  return useQuery({
    queryKey: trimmed
      ? queryKeys.weighing.priceBoard(trimmed, windowDays, grade)
      : ['weighing', 'price-board', 'disabled'],
    queryFn: () => getPriceBoard(trimmed, windowDays, grade),
    enabled: trimmed.length >= 3,
  });
}

/**
 * Wilayah yang sudah punya bukti timbang, untuk autocomplete.
 *
 * Jumlah wilayah tumbuh lambat dan daftarnya dipakai di dua layar, jadi
 * `staleTime` panjang menghemat kuota pengguna.
 */
export function useRegions() {
  return useQuery({
    queryKey: queryKeys.weighing.regions,
    queryFn: listRegions,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWeighingReceiptRequest) => createReceipt(input),
    onSuccess: (receipt) => {
      qc.invalidateQueries({ queryKey: queryKeys.weighing.mine });
      qc.invalidateQueries({ queryKey: queryKeys.weighing.detail(receipt.id) });
      // Bukti baru mengubah sebaran harga di wilayahnya — dan bisa memunculkan
      // wilayah baru pada autocomplete.
      qc.invalidateQueries({ queryKey: ['weighing', 'price-board'] });
      qc.invalidateQueries({ queryKey: queryKeys.weighing.regions });
      if (receipt.pickupRequestId) {
        qc.invalidateQueries({ queryKey: queryKeys.pickups.detail(receipt.pickupRequestId) });
      }
      qc.invalidateQueries({ queryKey: queryKeys.pickups.assigned });
    },
  });
}
