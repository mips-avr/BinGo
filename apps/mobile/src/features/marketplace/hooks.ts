import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/query/client';
import { getMarketplaceItem, listMarketplaceItems } from './api';

export function useMarketplaceItems(search = '') {
  return useQuery({
    queryKey: queryKeys.marketplace.items(search),
    queryFn: () => listMarketplaceItems(search || undefined),
  });
}

export function useMarketplaceItem(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.marketplace.item(id) : ['marketplace', 'item', 'noop'],
    queryFn: () => getMarketplaceItem(id as string),
    enabled: Boolean(id),
  });
}
