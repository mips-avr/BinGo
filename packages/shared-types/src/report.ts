import type { LatLng } from './common';

/** Status laporan pembuangan sampah ilegal (TrashReport). */
export const ReportStatus = {
  DILAPORKAN: 'DILAPORKAN',
  DIVERIFIKASI: 'DIVERIFIKASI',
  SELESAI: 'SELESAI',
} as const;
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

export interface CreateReportRequest {
  location: LatLng;
  description?: string;
  imageUrl: string;
}

export interface ReportDto {
  id: string;
  citizenId: string;
  status: ReportStatus;
  location: LatLng;
  description: string | null;
  imageUrl: string;
  verificationCount: number;
  createdAt: string;
  updatedAt: string;
}
