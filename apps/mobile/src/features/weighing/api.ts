import type {
  CreateWeighingReceiptRequest,
  MaterialGrade,
  PriceBoardDto,
  RegionSummaryDto,
  WeighingReceiptDto,
} from '@bingo/shared-types';
import { api } from '../../lib/api/client';
import { ENDPOINTS } from '../../lib/api/endpoints';

export async function listMyReceipts(): Promise<WeighingReceiptDto[]> {
  const { data } = await api.get<WeighingReceiptDto[]>(ENDPOINTS.weighing.mine);
  return data;
}

export async function getReceipt(id: string): Promise<WeighingReceiptDto> {
  const { data } = await api.get<WeighingReceiptDto>(ENDPOINTS.weighing.byId(id));
  return data;
}

export async function createReceipt(
  body: CreateWeighingReceiptRequest,
): Promise<WeighingReceiptDto> {
  const { data } = await api.post<WeighingReceiptDto>(ENDPOINTS.weighing.root, body);
  return data;
}

export async function getPriceBoard(
  region: string,
  windowDays = 7,
  grade?: MaterialGrade | null,
): Promise<PriceBoardDto> {
  const { data } = await api.get<PriceBoardDto>(ENDPOINTS.weighing.priceBoard, {
    params: { region, windowDays, ...(grade ? { grade } : {}) },
  });
  return data;
}

/**
 * Daftar wilayah yang benar-benar punya bukti timbang.
 *
 * Endpoint publik: warga tanpa akun pun boleh membaca papan harga, jadi
 * autocomplete-nya tidak boleh menuntut token.
 */
export async function listRegions(): Promise<RegionSummaryDto[]> {
  const { data } = await api.get<RegionSummaryDto[]>(ENDPOINTS.weighing.regions);
  return data;
}
