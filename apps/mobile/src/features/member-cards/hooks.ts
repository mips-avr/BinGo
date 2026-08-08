import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { MemberCardStatus } from '@bingo/shared-types';

import { queryKeys } from '../../lib/query/client';
import {
  attachCardUid,
  type IssueCardInput,
  issueMemberCard,
  listIssuedCards,
  lookupCard,
  setCardStatus,
} from './api';

export function useIssuedCards(enabled = true) {
  return useQuery({
    queryKey: queryKeys.memberCards.issued,
    queryFn: listIssuedCards,
    enabled,
  });
}

export function useIssueCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: IssueCardInput) => issueMemberCard(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.memberCards.issued });
    },
  });
}

/**
 * Pencarian pemegang kartu sebagai mutasi, bukan query.
 *
 * Terlihat seperti pembacaan, tetapi berperilaku sebagai perintah: server
 * memperbarui `lastUsedAt` setiap kali kartu dibaca. Dijadikan `useQuery`, ia
 * akan ikut dijalankan ulang setiap kali jendela mendapat fokus atau cache
 * basi, dan penanda pemakaian kartu jadi berbohong.
 */
export function useCardLookup() {
  return useMutation({
    mutationFn: (params: { uid?: string; cardNumber?: string }) => lookupCard(params),
  });
}

export function useSetCardStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: MemberCardStatus }) =>
      setCardStatus(id, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.memberCards.issued });
    },
  });
}

export function useAttachCardUid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, uid }: { id: string; uid: string }) => attachCardUid(id, uid),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.memberCards.issued });
    },
  });
}
