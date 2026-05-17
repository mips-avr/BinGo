import type {
  CheckoutRequest,
  CheckoutResult,
  MarketplaceItemDto,
  TransactionDto,
} from '@bingo/shared-types';
import { api } from '../../lib/api/client';
import { ENDPOINTS } from '../../lib/api/endpoints';

export async function listMarketplaceItems(search?: string): Promise<MarketplaceItemDto[]> {
  const { data } = await api.get<MarketplaceItemDto[]>(ENDPOINTS.marketplace.items, {
    params: search ? { search } : undefined,
  });
  return data;
}

export async function getMarketplaceItem(id: string): Promise<MarketplaceItemDto> {
  const { data } = await api.get<MarketplaceItemDto>(ENDPOINTS.marketplace.itemById(id));
  return data;
}

export async function checkoutMarketplace(body: CheckoutRequest): Promise<CheckoutResult> {
  const { data } = await api.post<CheckoutResult>(ENDPOINTS.marketplace.checkout, body);
  return data;
}

export async function listMyTransactions(): Promise<TransactionDto[]> {
  const { data } = await api.get<TransactionDto[]>(ENDPOINTS.marketplace.myTransactions);
  return data;
}
