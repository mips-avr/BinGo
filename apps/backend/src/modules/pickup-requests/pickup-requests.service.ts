import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { PickupRequest } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type {
  MaterialType,
  PickupRequestDto,
  PickupStatus as PickupStatusEnum,
} from '@bingo/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { PointsService, PointsSource } from '../points/points.service';
import type { AuthenticatedUser } from '../../common/types/authenticated-request';
import type { CreatePickupDto } from './dto/create-pickup.dto';
import type { NearbyQueryDto } from './dto/nearby-query.dto';

/** Baris yang dikembalikan oleh query `nearby` (raw SQL). */
interface NearbyRow {
  id: string;
  citizen_id: string;
  agent_id: string | null;
  status: PickupStatusEnum;
  lat: number;
  lng: number;
  address: string;
  material_type: MaterialType;
  estimated_weight_kg: Prisma.Decimal;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  distance_m: number;
}

export interface PickupRequestWithDistance extends PickupRequestDto {
  distanceMeters: number;
}

@Injectable()
export class PickupRequestsService {
  private readonly logger = new Logger(PickupRequestsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly points: PointsService,
  ) {}

  // -------------------------------------------------------------------------
  // CREATE (Warga)
  // -------------------------------------------------------------------------
  async createForCitizen(citizenId: string, dto: CreatePickupDto): Promise<PickupRequestDto> {
    const created = await this.prisma.pickupRequest.create({
      data: {
        citizenId,
        lat: dto.location.lat,
        lng: dto.location.lng,
        address: dto.address,
        materialType: dto.materialType,
        estimatedWeightKg: new Prisma.Decimal(dto.estimatedWeightKg),
        notes: dto.notes ?? null,
      },
    });
    return this.toDto(created);
  }

