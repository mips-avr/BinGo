import type {
  CreateWeighingReceiptRequest,
  PriceBoardDto,
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
): Promise<PriceBoardDto> {
  const { data } = await api.get<PriceBoardDto>(ENDPOINTS.weighing.priceBoard, {
    params: { region, windowDays },
  });
  return data;
}
