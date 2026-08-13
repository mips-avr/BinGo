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
  fetchPlatformApplication,
  fetchRoleDashboard,
  payMockInvoice,
  reviewApplication,
  tapCollectorCard,
  updateCollectorStop,
  createWasteReport,
  resolveWasteReport,
  createCollectionRoute,
  createCollectionRun,
  createCollector,
  issueCollectorCard,
  createLot,
  createRequirement,
  createOrder,
  receiveOrder,
  createWeightEvent,
  createStationWeight,
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
  createPlatformFacility,
  verifyPlatformFacility,
  archiveManagerResource,
  archiveMaterialCategory,
  businessRequirementAction,
  createManagerResource,
  createSupportTicket,
  fetchBusinessRequirements,
  fetchManagerResource,
  fetchMaterialCategories,
  fetchSupportTickets,
  updateBusinessRequirement,
  updateManagerResource,
  updateMaterialCategory,
  updateSupportTicket,
  updateWasteReportStatus,
  fetchPlatformFacilities,
  updatePlatformFacility,
  archivePlatformFacility,
  managerResourceAction,
  updateWasteReport,
  withdrawWasteReport,
  deactivateCollectorCard,
  updateCollectionRun,
  createSubscription,
  updateSubscription,
  createInvoice,
  updateInvoice,
  cancelBusinessOrder,
  managerOrderAction,
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

export function useManagerResource(resource: string, params: Record<string, unknown>) {
  return useQuery({
    queryKey: ['pivot', 'manager-resource', resource, params],
    queryFn: () => fetchManagerResource(resource, params),
  });
}
export function useManagerResourceMutation(resource: string) {
  const q = useQueryClient();
  return useMutation({
    mutationFn: ({
      action,
      id,
      data,
      reason,
    }: {
      action:
        | 'create'
        | 'update'
        | 'archive'
        | 'restore'
        | 'publish'
        | 'close'
        | 'duplicate'
        | 'request-verification';
      id?: string;
      data?: Record<string, unknown>;
      reason?: string;
    }) =>
      action === 'create'
        ? createManagerResource(resource, data ?? {})
        : action === 'update'
          ? updateManagerResource(resource, String(id), data ?? {})
          : ['archive', 'restore'].includes(action)
            ? archiveManagerResource(
                resource,
                String(id),
                reason ?? 'Diarsipkan melalui dashboard',
                action === 'restore',
              )
            : managerResourceAction(resource, String(id), action, reason),
    onSuccess: () => q.invalidateQueries({ queryKey: ['pivot', 'manager-resource', resource] }),
  });
}
export function useBusinessRequirements(params: Record<string, unknown>) {
  return useQuery({
    queryKey: ['pivot', 'business-requirements', params],
    queryFn: () => fetchBusinessRequirements(params),
  });
}
export function useBusinessRequirementMutation() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: ({
      action,
      id,
      data,
      reason,
    }: {
      action: 'update' | 'publish' | 'unpublish' | 'close' | 'archive' | 'restore' | 'delete';
      id: string;
      data?: Record<string, unknown>;
      reason?: string;
    }) =>
      action === 'update'
        ? updateBusinessRequirement(id, data ?? {})
        : businessRequirementAction(id, action, reason),
    onSuccess: () => q.invalidateQueries({ queryKey: ['pivot', 'business-requirements'] }),
  });
}
export const useMaterialCategories = () =>
  useQuery({ queryKey: ['pivot', 'material-categories'], queryFn: fetchMaterialCategories });
export function useMaterialCategoryMutation() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: ({
      code,
      action,
      data,
      reason,
    }: {
      code: string;
      action: 'update' | 'archive' | 'restore';
      data?: Record<string, unknown>;
      reason?: string;
    }) =>
      action === 'update'
        ? updateMaterialCategory(code, data ?? {})
        : archiveMaterialCategory(
            code,
            reason ?? 'Dinonaktifkan oleh Admin BinGo',
            action === 'restore',
          ),
    onSuccess: () => q.invalidateQueries({ queryKey: ['pivot', 'material-categories'] }),
  });
}
export const useSupportTickets = (platform = false) =>
  useQuery({
    queryKey: ['pivot', 'support-tickets', platform],
    queryFn: () => fetchSupportTickets(platform),
  });
export function useSupportTicketMutation() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: Record<string, unknown> }) =>
      id
        ? updateSupportTicket(id, data)
        : createSupportTicket(data as { subject: string; description: string }),
    onSuccess: () => q.invalidateQueries({ queryKey: ['pivot', 'support-tickets'] }),
  });
}

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
export const usePlatformApplication = (id: string) =>
  useQuery({
    queryKey: [...pivotKeys.applications, id],
    queryFn: () => fetchPlatformApplication(id),
    enabled: Boolean(id),
  });
