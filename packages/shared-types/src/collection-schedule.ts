import type { MaterialType } from './pickup';

/** Jenis pengelola yang menerbitkan jadwal pengangkutan rutin. */
export const CollectionSchedulePublisherType = {
  DLH: 'DLH',
  SUDIN_LH: 'SUDIN_LH',
  KELURAHAN_RT_RW: 'KELURAHAN_RT_RW',
  BANK_SAMPAH: 'BANK_SAMPAH',
  TPS3R: 'TPS3R',
  OPERATOR: 'OPERATOR',
} as const;
export type CollectionSchedulePublisherType =
  (typeof CollectionSchedulePublisherType)[keyof typeof CollectionSchedulePublisherType];

/** Bentuk layanan pada jadwal. */
export const CollectionServiceMode = {
  DOOR_TO_DOOR: 'DOOR_TO_DOOR',
  COLLECTION_POINT: 'COLLECTION_POINT',
} as const;
export type CollectionServiceMode =
  (typeof CollectionServiceMode)[keyof typeof CollectionServiceMode];

export const CollectionDay = {
  MONDAY: 'MONDAY',
  TUESDAY: 'TUESDAY',
  WEDNESDAY: 'WEDNESDAY',
  THURSDAY: 'THURSDAY',
  FRIDAY: 'FRIDAY',
  SATURDAY: 'SATURDAY',
  SUNDAY: 'SUNDAY',
} as const;
export type CollectionDay = (typeof CollectionDay)[keyof typeof CollectionDay];

/**
 * Jadwal layanan rutin yang diterbitkan pengelola wilayah.
 *
 * Ini berbeda dari PickupRequestDto: jadwal tidak dimiliki seorang warga dan
 * tidak melalui status PENDING sampai COMPLETED. Warga cukup melihat jadwal
 * yang berlaku di wilayahnya, sedangkan permintaan individual tetap dibuat
 * melalui endpoint pickup-requests.
 */
export interface CollectionScheduleDto {
  id: string;
  title: string;
  publisherName: string;
  publisherType: CollectionSchedulePublisherType;
  serviceMode: CollectionServiceMode;
  area: string;
  regionKey: string;
  materials: MaterialType[];
  days: CollectionDay[];
  startTime: string | null;
  endTime: string | null;
  scheduleNote: string | null;
  preparationNote: string | null;
  sourceUrl: string;
  verifiedAt: string;
}

export interface CollectionScheduleQuery {
  region?: string;
  material?: MaterialType;
  day?: CollectionDay;
}
