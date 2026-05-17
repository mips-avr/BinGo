import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CheckoutRequest } from '@bingo/shared-types';
import { queryKeys } from '../../lib/query/client';
import {
  checkoutMarketplace,
  getMarketplaceItem,
  listMarketplaceItems,
  listMyTransactions,
} from './api';

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

export function useMyTransactions() {
  return useQuery({
    queryKey: queryKeys.marketplace.myTransactions,
    queryFn: listMyTransactions,
  });
}

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CheckoutRequest) => checkoutMarketplace(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketplace'] });
      qc.invalidateQueries({ queryKey: queryKeys.marketplace.myTransactions });
    },
  });
}
