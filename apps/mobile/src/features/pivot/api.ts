import type { RoleDashboard } from '@bingo/shared-types';
import { Platform } from 'react-native';
import { api } from '../../lib/api/client';

export async function fetchRoleDashboard(): Promise<RoleDashboard> {
  const response = await api.get<RoleDashboard>('/api/v1/pivot/dashboard');
  return response.data;
}

export async function fetchHouseholdService() {
  const response = await api.get('/api/v1/pivot/household/service');
  return response.data;
}

export async function payMockInvoice(invoiceId: string) {
  const response = await api.post(`/api/v1/pivot/invoices/${invoiceId}/pay`, {
    idempotencyKey: `mobile-${invoiceId}-${Date.now()}`,
    method: 'QRIS Demo',
  });
  return response.data;
}

export async function fetchCollectorToday() {
  const response = await api.get('/api/v1/pivot/collector/today');
  return response.data;
}

export async function updateCollectorStop(id: string, status: string, issueNote?: string) {
  const response = await api.patch(`/api/v1/pivot/collector/stops/${id}`, { status, issueNote });
  return response.data;
}

export async function tapCollectorCard(
  credential: string,
  source: string,
  deviceEventId = `card-${Date.now()}-${Math.random().toString(36).slice(2)}`,
) {
  const response = await api.post('/api/v1/pivot/cards/tap', {
    credential,
    source,
    deviceEventId,
  });
  return response.data;
}

export async function fetchManagerOperations() {
  const response = await api.get('/api/v1/pivot/manager/operations');
  return response.data;
}

export async function createCollectionRoute(input: {
  serviceAreaId: string;
  name: string;
  stops: string[];
}) {
  return (await api.post('/api/v1/pivot/manager/routes', input)).data;
}

export async function createCollectionRun(input: {
  routeId: string;
  collectorId: string;
  vehicleId?: string;
  scheduledFor: string;
}) {
  return (await api.post('/api/v1/pivot/manager/runs', input)).data;
}
export async function updateCollectionRun(
  id: string,
  input: { scheduledFor?: string; action?: 'cancel'; reason?: string },
) {
  return (await api.patch(`/api/v1/pivot/manager/runs/${id}`, input)).data;
}
export async function createSubscription(input: {
  householdId: string;
  servicePlanId: string;
  startsAt?: string;
}) {
  return (await api.post('/api/v1/pivot/manager/subscriptions', input)).data;
}
export async function updateSubscription(
  id: string,
  input: { servicePlanId?: string; action?: 'stop'; reason?: string },
) {
  return (await api.patch(`/api/v1/pivot/manager/subscriptions/${id}`, input)).data;
}
export async function createInvoice(input: {
  subscriptionId: string;
  period: string;
  amount: number;
  dueAt: string;
}) {
  return (await api.post('/api/v1/pivot/manager/invoices', input)).data;
}
export async function updateInvoice(
  id: string,
  input: { amount?: number; dueAt?: string; action?: 'void'; reason?: string },
) {
  return (await api.patch(`/api/v1/pivot/manager/invoices/${id}`, input)).data;
}

export async function createCollector(input: {
  name: string;
  phone: string;
  employeeNo: string;
  initialPassword: string;
}) {
  return (await api.post('/api/v1/pivot/manager/collectors', input)).data;
}

export async function issueCollectorCard(input: {
  collectorId: string;
  cardNumber: string;
  uidCredential?: string;
}) {
  const { collectorId, ...body } = input;
  return (await api.post(`/api/v1/pivot/manager/collectors/${collectorId}/cards`, body)).data;
}
export async function deactivateCollectorCard(collectorId: string, cardId: string, reason: string) {
  return (
    await api.post(`/api/v1/pivot/manager/collectors/${collectorId}/cards/${cardId}/deactivate`, {
      reason,
    })
  ).data;
}

export async function fetchBusinessCatalog() {
  const response = await api.get('/api/v1/pivot/business/catalog');
  return response.data;
}

export async function fetchPlatformApplications() {
  const response = await api.get('/api/v1/platform/applications');
  return response.data;
}

export async function fetchPlatformApplication(id: string) {
  return (await api.get(`/api/v1/platform/applications/${id}`)).data;
}

export async function reviewApplication(
  id: string,
  action: 'approve' | 'request-changes' | 'reject',
  reason?: string,
) {
  const response = await api.post(`/api/v1/platform/applications/${id}/${action}`, { reason });
  return response.data;
}

export async function fetchFacilities(material?: string) {
  const response = await api.get('/api/v1/pivot/facilities', {
    params: material ? { material } : undefined,
  });
  return response.data;
}

