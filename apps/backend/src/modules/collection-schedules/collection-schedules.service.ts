import { Injectable } from '@nestjs/common';
import type { CollectionSchedule } from '@prisma/client';

import {
  normalizeRegionKey,
  type CollectionDay,
  type CollectionScheduleDto,
  type CollectionSchedulePublisherType,
  type CollectionServiceMode,
  type MaterialType,
} from '@bingo/shared-types';

import { PrismaService } from '../../prisma/prisma.service';
import type { CollectionScheduleQueryDto } from './dto/collection-schedule-query.dto';

@Injectable()
export class CollectionSchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: CollectionScheduleQueryDto): Promise<CollectionScheduleDto[]> {
    const regionKey = normalizeRegionKey(query.region ?? '');
    const rows = await this.prisma.collectionSchedule.findMany({
      where: {
        active: true,
        ...(regionKey ? { regionKey: { contains: regionKey } } : {}),
        ...(query.material ? { materials: { has: query.material } } : {}),
        ...(query.day ? { days: { has: query.day } } : {}),
      },
      orderBy: [{ area: 'asc' }, { title: 'asc' }],
      take: 100,
    });

    return rows.map((row) => this.toDto(row));
  }

  private toDto(row: CollectionSchedule): CollectionScheduleDto {
    return {
      id: row.id,
      title: row.title,
      publisherName: row.publisherName,
      publisherType: row.publisherType as CollectionSchedulePublisherType,
      serviceMode: row.serviceMode as CollectionServiceMode,
      area: row.area,
      regionKey: row.regionKey,
      materials: row.materials as MaterialType[],
      days: row.days as CollectionDay[],
      startTime: row.startTime,
      endTime: row.endTime,
      scheduleNote: row.scheduleNote,
      preparationNote: row.preparationNote,
      sourceUrl: row.sourceUrl,
      verifiedAt: row.verifiedAt.toISOString(),
    };
  }
}
