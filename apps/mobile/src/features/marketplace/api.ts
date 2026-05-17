import type { MarketplaceItemDto } from '@bingo/shared-types';
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