export async function createPlatformFacility(input: {
  name: string;
  operatorName: string;
  address: string;
  lat: number;
  lng: number;
  sourceUrl: string;
  openingNote?: string;
  materials: string[];
}) {
  return (await api.post('/api/v1/platform/facilities', input)).data;
}

export async function fetchPlatformFacilities(archived = false) {
  return (await api.get('/api/v1/platform/facilities', { params: { archived } })).data;
}

export async function updatePlatformFacility(
  id: string,
  input: {
    name: string;
    operatorName: string;
    address: string;
    lat: number;
    lng: number;
    sourceUrl: string;
    openingNote?: string;
    materials: string[];
  },
) {
  return (await api.patch(`/api/v1/platform/facilities/${id}`, input)).data;
}

export async function archivePlatformFacility(id: string, reason: string, restore = false) {
  return (
    await api.post(`/api/v1/platform/facilities/${id}/${restore ? 'restore' : 'archive'}`, {
      reason,
    })
  ).data;
}

export async function verifyPlatformFacility(input: {
  id: string;
  sourceUrl: string;
  note?: string;
}) {
  const { id, ...body } = input;
  return (await api.post(`/api/v1/platform/facilities/${id}/verify`, body)).data;
}

export async function fetchMyApplication() {
  const response = await api.get('/api/v1/organization-applications/mine');
  return response.data;
}

export async function updateMyApplication(input: Record<string, unknown>) {
  const response = await api.patch('/api/v1/organization-applications/mine', input);
  return response.data;
}