  // -------------------------------------------------------------------------
  // LIST: milik warga sendiri / pekerjaan yang dipegang agen
  // -------------------------------------------------------------------------
  async listForCitizen(citizenId: string): Promise<PickupRequestDto[]> {
    const rows = await this.prisma.pickupRequest.findMany({
      where: { citizenId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toDto(r));
  }

  async listForAgent(agentId: string): Promise<PickupRequestDto[]> {
    const rows = await this.prisma.pickupRequest.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toDto(r));
  }

  // -------------------------------------------------------------------------
  // NEARBY (Pemulung) — query geospasial via PostGIS
  // -------------------------------------------------------------------------
  async findNearby(query: NearbyQueryDto): Promise<PickupRequestWithDistance[]> {
    const radiusKm = query.radiusKm ?? 5;
    const radiusMeters = radiusKm * 1000;

    // Gunakan ST_DWithin terhadap kolom `location` (sudah diisi otomatis oleh
    // trigger `bingo_sync_latlng_to_geom`). GIST index akan dipakai.
    // Filter hanya request berstatus PENDING agar agen melihat pekerjaan yang
    // masih tersedia.
    const rows = await this.prisma.$queryRaw<NearbyRow[]>(Prisma.sql`
      SELECT
        id,
        citizen_id,
        agent_id,
        status,
        lat,
        lng,
        address,
        material_type,
        estimated_weight_kg,
        notes,
        created_at,
        updated_at,
        ST_Distance(
          location::geography,
          ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography
        ) AS distance_m
      FROM pickup_requests
      WHERE status = 'PENDING'
        AND ST_DWithin(
          location::geography,
          ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography,
          ${radiusMeters}
        )
      ORDER BY distance_m ASC
      LIMIT 50
    `);

    return rows.map((r) => ({
      ...this.toDtoFromRow(r),
      distanceMeters: Math.round(Number(r.distance_m) * 10) / 10,
    }));
  }

  // -------------------------------------------------------------------------
  // FIND BY ID (visibility check)
  // -------------------------------------------------------------------------
  async getByIdForUser(id: string, user: AuthenticatedUser): Promise<PickupRequestDto> {
    const pickup = await this.prisma.pickupRequest.findUnique({ where: { id } });
    if (!pickup) {
      throw new NotFoundException('Permintaan penjemputan tidak ditemukan');
    }

    // Warga hanya boleh melihat miliknya; agen boleh melihat pekerjaan yang
    // sudah dia terima, atau request yang masih PENDING (calon pekerjaan).
    if (user.role === 'CITIZEN' && pickup.citizenId !== user.id) {
      throw new ForbiddenException('Anda tidak memiliki akses ke permintaan ini');
    }
    if (
      user.role === 'WASTE_AGENT' &&
      pickup.agentId !== user.id &&
      pickup.status !== 'PENDING'
    ) {
      throw new ForbiddenException('Anda tidak memiliki akses ke permintaan ini');
    }

    return this.toDto(pickup);
  }

  // -------------------------------------------------------------------------
  // ACCEPT (Pemulung)
  // -------------------------------------------------------------------------
  async accept(id: string, agentId: string): Promise<PickupRequestDto> {
    // updateMany dengan filter status memastikan operasi atomik:
    // dua agen yang mencoba menerima request yang sama tidak akan saling
    // menimpa — satu sukses, yang lain mendapat NotFound.
    const result = await this.prisma.pickupRequest.updateMany({
      where: { id, status: 'PENDING' },
      data: { agentId, status: 'ACCEPTED' },
    });
    if (result.count === 0) {
      throw new NotFoundException('Permintaan sudah diambil pemulung lain atau tidak ditemukan');
    }
    const pickup = await this.prisma.pickupRequest.findUniqueOrThrow({ where: { id } });
    this.logger.log(`Pickup ${id} diterima oleh agen ${agentId}`);
    return this.toDto(pickup);
  }

  // -------------------------------------------------------------------------
  // COMPLETE (Pemulung) — memberi poin TrashLink ke warga
  // -------------------------------------------------------------------------
  async complete(id: string, agentId: string): Promise<PickupRequestDto> {
    const pickup = await this.prisma.pickupRequest.findUnique({ where: { id } });
    if (!pickup) throw new NotFoundException('Permintaan tidak ditemukan');
    if (pickup.agentId !== agentId) {
      throw new ForbiddenException('Hanya pemulung yang menerima yang boleh menyelesaikan');
    }
    if (pickup.status === 'COMPLETED') return this.toDto(pickup);
    if (pickup.status === 'CANCELLED') {
      throw new BadRequestException('Permintaan sudah dibatalkan');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedRow = await tx.pickupRequest.update({
        where: { id },
        data: { status: 'COMPLETED' },
      });
      await this.points.award(pickup.citizenId, PointsSource.PICKUP_COMPLETED, undefined, tx);
      return updatedRow;
    });

    this.logger.log(`Pickup ${id} diselesaikan oleh agen ${agentId}`);
    return this.toDto(updated);
  }

  // -------------------------------------------------------------------------
  // CANCEL (Warga) — hanya jika belum diterima pemulung
  // -------------------------------------------------------------------------
  async cancelByCitizen(id: string, citizenId: string): Promise<PickupRequestDto> {
    const pickup = await this.prisma.pickupRequest.findUnique({ where: { id } });
    if (!pickup) throw new NotFoundException('Permintaan tidak ditemukan');
    if (pickup.citizenId !== citizenId) {
      throw new ForbiddenException('Hanya pembuat permintaan yang boleh membatalkan');
    }
    if (pickup.status !== 'PENDING') {
      throw new BadRequestException('Permintaan sudah diterima pemulung, hubungi pemulung untuk membatalkan');
    }
    const updated = await this.prisma.pickupRequest.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
    return this.toDto(updated);
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  private toDto(p: PickupRequest): PickupRequestDto {
    return {
      id: p.id,
      citizenId: p.citizenId,
      agentId: p.agentId,
      status: p.status as PickupStatusEnum,
      location: { lat: p.lat, lng: p.lng },
      address: p.address,
      materialType: p.materialType as MaterialType,
      estimatedWeightKg: Number(p.estimatedWeightKg),
      notes: p.notes,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  private toDtoFromRow(r: NearbyRow): PickupRequestDto {
    return {
      id: r.id,
      citizenId: r.citizen_id,
      agentId: r.agent_id,
      status: r.status,
      location: { lat: Number(r.lat), lng: Number(r.lng) },
      address: r.address,
      materialType: r.material_type,
      estimatedWeightKg: Number(r.estimated_weight_kg),
      notes: r.notes,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
    };
  }
}
