import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { enqueueEncryptedEvent } from '../offline/encryptedQueue';
import {
  fetchBusinessCatalog,
  fetchCollectorToday,
  fetchFacilities,
  fetchHouseholdService,
  fetchManagerOperations,
  fetchMyApplication,
  fetchPlatformApplications,
  fetchRoleDashboard,
  payMockInvoice,
  reviewApplication,
  tapCollectorCard,
  updateCollectorStop,
  createWasteReport,
  createLot,
  createRequirement,
  createOrder,
  receiveOrder,
  createWeightEvent,
  createIntakeBatch,
  approveBatch,
  updateMyApplication,
  uploadApplicationDocument,
  submitMyApplication,
  fetchPlatformOrganizations,
  suspendOrganization,
  reactivateOrganization,
  fetchPlatformModeration,
  moderatePublication,
  fetchPlatformAudit,
} from './api';

export const pivotKeys = {
  dashboard: ['pivot', 'dashboard'] as const,
  household: ['pivot', 'household'] as const,
  collector: ['pivot', 'collector'] as const,
  manager: ['pivot', 'manager'] as const,
  business: ['pivot', 'business'] as const,
  applications: ['pivot', 'applications'] as const,
  facilities: ['pivot', 'facilities'] as const,
  myApplication: ['pivot', 'my-application'] as const,
  organizations: ['pivot', 'platform-organizations'] as const,
  moderation: ['pivot', 'platform-moderation'] as const,
  audit: ['pivot', 'platform-audit'] as const,
};

export const useRoleDashboard = () =>
  useQuery({ queryKey: pivotKeys.dashboard, queryFn: fetchRoleDashboard });
export const useHouseholdService = () =>
  useQuery({ queryKey: pivotKeys.household, queryFn: fetchHouseholdService });
export const useCollectorToday = () =>
  useQuery({ queryKey: pivotKeys.collector, queryFn: fetchCollectorToday });
export const useManagerOperations = () =>
  useQuery({ queryKey: pivotKeys.manager, queryFn: fetchManagerOperations });
export const useBusinessCatalog = () =>
  useQuery({ queryKey: pivotKeys.business, queryFn: fetchBusinessCatalog });
export const usePlatformApplications = () =>
  useQuery({ queryKey: pivotKeys.applications, queryFn: fetchPlatformApplications });
export const useFacilities = (material?: string) =>
  useQuery({
    queryKey: [...pivotKeys.facilities, material],
    queryFn: () => fetchFacilities(material),
  });
export const useMyApplication = () =>
  useQuery({ queryKey: pivotKeys.myApplication, queryFn: fetchMyApplication });
export const usePlatformOrganizations = () =>
  useQuery({ queryKey: pivotKeys.organizations, queryFn: fetchPlatformOrganizations });
export const usePlatformModeration = () =>
  useQuery({ queryKey: pivotKeys.moderation, queryFn: fetchPlatformModeration });
export const usePlatformAudit = () =>
  useQuery({ queryKey: pivotKeys.audit, queryFn: fetchPlatformAudit });

export function usePayInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payMockInvoice,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: pivotKeys.household }),
        queryClient.invalidateQueries({ queryKey: pivotKeys.dashboard }),
      ]);
    },
  });
}
export function useUpdateStop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, issueNote }: { id: string; status: string; issueNote?: string }) =>
      updateCollectorStop(id, status, issueNote),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pivotKeys.collector }),
  });
}
export const useTapCard = () =>
  useMutation({
    mutationFn: async ({ credential, source }: { credential: string; source: string }) => {
      const deviceEventId = `card-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      try {
        return await tapCollectorCard(credential, source, deviceEventId);
      } catch (error) {
        if (isAxiosError(error) && !error.response) {
          await enqueueEncryptedEvent({
            deviceEventId,
            kind: 'CARD_TAP',
            payload: { credential, source, deviceEventId },
            queuedAt: new Date().toISOString(),
          });
          return {
            deviceEventId,
            result: 'queued',
            reason: 'Disimpan aman di perangkat dan akan dikirim saat tersambung.',
          };
        }
        throw error;
      }
    },
  });
export function useReviewApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
      reason,
    }: {
      id: string;
      action: 'approve' | 'request-changes' | 'reject';
      reason?: string;
    }) => reviewApplication(id, action, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pivotKeys.applications }),
  });
}
export function useUpdateMyApplication() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: updateMyApplication,
    onSuccess: () => q.invalidateQueries({ queryKey: pivotKeys.myApplication }),
  });
}
export function useUploadApplicationDocument() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: uploadApplicationDocument,
    onSuccess: () => q.invalidateQueries({ queryKey: pivotKeys.myApplication }),
  });
}
export function useSubmitMyApplication() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: submitMyApplication,
    onSuccess: () =>
      Promise.all([
        q.invalidateQueries({ queryKey: pivotKeys.myApplication }),
        q.invalidateQueries({ queryKey: pivotKeys.dashboard }),
      ]),
  });
}
export function useOrganizationStatus() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
      reason,
    }: {
      id: string;
      action: 'suspend' | 'reactivate';
      reason?: string;
    }) =>
      action === 'suspend'
        ? suspendOrganization(id, reason ?? 'Pelanggaran kebijakan platform')
        : reactivateOrganization(id),
    onSuccess: () => q.invalidateQueries({ queryKey: pivotKeys.organizations }),
  });
}
export function useModeratePublication() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: ({
      resourceType,
      id,
      action,
      reason,
    }: {
      resourceType: string;
      id: string;
      action: 'hide' | 'restore';
      reason?: string;
    }) => moderatePublication(resourceType, id, action, reason),
    onSuccess: () => q.invalidateQueries({ queryKey: pivotKeys.moderation }),
  });
}
export function useCreateReport() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: createWasteReport,
    onSuccess: () => q.invalidateQueries({ queryKey: ['pivot'] }),
  });
}
export function useCreateLot() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: createLot,
    onSuccess: () => q.invalidateQueries({ queryKey: pivotKeys.manager }),
  });
}
export function useCreateRequirement() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: createRequirement,
    onSuccess: () => q.invalidateQueries({ queryKey: pivotKeys.business }),
  });
}
export function useCreateOrder() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => q.invalidateQueries({ queryKey: pivotKeys.business }),
  });
}
export function useReceiveOrder() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: string;
      receivedKg: number;
      residueKg?: number;
      note?: string;
    }) => receiveOrder(id, input),
    onSuccess: () => q.invalidateQueries({ queryKey: pivotKeys.business }),
  });
}
export function useCreateWeight() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: createWeightEvent,
    onSuccess: () => q.invalidateQueries({ queryKey: pivotKeys.manager }),
  });
}
export function useCreateIntakeBatch() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: createIntakeBatch,
    onSuccess: () => q.invalidateQueries({ queryKey: pivotKeys.manager }),
  });
}
export function useApproveBatch() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: approveBatch,
    onSuccess: () => q.invalidateQueries({ queryKey: pivotKeys.manager }),
  });
}
