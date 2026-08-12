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
  RadarPickupDto,
} from '@bingo/shared-types';
import { HIGH_VALUE_MIN_WEIGHT_KG } from '@bingo/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { PointsService, PointsSource } from '../points/points.service';
import { AgentVerificationsService } from '../agent-verifications/agent-verifications.service';
import type { AuthenticatedUser } from '../../common/types/authenticated-request';
import type { CreatePickupDto } from './dto/create-pickup.dto';
import type { NearbyQueryDto } from './dto/nearby-query.dto';
import type { RadarQueryDto } from './dto/radar-query.dto';

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

/** Baris `radar`: baris `nearby` ditambah arah dan nama warga. */
interface RadarRow extends NearbyRow {
  bearing_deg: number | null;
  citizen_name: string;
}

export interface PickupRequestWithDistance extends PickupRequestDto {
  distanceMeters: number;
}

/**
 * Status yang boleh dilepas kembali oleh agen atau diselesaikan olehnya.
 * Dipakai sebagai penjaga pada `updateMany` supaya transisi bersifat atomik.
 */
const AGENT_HELD_STATUSES: PickupStatusEnum[] = ['ACCEPTED', 'IN_PROGRESS'];

@Injectable()
export class PickupRequestsService {
  private readonly logger = new Logger(PickupRequestsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly points: PointsService,
    private readonly verifications: AgentVerificationsService,
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
  // RADAR (Pemulung) — jarak + arah + umur permintaan
  // -------------------------------------------------------------------------
  /**
   * Versi `nearby` untuk pemulung yang sedang bergerak.
   *
   * Tambahannya dibanding `/nearby` ada tiga, dan ketiganya menjawab keputusan
   * nyata di jalan:
   *   - `bearingDegrees` — ke arah mana harus berbelok, tanpa membuka peta.
   *     Dihitung dengan ST_Azimuth pada geography, jadi arahnya arah kompas
   *     sebenarnya, bukan sudut pada bidang datar lintang/bujur.
   *   - saringan `materialType` dan `minWeightKg` — perjalanan tiga kilometer
   *     untuk satu kilogram material adalah kerugian bagi pemulung.
   *   - umur permintaan — permintaan yang sudah lama menganggur biasanya
   *     bermasalah, dan pemulung berhak tahu itu sebelum berangkat.
   *
   * `/nearby` sengaja dibiarkan apa adanya; radar bersifat menambah.
   *
   * Radar terbuka untuk semua tingkat verifikasi, termasuk Tingkat 0. Yang
   * dibedakan hanyalah urutannya: pemulung Tingkat 2 melihat permintaan
   * bernilai tinggi lebih dahulu ("prioritas radar"), karena hanya merekalah
   * yang boleh mengambilnya.
   */
  async findRadar(query: RadarQueryDto, agentId: string): Promise<RadarPickupDto[]> {
    const radiusKm = query.radiusKm ?? 5;
    const radiusMeters = radiusKm * 1000;
    const agentLevel = await this.verifications.getStoredLevel(agentId);

    const materialFilter = query.materialType
      ? Prisma.sql`AND p.material_type = CAST(${query.materialType} AS "MaterialType")`
      : Prisma.empty;
    // Nilai dikirim sebagai teks lalu di-CAST ke DECIMAL agar dibandingkan
    // dengan tipe kolomnya sendiri, tanpa singgah di floating point.
    const weightFilter =
      typeof query.minWeightKg === 'number'
        ? Prisma.sql`AND p.estimated_weight_kg >= CAST(${String(query.minWeightKg)} AS DECIMAL)`
        : Prisma.empty;

    // Prioritas radar Tingkat 2: permintaan bernilai tinggi didahulukan, lalu
    // jarak. Tingkat lain memakai klausa lama apa adanya.
    //
    // Seluruh klausa ORDER BY diganti, bukan hanya ekspresi pertamanya. Pada
    // PostgreSQL, `ORDER BY 1` bukan berarti "konstanta 1" melainkan "kolom
    // keluaran pertama" — pada kueri ini itu `p.id`, sehingga menyisipkan
    // konstanta sebagai penanda netral justru akan mengurutkan radar menurut
    // UUID dan menghapus urutan jarak sama sekali.
    const orderBy =
      agentLevel >= 2
        ? Prisma.sql`ORDER BY CASE WHEN p.estimated_weight_kg >= CAST(${String(HIGH_VALUE_MIN_WEIGHT_KG)} AS DECIMAL) THEN 0 ELSE 1 END, distance_m ASC`
        : Prisma.sql`ORDER BY distance_m ASC`;

    const rows = await this.prisma.$queryRaw<RadarRow[]>(Prisma.sql`
      SELECT
        p.id,
        p.citizen_id,
        p.agent_id,
        p.status,
        p.lat,
        p.lng,
        p.address,
        p.material_type,
        p.estimated_weight_kg,
        p.notes,
        p.created_at,
        p.updated_at,
        u.name AS citizen_name,
        ST_Distance(
          p.location::geography,
          ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography
        ) AS distance_m,
        degrees(
          ST_Azimuth(
            ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography,
            p.location::geography
          )
        ) AS bearing_deg
      FROM pickup_requests p
      JOIN users u ON u.id = p.citizen_id
      WHERE p.status = 'PENDING'
        AND ST_DWithin(
          p.location::geography,
          ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography,
          ${radiusMeters}
        )
        ${materialFilter}
        ${weightFilter}
      ${orderBy}
      LIMIT 50
    `);

    const now = Date.now();
    return rows.map((r) => {
      const ageMinutes = Math.max(0, Math.round((now - r.created_at.getTime()) / 60000));
      const dto = this.toDtoFromRow(r);
      return {
        ...dto,
        distanceMeters: Math.round(Number(r.distance_m) * 10) / 10,
        // ST_Azimuth mengembalikan NULL bila kedua titik berimpit — pemulung
        // yang berdiri persis di atas titik permintaan tidak perlu arah, dan
        // 0 (utara) adalah nilai yang aman untuk ditampilkan.
        bearingDegrees: this.normalizeBearing(r.bearing_deg),
        citizenName: r.citizen_name,
        ageMinutes,
        ageLabel: this.formatAgeLabel(ageMinutes),
        highValue: dto.estimatedWeightKg >= HIGH_VALUE_MIN_WEIGHT_KG,
      };
    });
  }

  /** Membulatkan azimuth ke derajat 0–360 dengan 0 = utara. */
  private normalizeBearing(value: number | null): number {
    if (value === null || !Number.isFinite(Number(value))) return 0;
    const degrees = Math.round(Number(value) * 10) / 10;
    // ST_Azimuth sudah menghasilkan 0..2π, tetapi pembulatan dapat mendorong
    // nilai tepat di bawah 360 menjadi 360; kembalikan ke rentang [0, 360).
    const wrapped = ((degrees % 360) + 360) % 360;
    return wrapped;
  }

  /**
   * Umur permintaan dalam bentuk kasar. Sengaja tidak presisi: menit-detik
   * yang tepat hanya memancing perlombaan merebut permintaan terbaru,
   * sedangkan yang berguna bagi pemulung cuma apakah permintaan masih segar.
   */
  private formatAgeLabel(ageMinutes: number): string {
    if (ageMinutes < 5) return 'baru saja';
    if (ageMinutes < 60) return `${ageMinutes} menit lalu`;
    const hours = Math.floor(ageMinutes / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} hari lalu`;
    const months = Math.floor(days / 30);
    return `${months} bulan lalu`;
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
    if (user.role === 'WASTE_AGENT' && pickup.agentId !== user.id && pickup.status !== 'PENDING') {
      throw new ForbiddenException('Anda tidak memiliki akses ke permintaan ini');
    }

    return this.toDto(pickup);
  }

  // -------------------------------------------------------------------------
  // ACCEPT (Pemulung)
  // -------------------------------------------------------------------------
  /**
   * Pemulung mengambil permintaan yang masih PENDING.
   *
   * Pintu Tingkat 1 dipasang di sini, bukan di controller, karena inilah
   * satu-satunya jalur menuju pekerjaan berbayar. Pemulung Tingkat 0 tetap
   * boleh membuka papan harga dan radar — memang itu maksud rancangannya:
   * informasi harga adalah alasan orang mau mendaftar, jadi ia harus tersedia
   * sebelum penjaminan, bukan sesudahnya.
   *
   * Permintaan bernilai tinggi disaring terpisah: berat besar berarti uang
   * besar berpindah tangan sekaligus, dan hanya Tingkat 2 yang boleh
   * mengambilnya. Beratnya dibaca dari baris permintaan, bukan dari klien.
   */
  async accept(id: string, agentId: string): Promise<PickupRequestDto> {
    const target = await this.prisma.pickupRequest.findUnique({
      where: { id },
      select: { estimatedWeightKg: true },
    });
    if (!target) {
      throw new NotFoundException('Permintaan sudah diambil pemulung lain atau tidak ditemukan');
    }
    await this.verifications.assertCanAcceptJobs(agentId, Number(target.estimatedWeightKg));

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
  // START (Pemulung) — ACCEPTED → IN_PROGRESS
  // -------------------------------------------------------------------------
  /**
   * Menandai bahwa pemulung sudah berangkat menuju lokasi.
   *
   * Status IN_PROGRESS sudah ada di enum dan sudah dibedakan oleh UI, tetapi
   * sebelumnya tidak ada satu pun jalur yang dapat mencapainya. Bagi warga,
   * perbedaan antara "sudah diterima" dan "pemulung sedang di jalan" adalah
   * perbedaan antara menunggu tanpa kabar dan tahu harus bersiap.
   */
  async start(id: string, agentId: string): Promise<PickupRequestDto> {
    const result = await this.prisma.pickupRequest.updateMany({
      where: { id, agentId, status: 'ACCEPTED' },
      data: { status: 'IN_PROGRESS' },
    });
    if (result.count === 0) {
      await this.explainFailedTransition(id, agentId, 'ACCEPTED');
    }
    const pickup = await this.prisma.pickupRequest.findUniqueOrThrow({ where: { id } });
    this.logger.log(`Pickup ${id} mulai dikerjakan oleh agen ${agentId}`);
    return this.toDto(pickup);
  }

  // -------------------------------------------------------------------------
  // RELEASE (Pemulung) — mengembalikan pekerjaan ke antrean
  // -------------------------------------------------------------------------
  /**
   * Melepas pekerjaan yang sudah diterima kembali menjadi PENDING.
   *
   * Tanpa ini, satu ketukan yang salah mengunci permintaan warga selamanya:
   * agen tidak dapat mengerjakannya, agen lain tidak dapat melihatnya karena
   * statusnya bukan PENDING, dan warga tidak dapat membatalkannya karena
   * pembatalan hanya boleh saat masih PENDING. Warga kehilangan permintaannya
   * gara-gara kesalahan orang lain.
   *
   * `agentId` dikosongkan agar permintaan benar-benar kembali ke antrean dan
   * dapat diambil siapa pun, bukan sekadar berubah status.
   */
  async release(id: string, agentId: string): Promise<PickupRequestDto> {
    const result = await this.prisma.pickupRequest.updateMany({
      where: { id, agentId, status: { in: AGENT_HELD_STATUSES } },
      data: { status: 'PENDING', agentId: null },
    });
    if (result.count === 0) {
      await this.explainFailedTransition(id, agentId, 'ACCEPTED atau IN_PROGRESS');
    }
    const pickup = await this.prisma.pickupRequest.findUniqueOrThrow({ where: { id } });
    this.logger.log(`Pickup ${id} dilepas kembali ke antrean oleh agen ${agentId}`);
    return this.toDto(pickup);
  }

  // -------------------------------------------------------------------------
  // COMPLETE (Pemulung) — memberi poin TrashLink ke warga
  // -------------------------------------------------------------------------
  /**
   * Menyelesaikan penjemputan dan memberi poin TrashLink kepada warga.
   *
   * Pemeriksaan awal di bawah hanya untuk menghasilkan pesan galat yang jelas.
   * Yang menentukan adalah `updateMany` dengan penjaga status di dalam
   * transaksi: ia mengubah baris hanya bila statusnya masih salah satu status
   * yang dipegang agen, dan mengembalikan `count` berapa baris yang benar-benar
   * berubah. Poin hanya diberikan bila `count === 1`.
   *
   * Ini penting karena versi sebelumnya membaca status di luar transaksi lalu
   * memperbarui tanpa syarat: dua permintaan `complete` yang tiba berbarengan
   * sama-sama membaca status ACCEPTED, sama-sama menulis COMPLETED, dan warga
   * menerima 50 poin untuk satu penjemputan. Dengan penjaga ini, permintaan
   * kedua mendapat `count === 0` dan tidak memberi poin apa pun.
   */
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
      const guard = await tx.pickupRequest.updateMany({
        where: { id, agentId, status: { in: AGENT_HELD_STATUSES } },
        data: { status: 'COMPLETED' },
      });
      // count === 0 berarti permintaan berbarengan sudah menyelesaikannya
      // lebih dulu. Jangan beri poin dua kali.
      if (guard.count !== 1) return null;

      await this.points.award(pickup.citizenId, PointsSource.PICKUP_COMPLETED, undefined, tx);
      return tx.pickupRequest.findUniqueOrThrow({ where: { id } });
    });

    if (!updated) {
      // Kalah balapan: kembalikan keadaan terkini apa adanya. Ini bukan galat
      // bagi pemanggil — pekerjaannya memang sudah selesai.
      const current = await this.prisma.pickupRequest.findUniqueOrThrow({ where: { id } });
      return this.toDto(current);
    }

    this.logger.log(`Pickup ${id} diselesaikan oleh agen ${agentId}`);
    return this.toDto(updated);
  }

  /**
   * Menerjemahkan `updateMany` yang tidak mengubah baris apa pun menjadi galat
   * yang menjelaskan sebabnya. Selalu melempar.
   */
  private async explainFailedTransition(
    id: string,
    agentId: string,
    expectedStatus: string,
  ): Promise<never> {
    const pickup = await this.prisma.pickupRequest.findUnique({ where: { id } });
    if (!pickup) throw new NotFoundException('Permintaan tidak ditemukan');
    if (pickup.agentId !== agentId) {
      throw new ForbiddenException('Permintaan ini tidak sedang Anda pegang');
    }
    throw new BadRequestException(
      `Permintaan berstatus ${pickup.status}, sedangkan operasi ini memerlukan status ${expectedStatus}`,
    );
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
      throw new BadRequestException(
        'Permintaan sudah diterima pemulung, hubungi pemulung untuk membatalkan',
      );
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
