import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Report } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { ReportDto, ReportStatus as ReportStatusEnum } from '@bingo/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { PointsService, PointsSource } from '../points/points.service';
import type { AuthenticatedUser } from '../../common/types/authenticated-request';
import type { CreateReportDto } from './dto/create-report.dto';
import type { ListReportsQueryDto } from './dto/list-reports-query.dto';

/**
 * Ambang verifikasi: laporan otomatis berpindah dari DILAPORKAN menjadi
 * DIVERIFIKASI saat menerima `VERIFICATION_THRESHOLD` voucher verifikasi dari
 * warga lain (bukan pembuat laporan).
 */
export const VERIFICATION_THRESHOLD = 3;

interface NearbyReportRow {
  id: string;
  citizen_id: string;
  status: ReportStatusEnum;
  lat: number;
  lng: number;
  description: string | null;
  image_url: string;
  verification_count: number;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly points: PointsService,
  ) {}

  // ---------- CREATE ----------
  async create(citizenId: string, dto: CreateReportDto): Promise<ReportDto> {
    const created = await this.prisma.report.create({
      data: {
        citizenId,
        lat: dto.location.lat,
        lng: dto.location.lng,
        imageUrl: dto.imageUrl,
        description: dto.description ?? null,
      },
    });
    return this.toDto(created);
  }

  // ---------- LIST ----------
  async list(query: ListReportsQueryDto): Promise<ReportDto[]> {
    // Bila ada lat/lng, gunakan PostGIS ST_DWithin; selain itu list standar.
    if (
      typeof query.lat === 'number' &&
      typeof query.lng === 'number' &&
      typeof query.radiusKm === 'number'
    ) {
      const radius = query.radiusKm * 1000;
      const statusFilter = query.status
        ? Prisma.sql`AND status = ${Prisma.raw(`'${query.status}'`)}::"ReportStatus"`
        : Prisma.empty;

      const rows = await this.prisma.$queryRaw<NearbyReportRow[]>(Prisma.sql`
        SELECT
          id, citizen_id, status, lat, lng, description, image_url,
          verification_count, created_at, updated_at
        FROM reports
        WHERE ST_DWithin(
          location::geography,
          ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography,
          ${radius}
        )
        ${statusFilter}
        ORDER BY created_at DESC
        LIMIT 100
      `);
      return rows.map((r) => this.toDtoFromRow(r));
    }

    const rows = await this.prisma.report.findMany({
      where: query.status ? { status: query.status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((r) => this.toDto(r));
  }

  async listMine(citizenId: string): Promise<ReportDto[]> {
    const rows = await this.prisma.report.findMany({
      where: { citizenId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toDto(r));
  }

  async getById(id: string): Promise<ReportDto> {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Laporan tidak ditemukan');
    return this.toDto(report);
  }

  // ---------- VERIFY (warga selain pembuat) ----------
  async verify(id: string, user: AuthenticatedUser): Promise<ReportDto> {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Laporan tidak ditemukan');
    if (report.citizenId === user.id) {
      throw new BadRequestException('Anda tidak bisa memverifikasi laporan Anda sendiri');
    }
    if (report.status === 'SELESAI') {
      throw new BadRequestException('Laporan sudah diselesaikan');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.report.update({
        where: { id },
        data: { verificationCount: { increment: 1 } },
      });
      // Bila melewati threshold dan masih DILAPORKAN, naikkan status &
      // berikan poin TrashLink ke pembuat laporan.
      if (next.status === 'DILAPORKAN' && next.verificationCount >= VERIFICATION_THRESHOLD) {
        const verified = await tx.report.update({
          where: { id },
          data: { status: 'DIVERIFIKASI' },
        });
        await this.points.award(report.citizenId, PointsSource.REPORT_VERIFIED, undefined, tx);
        return verified;
      }
      return next;
    });

    return this.toDto(updated);
  }

  // ---------- RESOLVE (peran sama dengan pembuat / agen / admin di masa depan) ----------
  async resolve(id: string, user: AuthenticatedUser): Promise<ReportDto> {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Laporan tidak ditemukan');

    // Phase 3: hanya WASTE_AGENT yang boleh menutup laporan (mereka di
    // lapangan). Pemilik laporan boleh "merapatkan" laporannya sendiri.
    if (user.role !== 'WASTE_AGENT' && report.citizenId !== user.id) {
      throw new ForbiddenException('Tidak diizinkan menyelesaikan laporan ini');
    }
    if (report.status === 'SELESAI') return this.toDto(report);
    if (report.status !== 'DIVERIFIKASI') {
      throw new BadRequestException('Laporan harus diverifikasi terlebih dahulu');
    }

    const updated = await this.prisma.report.update({
      where: { id },
      data: { status: 'SELESAI' },
    });
    return this.toDto(updated);
  }

  // ---------- Helpers ----------
  private toDto(r: Report): ReportDto {
    return {
      id: r.id,
      citizenId: r.citizenId,
      status: r.status as ReportStatusEnum,
      location: { lat: r.lat, lng: r.lng },
      description: r.description,
      imageUrl: r.imageUrl,
      verificationCount: r.verificationCount,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }

  private toDtoFromRow(r: NearbyReportRow): ReportDto {
    return {
      id: r.id,
      citizenId: r.citizen_id,
      status: r.status,
      location: { lat: Number(r.lat), lng: Number(r.lng) },
      description: r.description,
      imageUrl: r.image_url,
      verificationCount: r.verification_count,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
    };
  }
}
