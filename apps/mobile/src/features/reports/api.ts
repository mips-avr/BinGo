import type { CreateReportRequest, ReportDto, ReportStatus } from '@bingo/shared-types';
import { api } from '../../lib/api/client';
import { ENDPOINTS } from '../../lib/api/endpoints';

export interface ListReportsParams {
  status?: ReportStatus;
  lat?: number;
  lng?: number;
  radiusKm?: number;
}

export async function listReports(params: ListReportsParams = {}): Promise<ReportDto[]> {
  const { data } = await api.get<ReportDto[]>(ENDPOINTS.reports.root, { params });
  return data;
}

export async function listMyReports(): Promise<ReportDto[]> {
  const { data } = await api.get<ReportDto[]>(ENDPOINTS.reports.mine);
  return data;
}

export async function getReport(id: string): Promise<ReportDto> {
  const { data } = await api.get<ReportDto>(ENDPOINTS.reports.byId(id));
  return data;
}

export async function createReport(body: CreateReportRequest): Promise<ReportDto> {
  const { data } = await api.post<ReportDto>(ENDPOINTS.reports.root, body);
  return data;
}

export async function verifyReport(id: string): Promise<ReportDto> {
  const { data } = await api.patch<ReportDto>(ENDPOINTS.reports.verify(id));
  return data;
}

export async function resolveReport(id: string): Promise<ReportDto> {
  const { data } = await api.patch<ReportDto>(ENDPOINTS.reports.resolve(id));
  return data;
}