export function useCreatePlatformFacility() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: createPlatformFacility,
    onSuccess: () => q.invalidateQueries({ queryKey: pivotKeys.facilities }),
  });
}
export const usePlatformFacilities = (archived = false) =>
  useQuery({
    queryKey: ['pivot', 'platform-facilities', archived],
    queryFn: () => fetchPlatformFacilities(archived),
  });
export function usePlatformFacilityMutation() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: ({
      action,
      id,
      data,
      reason,
    }: {
      action: 'create' | 'update' | 'archive' | 'restore';
      id?: string;
      data?: any;
      reason?: string;
    }) =>
      action === 'create'
        ? createPlatformFacility(data)
        : action === 'update'
          ? updatePlatformFacility(String(id), data)
          : archivePlatformFacility(
              String(id),
              reason ?? 'Tidak lagi ditampilkan pada direktori',
              action === 'restore',
            ),
    onSuccess: () => q.invalidateQueries({ queryKey: ['pivot', 'platform-facilities'] }),
  });
}
export function useVerifyPlatformFacility() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: verifyPlatformFacility,
    onSuccess: () => q.invalidateQueries({ queryKey: pivotKeys.facilities }),
  });
}
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
        : reactivateOrganization(id, reason ?? 'Pemeriksaan ulang telah selesai'),
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
export function useResolveReport() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => resolveWasteReport(id, note),
    onSuccess: () => q.invalidateQueries({ queryKey: pivotKeys.manager }),
  });
}
export function useUpdateReportStatus() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
      updateWasteReportStatus(id, status, note),
    onSuccess: () => q.invalidateQueries({ queryKey: pivotKeys.manager }),
  });
}
export function useHouseholdReportMutation() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: ({
      action,
      id,
      data,
      reason,
    }: {
      action: 'update' | 'withdraw';
      id: string;
      data?: any;
      reason?: string;
    }) =>
      action === 'update'
        ? updateWasteReport(id, data)
        : withdrawWasteReport(id, reason ?? 'Ditarik oleh pelapor'),
    onSuccess: () => q.invalidateQueries({ queryKey: ['pivot', 'reports'] }),
  });
}
export function useCreateCollectionRoute() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: createCollectionRoute,
    onSuccess: () => q.invalidateQueries({ queryKey: pivotKeys.manager }),
  });
}
export function useCreateCollectionRun() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: createCollectionRun,
    onSuccess: () => q.invalidateQueries({ queryKey: pivotKeys.manager }),
  });
}
export function useCollectionRunMutation() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateCollectionRun(id, data),
    onSuccess: () => q.invalidateQueries({ queryKey: pivotKeys.manager }),
  });
}
export function useSubscriptionMutation() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: any }) =>
      id ? updateSubscription(id, data) : createSubscription(data),
    onSuccess: () => q.invalidateQueries({ queryKey: pivotKeys.manager }),
  });
}
export function useInvoiceMutation() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: any }) =>
      id ? updateInvoice(id, data) : createInvoice(data),
    onSuccess: () => q.invalidateQueries({ queryKey: pivotKeys.manager }),
  });
}
export function useCreateCollector() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: createCollector,
    onSuccess: () => q.invalidateQueries({ queryKey: pivotKeys.manager }),
  });
}
export function useIssueCollectorCard() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: issueCollectorCard,
    onSuccess: () =>
      Promise.all([
        q.invalidateQueries({ queryKey: pivotKeys.manager }),
        q.invalidateQueries({ queryKey: ['pivot', 'manager-resource', 'collectors'] }),
      ]),
  });
}
export function useDeactivateCollectorCard() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: ({
      collectorId,
      cardId,
      reason,
    }: {
      collectorId: string;
      cardId: string;
      reason: string;
    }) => deactivateCollectorCard(collectorId, cardId, reason),
    onSuccess: () => q.invalidateQueries({ queryKey: ['pivot', 'manager-resource', 'collectors'] }),
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
export function useBusinessOrderAction() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => cancelBusinessOrder(id, reason),
    onSuccess: () => q.invalidateQueries({ queryKey: pivotKeys.business }),
  });
}
export function useManagerOrderAction() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
      reason,
    }: {
      id: string;
      action: 'confirm' | 'cancel';
      reason: string;
    }) => managerOrderAction(id, action, reason),
    onSuccess: () => q.invalidateQueries({ queryKey: pivotKeys.manager }),
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
export function useCreateStationWeight() {
  const q = useQueryClient();
  return useMutation({
    mutationFn: createStationWeight,
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
