import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { AgentVerification, AgentVerificationEvent } from '@prisma/client';
import type {
  AgentVerificationCriteriaDto,
  AgentVerificationDto,
  AgentVerificationStatusDto,
  AttestorType,
  VerificationLevel,
} from '@bingo/shared-types';
import {
  AgentVerificationAction,
  AgentVerificationStatus,
  DISPUTELESS_TRANSACTIONS_REQUIRED,
  HIGH_VALUE_MIN_WEIGHT_KG,
  PEER_ENDORSEMENTS_REQUIRED,
  deriveVerificationLevel,
} from '@bingo/shared-types';
import { normalizePhoneID } from '@bingo/shared-utils';
import { PrismaService } from '../../prisma/prisma.service';
import type { DecideAttestationDto } from './dto/decide-attestation.dto';
import type { EndorseAgentDto } from './dto/endorse-agent.dto';
import type { RequestAttestationDto } from './dto/request-attestation.dto';

type VerificationWithEvents = AgentVerification & { events: AgentVerificationEvent[] };

/**
 * Hasil perhitungan tingkat, lengkap dengan angka yang mendasarinya.
 *
 * Angka ikut dikembalikan supaya layar pemulung dapat menampilkan "kurang 3
 * transaksi lagi" alih-alih sekadar "belum memenuhi syarat". Penolakan tanpa
 * penjelasan adalah cara tercepat membuat orang meninggalkan aplikasi.
 */
export interface ComputedLevel {
  level: VerificationLevel;
  approvedCount: number;
  distinctInstitutionCount: number;
  disputelessTransactionCount: number;
  peerEndorsementCount: number;
  criteria: AgentVerificationCriteriaDto;
  criteriaMetCount: number;
}

/**
 * Verifikasi berjenjang pemulung.
 *
 * Menggantikan verifikasi identitas berbasis NIK, yang tidak dapat ditepati:
 * pencocokan NIK ke sumber resmi memerlukan perjanjian kerja sama dengan
 * Ditjen Dukcapil (Permendagri 102/2019). Yang dapat ditepati adalah meminta
 * pihak yang benar-benar mengenal pemulung di lapangan untuk menjaminnya.
 *
 * Tiga tingkat:
 *   0 Terdaftar     — nama panggilan + nomor telepon, tanpa dokumen. Boleh
 *                     melihat papan harga dan peta permintaan, tidak boleh
 *                     menerima pekerjaan.
 *   1 Dijamin Mitra — satu penjaminan disetujui. Boleh menerima penjemputan dan
 *                     menerbitkan bukti timbang.
 *   2 Dijamin Ganda — dua dari tiga syarat tambahan. Boleh mengambil pekerjaan
 *                     bernilai tinggi dan mendapat prioritas radar.
 */