export async function uploadApplicationDocument(input: {
  label: string;
  uri: string;
  name: string;
  mimeType: string;
  file?: Blob;
}) {
  const form = new FormData();
  form.append('label', input.label);
  if (Platform.OS === 'web') {
    const file = input.file ?? (await fetch(input.uri).then((response) => response.blob()));
    form.append('file', file as Blob, input.name);
  } else {
    form.append('file', {
      uri: input.uri,
      name: input.name,
      type: input.mimeType,
    } as unknown as Blob);
  }
  const response = await api.post('/api/v1/organization-applications/mine/documents', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function submitMyApplication() {
  const response = await api.post('/api/v1/organization-applications/mine/submit');
  return response.data;
}

export async function fetchPlatformOrganizations() {
  const response = await api.get('/api/v1/platform/organizations');
  return response.data;
}
export async function suspendOrganization(id: string, reason: string) {
  const response = await api.post(`/api/v1/platform/organizations/${id}/suspend`, { reason });
  return response.data;
}
export async function reactivateOrganization(id: string, reason: string) {
  const response = await api.post(`/api/v1/platform/organizations/${id}/reactivate`, { reason });
  return response.data;
}
export async function fetchPlatformModeration() {
  const response = await api.get('/api/v1/platform/moderation');
  return response.data;
}
export async function moderatePublication(
  resourceType: string,
  id: string,
  action: 'hide' | 'restore',
  reason?: string,
) {
  const response = await api.post(
    `/api/v1/platform/moderation/${resourceType}/${id}/${action}`,
    reason ? { reason } : {},
  );
  return response.data;
}
export async function fetchPlatformAudit() {
  const response = await api.get('/api/v1/platform/audit-events');
  return response.data;
}

export async function createWasteReport(input: {
  description: string;
  address: string;
  lat: number;
  lng: number;
  photoKey?: string;
}) {
  const response = await api.post('/api/v1/pivot/reports', input);
  return response.data;
}

export async function resolveWasteReport(id: string, note: string) {
  return (await api.post(`/api/v1/pivot/reports/${id}/resolve`, { note })).data;
}
export async function updateWasteReportStatus(id: string, status: string, note?: string) {
  return (await api.post(`/api/v1/pivot/reports/${id}/status`, { status, note })).data;
}
export async function updateWasteReport(
  id: string,
  input: { description: string; address: string; lat: number; lng: number; photoKey?: string },
) {
  return (await api.patch(`/api/v1/pivot/reports/${id}`, input)).data;
}
export async function withdrawWasteReport(id: string, reason: string) {
  return (await api.post(`/api/v1/pivot/reports/${id}/withdraw`, { reason })).data;
}

export async function createLot(input: {
  material: string;
  quantityKg: number;
  pricePerKg: number;
}) {
  const response = await api.post('/api/v1/pivot/manager/lots', input);
  return response.data;
}
export async function createRequirement(input: {
  title: string;
  material: string;
  quantityKg: number;
  pricePerKg?: number;
  region: string;
}) {
  const response = await api.post('/api/v1/pivot/business/requirements', input);
  return response.data;
}
export async function createOrder(input: { lotId: string; quantityKg: number }) {
  const response = await api.post('/api/v1/pivot/business/orders', input);
  return response.data;
}
export async function cancelBusinessOrder(id: string, reason: string) {
  return (await api.post(`/api/v1/pivot/business/orders/${id}/cancel`, { reason })).data;
}
export async function managerOrderAction(id: string, action: 'confirm' | 'cancel', reason: string) {
  return (await api.post(`/api/v1/pivot/manager/orders/${id}/${action}`, { reason })).data;
}
export async function receiveOrder(
  id: string,
  input: { receivedKg: number; residueKg?: number; note?: string },
) {
  const response = await api.post(`/api/v1/pivot/business/orders/${id}/receive`, input);
  return response.data;
}
export async function createWeightEvent(input: Record<string, unknown>) {
  const response = await api.post('/api/v1/pivot/weight-events', input);
  return response.data;
}
export async function createIntakeBatch(input: { batchNo?: string } = {}) {
  const response = await api.post('/api/v1/pivot/manager/intake-batches', input);
  return response.data;
}
export async function approveBatch(id: string) {
  const response = await api.post(`/api/v1/pivot/intake-batches/${id}/approve`);
  return response.data;
}

export interface CrudListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  sort?: 'asc' | 'desc';
  archived?: boolean;
}

export async function fetchManagerResource(resource: string, params: CrudListParams = {}) {
  return (await api.get(`/api/v1/manager/resources/${resource}`, { params })).data;
}
export async function createManagerResource(resource: string, data: Record<string, unknown>) {
  return (await api.post(`/api/v1/manager/resources/${resource}`, { data })).data;
}
export async function updateManagerResource(
  resource: string,
  id: string,
  data: Record<string, unknown>,
) {
  return (await api.patch(`/api/v1/manager/resources/${resource}/${id}`, { data })).data;
}
export async function archiveManagerResource(
  resource: string,
  id: string,
  reason: string,
  restore = false,
) {
  return (
    await api.post(
      `/api/v1/manager/resources/${resource}/${id}/${restore ? 'restore' : 'archive'}`,
      { reason },
    )
  ).data;
}
export async function managerResourceAction(
  resource: string,
  id: string,
  action: string,
  reason?: string,
) {
  return (await api.post(`/api/v1/manager/resources/${resource}/${id}/action`, { action, reason }))
    .data;
}
export async function fetchBusinessRequirements(params: CrudListParams = {}) {
  return (await api.get('/api/v1/business/resources/requirements', { params })).data;
}
export async function updateBusinessRequirement(id: string, data: Record<string, unknown>) {
  return (await api.patch(`/api/v1/business/resources/requirements/${id}`, { data })).data;
}
export async function businessRequirementAction(id: string, action: string, reason?: string) {
  return (
    await api.post(`/api/v1/business/resources/requirements/${id}/action`, { action, reason })
  ).data;
}
export async function fetchMaterialCategories() {
  return (await api.get('/api/v1/platform-management/material-categories')).data;
}
export async function updateMaterialCategory(code: string, data: Record<string, unknown>) {
  return (await api.patch(`/api/v1/platform-management/material-categories/${code}`, data)).data;
}
export async function archiveMaterialCategory(code: string, reason: string, restore = false) {
  return (
    await api.post(
      `/api/v1/platform-management/material-categories/${code}/${restore ? 'restore' : 'archive'}`,
      { reason },
    )
  ).data;
}
export async function fetchSupportTickets(platform = false) {
  return (await api.get(`/api/v1/platform-management/support-tickets${platform ? '' : '/mine'}`))
    .data;
}
export async function createSupportTicket(input: { subject: string; description: string }) {
  return (await api.post('/api/v1/platform-management/support-tickets', input)).data;
}
export async function updateSupportTicket(id: string, input: Record<string, unknown>) {
  return (await api.patch(`/api/v1/platform-management/support-tickets/${id}`, input)).data;
}

export async function syncQueuedDeviceEvent(event: {
  kind: string;
  payload: Record<string, unknown>;
}) {
  if (event.kind === 'CARD_TAP')
    return (await api.post('/api/v1/pivot/cards/tap', event.payload)).data;
  if (event.kind === 'WEIGHT_EVENT')
    return (await api.post('/api/v1/pivot/weight-events', event.payload)).data;
  if (event.kind === 'STOP_UPDATE') {
    const { stopId, ...payload } = event.payload;
    return (await api.patch(`/api/v1/pivot/collector/stops/${String(stopId)}`, payload)).data;
  }
  return { result: 'rejected', reason: 'Jenis event tidak didukung' };
}
