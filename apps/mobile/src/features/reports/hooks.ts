import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateReportRequest, ReportStatus } from '@bingo/shared-types';
import { queryKeys } from '../../lib/query/client';
import {
  createReport,
  getReport,
  listMyReports,
  listReports,
  verifyReport,
} from './api';

export function useReportsFeed(status?: ReportStatus) {
  return useQuery({
    queryKey: queryKeys.reports.all(status),
    queryFn: () => listReports({ status }),
  });
}

export function useMyReports() {
  return useQuery({ queryKey: queryKeys.reports.mine, queryFn: listMyReports });
}

export function useReport(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.reports.detail(id) : ['reports', 'detail', 'noop'],
    queryFn: () => getReport(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReportRequest) => createReport(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.reports.mine });
      qc.invalidateQueries({ queryKey: ['reports', 'all'] });
    },
  });
}

export function useVerifyReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => verifyReport(id),
    onSuccess: (report) => {
      qc.invalidateQueries({ queryKey: queryKeys.reports.detail(report.id) });
      qc.invalidateQueries({ queryKey: ['reports', 'all'] });
      qc.invalidateQueries({ queryKey: queryKeys.me });
    },
  });
}
