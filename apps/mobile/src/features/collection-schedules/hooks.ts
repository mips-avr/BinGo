import { useQuery } from '@tanstack/react-query';
import type { CollectionScheduleQuery } from '@bingo/shared-types';

import { queryKeys } from '../../lib/query/client';
import { listCollectionSchedules } from './api';

export function useCollectionSchedules(query: CollectionScheduleQuery = {}) {
  const region = query.region?.trim() ?? '';
  const material = query.material ?? null;
  const day = query.day ?? null;

  return useQuery({
    queryKey: queryKeys.collectionSchedules.list(region, material, day),
    queryFn: () =>
      listCollectionSchedules({
        ...(region ? { region } : {}),
        ...(material ? { material } : {}),
        ...(day ? { day } : {}),
      }),
    staleTime: 30 * 60 * 1000,
  });
}
