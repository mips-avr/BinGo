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

export async function fetchBusinessCatalog() {
  const response = await api.get('/api/v1/pivot/business/catalog');
  return response.data;
}

export async function fetchPlatformApplications() {
  const response = await api.get('/api/v1/platform/applications');
  return response.data;
}

export async function reviewApplication(
  id: string,
  action: 'approve' | 'request-changes' | 'reject',
  reason?: string,
) {
  const response = await api.post(
    `/api/v1/platform/applications/${id}/${action}`,
    reason ? { reason } : {},
  );
  return response.data;
}

export async function fetchFacilities(material?: string) {
  const response = await api.get('/api/v1/pivot/facilities', {
    params: material ? { material } : undefined,
  });
  return response.data;
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
export async function reactivateOrganization(id: string) {
  const response = await api.post(`/api/v1/platform/organizations/${id}/reactivate`);
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