@Injectable()
export class AgentVerificationsService {
  private readonly logger = new Logger(AgentVerificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------------------------
  // Penegakan
  // -------------------------------------------------------------------------
  /**
   * Menjaga pintu Tingkat 1: menerima penjemputan dan menerbitkan bukti timbang.
   *
   * Tingkat dibaca dari basis data, bukan dari klaim di dalam token. Token JWT
   * berumur tujuh hari; bila tingkat dibaca dari sana, pencabutan penjaminan
   * baru berlaku sepekan kemudian — tepat pada rentang waktu ketika pencabutan
   * itu paling dibutuhkan.
   */
  async assertCanAcceptJobs(agentId: string, estimatedWeightKg?: number): Promise<void> {
    const level = await this.getStoredLevel(agentId);
    if (level < 1) {
      throw new ForbiddenException(
        'Akun Anda masih Tingkat 0 (Terdaftar). Untuk menerima penjemputan, mintalah satu ' +
          'penjaminan dari mitra terdaftar — bank sampah, lapak, TPS3R, KSM persampahan, atau ' +
          'RT/RW tempat Anda bekerja. Papan harga dan peta permintaan tetap dapat Anda buka.',
      );
    }
    if (
      typeof estimatedWeightKg === 'number' &&
      estimatedWeightKg >= HIGH_VALUE_MIN_WEIGHT_KG &&
      level < 2
    ) {
      throw new ForbiddenException(
        `Permintaan ${estimatedWeightKg} kg tergolong bernilai tinggi dan hanya dapat diambil ` +
          `pemulung Tingkat 2 (Dijamin Ganda). Penuhi dua dari tiga syarat: penjaminan kedua ` +
          `dari lembaga berbeda, ${DISPUTELESS_TRANSACTIONS_REQUIRED} transaksi nirsengketa, ` +
          `atau rekomendasi ${PEER_ENDORSEMENTS_REQUIRED} pemulung Tingkat 2.`,
      );
    }
  }

  /** Menjaga pintu penerbitan bukti timbang (juga Tingkat 1). */
  async assertCanIssueReceipt(agentId: string): Promise<void> {
    const level = await this.getStoredLevel(agentId);
    if (level < 1) {
      throw new ForbiddenException(
        'Akun Anda masih Tingkat 0 (Terdaftar) sehingga belum dapat menerbitkan bukti timbang. ' +
          'Bukti timbang adalah dokumen yang dipegang warga sebagai pegangan harga, jadi ' +
          'penerbitnya harus sudah dijamin oleh mitra terdaftar.',
      );
    }
  }

  /** Tingkat tersimpan; 0 bila pengguna tidak ditemukan. */
  async getStoredLevel(agentId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: agentId },
      select: { verificationLevel: true },
    });
    return user?.verificationLevel ?? 0;
  }

  // -------------------------------------------------------------------------
  // Pengajuan penjaminan
  // -------------------------------------------------------------------------
  /**
   * Pemulung mengajukan penjaminan kepada satu mitra terdaftar.
   *
   * Yang mengajukan adalah pemulung, tetapi yang memutuskan adalah mitra —
   * itulah inti "verifikasi berjenjang". Pengajuan sendiri tidak menaikkan
   * tingkat apa pun.
   */
  async requestAttestation(
    agentId: string,
    dto: RequestAttestationDto,
  ): Promise<AgentVerificationDto> {
    const attestorPhone = normalizePhoneID(dto.attestorPhone);
    if (!attestorPhone) {
      throw new BadRequestException('Nomor telepon mitra tidak valid');
    }

    const attestor = await this.prisma.user.findUnique({ where: { phone: attestorPhone } });
    if (!attestor) {
      throw new NotFoundException('Mitra dengan nomor telepon tersebut belum terdaftar di BinGo');
    }
    if (attestor.id === agentId) {
      throw new BadRequestException('Anda tidak dapat menjamin diri sendiri');
    }
    if (!attestor.partnerType || !attestor.partnerName) {
      throw new BadRequestException(
        'Akun tersebut bukan operator mitra terdaftar, sehingga tidak dapat memberi penjaminan. ' +
          'Penjamin harus berupa bank sampah, lapak, TPS3R, KSM persampahan, atau RT/RW yang ' +
          'sudah terdaftar sebagai mitra BinGo.',
      );
    }

    const attestorKey = normalizeInstitutionKey(attestor.partnerName);
    const existing = await this.prisma.agentVerification.findUnique({
      where: { agentId_attestorKey: { agentId, attestorKey } },
    });
    if (existing) {
      throw new BadRequestException(
        `Anda sudah pernah mengajukan penjaminan ke ${attestor.partnerName} ` +
          `(status: ${existing.status}). Satu lembaga hanya dapat menjamin satu kali.`,
      );
    }

    const created = await this.prisma.agentVerification.create({
      data: {
        agentId,
        attestorId: attestor.id,
        attestorType: attestor.partnerType,
        attestorName: attestor.partnerName,
        attestorPhone: attestor.phone,
        attestorKey,
        status: AgentVerificationStatus.MENUNGGU,
        note: dto.note ?? null,
        events: {
          create: {
            action: AgentVerificationAction.DIAJUKAN,
            actorId: agentId,
            note: dto.note ?? null,
          },
        },
      },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });

    this.logger.log(`Penjaminan diajukan: agen ${agentId} → mitra ${attestor.partnerName}`);
    return toVerificationDto(created);
  }

  /**
   * Mitra menjawab pengajuan: menyetujui, menolak, atau mencabut yang sudah
   * pernah disetujui. Setiap langkah menulis satu baris jejak audit.
   */
  async decide(
    verificationId: string,
    attestorId: string,
    dto: DecideAttestationDto,
  ): Promise<AgentVerificationDto> {
    const verification = await this.prisma.agentVerification.findUnique({
      where: { id: verificationId },
    });
    if (!verification) throw new NotFoundException('Pengajuan penjaminan tidak ditemukan');
    if (verification.attestorId !== attestorId) {
      throw new ForbiddenException('Hanya mitra yang dimintai penjaminan yang boleh menjawabnya');
    }

    this.assertTransitionAllowed(verification.status, dto.status);

    const action =
      dto.status === AgentVerificationStatus.DISETUJUI
        ? AgentVerificationAction.DISETUJUI
        : dto.status === AgentVerificationStatus.DITOLAK
          ? AgentVerificationAction.DITOLAK
          : AgentVerificationAction.DICABUT;

    const updated = await this.prisma.agentVerification.update({
      where: { id: verificationId },
      data: {
        status: dto.status,
        decidedAt: new Date(),
        note: dto.note ?? verification.note,
        events: { create: { action, actorId: attestorId, note: dto.note ?? null } },
      },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });

    // Tingkat dihitung ulang setelah setiap keputusan, termasuk pencabutan:
    // penjaminan yang ditarik harus segera menurunkan tingkat, bukan menunggu
    // pemulung membuka layarnya.
    await this.recomputeLevel(verification.agentId);

    this.logger.log(
      `Penjaminan ${verificationId} → ${dto.status} oleh mitra ${attestorId} ` +
        `untuk agen ${verification.agentId}`,
    );
    return toVerificationDto(updated);
  }

  /**
   * Transisi status yang diperbolehkan.
   *
   * MENUNGGU boleh menjadi DISETUJUI atau DITOLAK. DISETUJUI boleh dicabut.
   * Yang sudah DITOLAK atau DICABUT bersifat akhir — mengizinkan pengaktifan
   * ulang berarti satu baris yang sama dapat berpindah-pindah status tanpa
   * pengajuan baru, dan jejak auditnya menjadi sulit dibaca.
   */
  private assertTransitionAllowed(
    current: string,
    next: (typeof AgentVerificationStatus)[keyof typeof AgentVerificationStatus],
  ): void {
    const allowed: Record<string, string[]> = {
      [AgentVerificationStatus.MENUNGGU]: [
        AgentVerificationStatus.DISETUJUI,
        AgentVerificationStatus.DITOLAK,
      ],
      [AgentVerificationStatus.DISETUJUI]: [AgentVerificationStatus.DICABUT],
      [AgentVerificationStatus.DITOLAK]: [],
      [AgentVerificationStatus.DICABUT]: [],
    };
    if (!allowed[current]?.includes(next)) {
      throw new BadRequestException(
        `Penjaminan berstatus ${current} tidak dapat diubah menjadi ${next}`,
      );
    }
  }

  /** Pengajuan yang ditujukan kepada akun mitra ini. */
  async listInbox(attestorId: string): Promise<AgentVerificationDto[]> {
    const rows = await this.prisma.agentVerification.findMany({
      where: { attestorId },
      include: { events: { orderBy: { createdAt: 'asc' } } },
      orderBy: [{ status: 'asc' }, { requestedAt: 'desc' }],
      take: 100,
    });
    return rows.map(toVerificationDto);
  }

  // -------------------------------------------------------------------------
  // Rekomendasi sesama pemulung
  // -------------------------------------------------------------------------
  /**
   * Syarat ketiga Tingkat 2. Hanya pemulung Tingkat 2 yang boleh
   * merekomendasikan — kalau tidak, dua akun baru cukup saling merekomendasikan
   * untuk memenuhi satu syarat tanpa pernah bertemu mitra mana pun.
   */
  async endorse(endorserId: string, dto: EndorseAgentDto): Promise<{ endorsementCount: number }> {
    const endorserLevel = await this.getStoredLevel(endorserId);
    if (endorserLevel < 2) {
      throw new ForbiddenException(
        'Hanya pemulung Tingkat 2 (Dijamin Ganda) yang dapat merekomendasikan pemulung lain',
      );
    }

    const agentPhone = normalizePhoneID(dto.agentPhone);
    if (!agentPhone) throw new BadRequestException('Nomor telepon pemulung tidak valid');

    const agent = await this.prisma.user.findUnique({ where: { phone: agentPhone } });
    if (!agent)
      throw new NotFoundException('Pemulung dengan nomor telepon tersebut tidak ditemukan');
    if (agent.id === endorserId) {
      throw new BadRequestException('Anda tidak dapat merekomendasikan diri sendiri');
    }
    if (agent.role !== 'WASTE_AGENT') {
      throw new BadRequestException('Rekomendasi hanya berlaku untuk akun pemulung');
    }

    await this.prisma.agentEndorsement.upsert({
      where: { agentId_endorserId: { agentId: agent.id, endorserId } },
      create: { agentId: agent.id, endorserId, note: dto.note ?? null },
      update: { note: dto.note ?? null },
    });

    const computed = await this.recomputeLevel(agent.id);
    return { endorsementCount: computed.peerEndorsementCount };
  }

  // -------------------------------------------------------------------------
  // Perhitungan tingkat
  // -------------------------------------------------------------------------
  /** Ringkasan lengkap untuk layar pemulung. */
  async getStatusFor(agentId: string): Promise<AgentVerificationStatusDto> {
    const computed = await this.computeLevel(agentId);
    const verifications = await this.prisma.agentVerification.findMany({
      where: { agentId },
      include: { events: { orderBy: { createdAt: 'asc' } } },
      orderBy: { requestedAt: 'desc' },
    });

    return {
      agentId,
      level: computed.level,
      approvedCount: computed.approvedCount,
      distinctInstitutionCount: computed.distinctInstitutionCount,
      disputelessTransactionCount: computed.disputelessTransactionCount,
      peerEndorsementCount: computed.peerEndorsementCount,
      criteria: computed.criteria,
      criteriaMetCount: computed.criteriaMetCount,
      canAcceptJobs: computed.level >= 1,
      canIssueReceipts: computed.level >= 1,
      canTakeHighValueJobs: computed.level >= 2,
      verifications: verifications.map(toVerificationDto),
    };
  }

  /**
   * Menghitung ulang tingkat dan menyimpannya di `users.verification_level`.
   *
   * Disimpan, bukan dihitung ulang setiap kali dibaca, karena penjaga Tingkat 1
   * berjalan pada setiap penerimaan pekerjaan dan setiap penerbitan bukti
   * timbang; empat kueri agregat per permintaan bukan harga yang pantas dibayar
   * untuk nilai yang berubah beberapa kali setahun.
   *
   * Perubahan tingkat MERAMBAT ke pemulung yang pernah direkomendasikan orang
   * ini. Syarat ketiga menghitung rekomendasi dari pemulung yang sudah
   * Tingkat 2, jadi saat seseorang baru mencapai Tingkat 2, rekomendasi yang
   * pernah ia berikan berubah nilainya. Tanpa rambatan ini, penerima
   * rekomendasi baru naik tingkat pada kejadian lain yang kebetulan memicu
   * perhitungan — bisa berbulan-bulan kemudian.
   *
   * `visited` memutus rekomendasi berbalas (A merekomendasikan B, B
   * merekomendasikan A) yang tanpanya membuat rambatan ini berputar selamanya.
   */
  async recomputeLevel(agentId: string, visited: Set<string> = new Set()): Promise<ComputedLevel> {
    const computed = await this.computeLevel(agentId);
    visited.add(agentId);

    // `updateMany` bersyarat sekaligus memberi tahu apakah nilainya berubah:
    // count === 1 berarti berubah, tanpa perlu membaca nilai lama lebih dulu.
    const changed = await this.prisma.user.updateMany({
      where: { id: agentId, verificationLevel: { not: computed.level } },
      data: { verificationLevel: computed.level },
    });
    if (changed.count === 0) return computed;

    const dependents = await this.prisma.agentEndorsement.findMany({
      where: { endorserId: agentId },
      select: { agentId: true },
    });
    for (const d of dependents) {
      if (!visited.has(d.agentId)) await this.recomputeLevel(d.agentId, visited);
    }
    return computed;
  }

  /**
   * Mengumpulkan angka yang menjadi dasar penjenjangan, lalu menyerahkan
   * aturannya ke `deriveVerificationLevel()` di @bingo/shared-types. Aturan
   * sengaja tidak ditulis ulang di sini: seed dan aplikasi mobile memakai
   * fungsi yang sama, dan tiga salinan aturan akan berbeda pada perubahan
   * pertama.
   *
   * Yang dihitung:
   *   a. lembaga penjamin BERBEDA di antara penjaminan DISETUJUI — dihitung
   *      dari `attestor_key` yang berbeda, bukan dari jumlah baris;
   *   b. bukti timbang terlacak yang diterbitkan pemulung ini dan tidak
   *      dipersoalkan penyetornya;
   *   c. rekomendasi dari pemulung yang sendirinya sudah Tingkat 2.
   */
  private async computeLevel(agentId: string): Promise<ComputedLevel> {
    const [approved, disputelessTransactionCount, peerEndorsementCount] = await Promise.all([
      this.prisma.agentVerification.findMany({
        where: { agentId, status: AgentVerificationStatus.DISETUJUI },
        select: { attestorKey: true },
      }),
      // Hanya bukti yang terikat permintaan penjemputan (`walkIn: false`) yang
      // dihitung. Setoran langsung tidak dapat ditelusuri ke serah terima mana
      // pun, jadi ia tidak boleh menjadi bukti rekam jejak — persis alasan yang
      // sama mengapa ia dikeluarkan dari papan harga.
      this.prisma.weighingReceipt.count({
        where: { issuedById: agentId, walkIn: false, disputedAt: null },
      }),
      this.prisma.agentEndorsement.count({
        where: { agentId, endorser: { verificationLevel: { gte: 2 } } },
      }),
    ]);

    const distinctInstitutionCount = new Set(approved.map((a) => a.attestorKey)).size;
    const derived = deriveVerificationLevel({
      distinctInstitutionCount,
      disputelessTransactionCount,
      peerEndorsementCount,
    });

    return {
      level: derived.level,
      approvedCount: approved.length,
      distinctInstitutionCount,
      disputelessTransactionCount,
      peerEndorsementCount,
      criteria: derived.criteria,
      criteriaMetCount: derived.criteriaMetCount,
    };
  }
}

/**
 * Kunci identitas lembaga penjamin.
 *
 * Sengaja tidak memakai `normalizeRegionKey`: fungsi itu membuang kata tingkat
 * administrasi ("kota", "desa"), yang benar untuk wilayah tetapi salah untuk
 * nama lembaga — "Bank Sampah Kota Hijau" dan "Bank Sampah Hijau" adalah dua
 * lembaga berbeda.
 */
export function normalizeInstitutionKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Pemetaan entitas Prisma → DTO publik. */
function toVerificationDto(row: VerificationWithEvents): AgentVerificationDto {
  return {
    id: row.id,
    agentId: row.agentId,
    attestorId: row.attestorId,
    attestorType: row.attestorType as AttestorType,
    attestorName: row.attestorName,
    attestorPhone: row.attestorPhone,
    status: row.status as AgentVerificationDto['status'],
    requestedAt: row.requestedAt.toISOString(),
    decidedAt: row.decidedAt?.toISOString() ?? null,
    note: row.note,
    events: row.events.map((e) => ({
      action: e.action as AgentVerificationDto['events'][number]['action'],
      actorId: e.actorId,
      note: e.note,
      createdAt: e.createdAt.toISOString(),
    })),
  };
}
