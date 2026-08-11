import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  DEFAULT_DROP_POINT_RADIUS_KM,
  type DropPointDto,
  type DropPointOperator,
  type DropPointReward,
  type MaterialType,
  normalizeRegionKey,
} from '@bingo/shared-types';

import { PrismaService } from '../../prisma/prisma.service';
import type { NearbyDropPointQueryDto } from './dto/nearby-drop-point-query.dto';

interface DropPointRow {
  id: string;
  name: string;
  operator: DropPointOperator;
  operator_name: string | null;
  address: string;
  lat: number;
  lng: number;
  accepted_materials: MaterialType[];
  reward: DropPointReward;
  min_weight_kg: Prisma.Decimal | null;
  opening_note: string | null;
  external_url: string | null;
  source_url: string;
  verified_at: Date;
  note: string | null;
  region: string;
  region_key: string;
  distance_m: number | null;
}

/**
 * Direktori titik setor.
 *
 * Perlu dinyatakan terus terang, karena mudah disalahpahami sebagai klaim yang
 * lebih besar daripada kenyataannya: ini adalah data statis hasil kurasi
 * manual dari sumber publik. Tidak ada API pihak ketiga di baliknya, karena
 * tidak satu pun operator persampahan di Indonesia — swasta maupun pemerintah —
 * membuka API publik. Karena itu tidak ada ketersediaan waktu-nyata, tidak ada
 * kapasitas, dan tidak ada status buka/tutup langsung.
 *
 * Yang bisa dijanjikan hanyalah kejujuran soal umur data: setiap baris membawa
 * `source_url` dan `verified_at`, dan keduanya ikut dikirim ke klien supaya
 * dapat ditampilkan — termasuk ketika sudah lama dan justru harus terlihat
 * bahwa ia sudah lama.
 */
@Injectable()
export class DropPointsService {
  private readonly logger = new Logger(DropPointsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findNearby(query: NearbyDropPointQueryDto): Promise<DropPointDto[]> {
    const radiusMeters = (query.radiusKm ?? DEFAULT_DROP_POINT_RADIUS_KM) * 1000;

    // Penyaring material memakai operator penampung array Postgres (`&&`),
    // bukan `= ANY`, supaya "titik ini menerima salah satu dari material yang
    // saya bawa" tetap satu ekspresi ketika daftar materialnya diperluas.
    const materialFilter = query.material
      ? Prisma.sql`AND accepted_materials && ARRAY[${Prisma.raw(`'${query.material}'`)}]::"MaterialType"[]`
      : Prisma.empty;

    const rows = await this.prisma.$queryRaw<DropPointRow[]>(Prisma.sql`
      SELECT
        id, name, operator, operator_name, address, lat, lng,
        accepted_materials, reward, min_weight_kg, opening_note,
        external_url, source_url, verified_at, note, region, region_key,
        ST_Distance(
          location::geography,
          ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography
        ) AS distance_m
      FROM drop_points
      WHERE active = true
        AND ST_DWithin(
          location::geography,
          ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography,
          ${radiusMeters}
        )
        ${materialFilter}
      ORDER BY distance_m ASC
      LIMIT 50
    `);

    return rows.map((r) => this.toDto(r));
  }

  async listByRegion(region: string, material?: MaterialType): Promise<DropPointDto[]> {
    const regionKey = normalizeRegionKey(region);
    if (!regionKey) return [];

    const rows = await this.prisma.dropPoint.findMany({
      where: {
        active: true,
        regionKey: { contains: regionKey },
        ...(material ? { acceptedMaterials: { has: material } } : {}),
      },
      orderBy: [{ operator: 'asc' }, { name: 'asc' }],
      take: 50,
    });

    return rows.map((r) =>
      this.toDto({
        ...r,
        operator_name: r.operatorName,
        accepted_materials: r.acceptedMaterials as MaterialType[],
        min_weight_kg: r.minWeightKg,
        opening_note: r.openingNote,
        external_url: r.externalUrl,
        source_url: r.sourceUrl,
        verified_at: r.verifiedAt,
        region_key: r.regionKey,
        operator: r.operator as DropPointOperator,
        reward: r.reward as DropPointReward,
        distance_m: null,
      }),
    );
  }

  private toDto(r: DropPointRow): DropPointDto {
    return {
      id: r.id,
      name: r.name,
      operator: r.operator,
      operatorName: r.operator_name,
      address: r.address,
      lat: Number(r.lat),
      lng: Number(r.lng),
      distanceMeters: r.distance_m == null ? null : Math.round(Number(r.distance_m)),
      acceptedMaterials: r.accepted_materials,
      reward: r.reward,
      minWeightKg: r.min_weight_kg == null ? null : Number(r.min_weight_kg),
      openingNote: r.opening_note,
      externalUrl: r.external_url,
      sourceUrl: r.source_url,
      verifiedAt: r.verified_at.toISOString(),
      note: r.note,
      region: r.region,
      regionKey: r.region_key,
    };
  }
}
