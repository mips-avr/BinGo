import type { CardTapResultDto, MemberCardDto, MemberCardStatus } from '@bingo/shared-types';

import { api } from '../../lib/api/client';
import { ENDPOINTS } from '../../lib/api/endpoints';

export interface IssueCardInput {
  holderName: string;
  holderPhone?: string;
  region: string;
  cardUid?: string;
  note?: string;
}

export async function issueMemberCard(input: IssueCardInput): Promise<MemberCardDto> {
  const { data } = await api.post<MemberCardDto>(ENDPOINTS.memberCards.root, input);
  return data;
}

export async function lookupCard(params: {
  uid?: string;
  cardNumber?: string;
}): Promise<CardTapResultDto> {
  const { data } = await api.get<CardTapResultDto>(ENDPOINTS.memberCards.lookup, { params });
  return data;
}

export async function listIssuedCards(): Promise<MemberCardDto[]> {
  const { data } = await api.get<MemberCardDto[]>(ENDPOINTS.memberCards.root);
  return data;
}

export async function setCardStatus(
  id: string,
  status: MemberCardStatus,
): Promise<MemberCardDto> {
  const { data } = await api.patch<MemberCardDto>(ENDPOINTS.memberCards.status(id), { status });
  return data;
}

export async function attachCardUid(id: string, uid: string): Promise<MemberCardDto> {
  const { data } = await api.patch<MemberCardDto>(ENDPOINTS.memberCards.uid(id), { uid });
  return data;
}
