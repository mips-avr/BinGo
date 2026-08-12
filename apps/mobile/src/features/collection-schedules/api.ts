import type { CollectionScheduleDto, CollectionScheduleQuery } from '@bingo/shared-types';

import { api } from '../../lib/api/client';
import { ENDPOINTS } from '../../lib/api/endpoints';

export async function listCollectionSchedules(
  query: CollectionScheduleQuery = {},
): Promise<CollectionScheduleDto[]> {
  const { data } = await api.get<CollectionScheduleDto[]>(ENDPOINTS.collectionSchedules.root, {
    params: {
      ...(query.region ? { region: query.region } : {}),
      ...(query.material ? { material: query.material } : {}),
      ...(query.day ? { day: query.day } : {}),
    },
  });
  return data;
}
