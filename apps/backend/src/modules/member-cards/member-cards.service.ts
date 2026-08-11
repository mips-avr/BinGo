import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AgentVerificationAction, AgentVerificationStatus, Prisma } from '@prisma/client';
import { randomInt } from 'node:crypto';

import {
  CARD_NUMBER_ALPHABET,
  type CardTapResultDto,
  maskCardUid,
  type MemberCardDto,
  type MemberCardStatus,
  normalizeCardNumber,
  normalizeRegionKey,
  REGION_KEY_MAX_LENGTH,
  type VerificationLevel,
} from '@bingo/shared-types';

import { normalizePhoneID } from '@bingo/shared-utils';

import { PrismaService } from '../../prisma/prisma.service';
import {
  AgentVerificationsService,
  normalizeInstitutionKey,
} from '../agent-verifications/agent-verifications.service';
import type { CardLookupQueryDto } from './dto/card-lookup-query.dto';
import type { IssueMemberCardDto } from './dto/issue-member-card.dto';

type CardWithHolder = Prisma.MemberCardGetPayload<{
  include: { holder: true; issuedBy: true };
}>;

/**
 * Kartu Mitra.
 *
 * Yang membuat modul ini berbeda dari "tabel kartu" biasa: penerbitan kartu
 * MEMBUAT AKUN. Pemegangnya mendapat `User` sungguhan dengan riwayat bukti
 * timbang dan tingkat verifikasi yang sama seperti pengguna beraplikasi — yang
 * berbeda hanya cara mengaksesnya. Itulah sebabnya seluruh penerbitan berjalan
 * dalam satu transaksi: akun tanpa kartu tidak dapat dimasuki siapa pun, dan
 * kartu tanpa akun tidak berarti apa-apa.
 *
 * Penerbitan sekaligus menuliskan satu penjaminan berstatus DISETUJUI dari bank
 * sampah penerbit. Itu bukan jalan pintas: bank sampah yang menyerahkan kartu
 * secara fisik kepada seseorang memang sedang menyatakan mengenal orang itu,
 * dan pernyataan itulah yang selama ini tidak pernah tercatat di mana pun.
 * Konsekuensinya pemegang kartu langsung berada di Tingkat 1 (Dijamin Mitra) —
 * bukan Tingkat 2, karena penjaminnya masih satu lembaga.
 */
@Injectable()
export class MemberCardsService {
  private readonly logger = new Logger(MemberCardsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly verifications: AgentVerificationsService,
  ) {}

  // ---------------------------------------------------------------------------
  // Penerbitan
  // ---------------------------------------------------------------------------
  async issue(issuerId: string, dto: IssueMemberCardDto): Promise<MemberCardDto> {
    const issuer = await this.prisma.user.findUnique({ where: { id: issuerId } });
    if (!issuer) throw new NotFoundException('Penerbit tidak ditemukan');

    // Hanya operator mitra terdaftar yang boleh menerbitkan. Batasannya sama
    // dengan siapa yang boleh memberi penjaminan, dan alasannya pun sama:
    // tanpa itu, dua akun Tingkat 0 dapat saling menerbitkan kartu dan seluruh
    // makna verifikasi berjenjang runtuh.
    if (!issuer.partnerType || !issuer.partnerName) {
      throw new ForbiddenException(
        'Hanya operator mitra terdaftar (bank sampah, lapak, TPS3R, KSM persampahan, atau ' +
          'RT/RW) yang dapat menerbitkan Kartu Mitra.',
      );
    }

    const regionKey = normalizeRegionKey(dto.region).slice(0, REGION_KEY_MAX_LENGTH);
    if (!regionKey) throw new BadRequestException('Wilayah tidak valid');

    const holderPhone = dto.holderPhone ? normalizePhoneID(dto.holderPhone) : null;
    if (dto.holderPhone && !holderPhone) {
      throw new BadRequestException('Nomor telepon pemegang kartu tidak valid');
    }
    if (holderPhone) {
      const taken = await this.prisma.user.findUnique({ where: { phone: holderPhone } });
      if (taken) {
        throw new ConflictException(
          'Nomor telepon itu sudah dipakai akun lain. Bila orangnya sudah punya akun BinGo, ' +
            'pasangkan kartu ke akun tersebut, jangan buat akun baru.',
        );
      }
    }

    const cardUid = dto.cardUid?.toUpperCase() ?? null;
    if (cardUid) {
      const used = await this.prisma.memberCard.findUnique({ where: { cardUid } });
      if (used) throw new ConflictException('Kartu itu sudah terdaftar atas nama lain');
    }

    const cardNumber = await this.generateCardNumber();
    const attestorKey = normalizeInstitutionKey(issuer.partnerName);

    const card = await this.prisma.$transaction(async (tx) => {
      const holder = await tx.user.create({
        data: {
          name: dto.holderName.trim(),
          phone: holderPhone,
          // Sengaja null: akun ini belum dapat dimasuki dengan kata sandi.
          // Ia bertransaksi lewat kartu sampai pemegangnya mengklaimnya.
          passwordHash: null,
          role: 'WASTE_AGENT',
        },
      });

      await tx.agentVerification.create({
        data: {
          agentId: holder.id,
          attestorId: issuer.id,
          attestorType: issuer.partnerType!,
          attestorName: issuer.partnerName!,
          attestorPhone: issuer.phone ?? '-',
          attestorKey,
          status: AgentVerificationStatus.DISETUJUI,
          decidedAt: new Date(),
          note: 'Penjaminan otomatis: kartu diserahkan langsung oleh mitra penerbit.',
          events: {
            create: [
              {
                action: AgentVerificationAction.DIAJUKAN,
                actorId: issuer.id,
                note: 'Penerbitan Kartu Mitra',
              },
              {
                action: AgentVerificationAction.DISETUJUI,
                actorId: issuer.id,
                note: 'Kartu diserahkan langsung kepada pemegang',
              },
            ],
          },
        },
      });

      return tx.memberCard.create({
        data: {
          cardNumber,
          cardUid,
          holderId: holder.id,
          issuedById: issuer.id,
          region: dto.region.trim(),
          regionKey,
          note: dto.note ?? null,
        },
        include: { holder: true, issuedBy: true },
      });
    });

    await this.verifications.recomputeLevel(card.holderId);
    this.logger.log(`Kartu ${cardNumber} diterbitkan oleh ${issuer.partnerName}`);

    return this.toDto(await this.reload(card.id));
  }

  // ---------------------------------------------------------------------------
  // Pembacaan di konter
  // ---------------------------------------------------------------------------
  async lookup(issuerId: string, query: CardLookupQueryDto): Promise<CardTapResultDto> {
    if (!query.uid && !query.cardNumber) {
      throw new BadRequestException('Sertakan UID kartu atau nomor kartu');
    }

    const card = await this.prisma.memberCard.findFirst({
      where: query.uid
        ? { cardUid: query.uid.toUpperCase() }
        : { cardNumber: normalizeCardNumber(query.cardNumber!) },
      include: { holder: true, issuedBy: true },
    });
    if (!card) throw new NotFoundException('Kartu tidak dikenali');

    if (card.status !== 'AKTIF') {
      throw new ForbiddenException(
        card.status === 'HILANG'
          ? 'Kartu ini dilaporkan hilang dan tidak dapat dipakai. Terbitkan kartu pengganti.'
          : 'Kartu ini sedang dibekukan.',
      );
    }

    // Penanda pemakaian ditulis oleh siapa pun yang membaca kartu, bukan hanya
    // penerbitnya. Kartu berlaku di seluruh mitra — itu bagian dari janjinya.
    await this.prisma.memberCard.update({
      where: { id: card.id },
      data: { lastUsedAt: new Date() },
    });

    const agg = await this.prisma.weighingReceipt.aggregate({
      where: { sellerId: card.holderId },
      _count: { _all: true },
      _sum: { totalWeightKg: true, totalNetAmount: true },
      _max: { createdAt: true },
    });

    void issuerId;
    return {
      card: this.toDto(card),
      receiptCount: agg._count._all,
      totalWeightKg: Number(agg._sum.totalWeightKg ?? 0),
      totalNetAmount: agg._sum.totalNetAmount ?? 0,
      lastReceiptAt: agg._max.createdAt ? agg._max.createdAt.toISOString() : null,
    };
  }

  async listIssued(issuerId: string): Promise<MemberCardDto[]> {
    const rows = await this.prisma.memberCard.findMany({
      where: { issuedById: issuerId },
      include: { holder: true, issuedBy: true },
      orderBy: { issuedAt: 'desc' },
      take: 200,
    });
    return rows.map((r) => this.toDto(r));
  }

  async setStatus(
    issuerId: string,
    cardId: string,
    status: MemberCardStatus,
  ): Promise<MemberCardDto> {
    const card = await this.prisma.memberCard.findUnique({
      where: { id: cardId },
      include: { holder: true, issuedBy: true },
    });
    if (!card) throw new NotFoundException('Kartu tidak ditemukan');
    if (card.issuedById !== issuerId) {
      throw new ForbiddenException('Hanya penerbit kartu yang dapat mengubah statusnya');
    }

    const updated = await this.prisma.memberCard.update({
      where: { id: cardId },
      data: { status },
      include: { holder: true, issuedBy: true },
    });
    return this.toDto(updated);
  }

  /**
   * Memasangkan chip ke kartu yang sudah terdaftar.
   *
   * Dipisah dari penerbitan karena urutan kerja di lapangan tidak selalu rapi:
   * pendataan sering dilakukan lebih dulu di meja, sementara kartu fisiknya
   * baru datang belakangan.
   */
  async attachUid(issuerId: string, cardId: string, uid: string): Promise<MemberCardDto> {
    const normalized = uid.toUpperCase();
    const card = await this.prisma.memberCard.findUnique({ where: { id: cardId } });
    if (!card) throw new NotFoundException('Kartu tidak ditemukan');
    if (card.issuedById !== issuerId) {
      throw new ForbiddenException('Hanya penerbit kartu yang dapat memasangkan chip');
    }
    if (card.cardUid && card.cardUid !== normalized) {
      throw new ConflictException(
        'Kartu ini sudah terpasang chip lain. Bekukan kartu lama sebelum memasang chip baru.',
      );
    }

    const used = await this.prisma.memberCard.findUnique({ where: { cardUid: normalized } });
    if (used && used.id !== cardId) {
      throw new ConflictException('Chip itu sudah terdaftar pada kartu lain');
    }

    const updated = await this.prisma.memberCard.update({
      where: { id: cardId },
      data: { cardUid: normalized },
      include: { holder: true, issuedBy: true },
    });
    return this.toDto(updated);
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------
  private async reload(id: string): Promise<CardWithHolder> {
    const card = await this.prisma.memberCard.findUnique({
      where: { id },
      include: { holder: true, issuedBy: true },
    });
    if (!card) throw new NotFoundException('Kartu tidak ditemukan');
    return card;
  }

  /**
   * Nomor kartu acak, bukan berurutan.
   *
   * Nomor berurutan membocorkan berapa banyak kartu yang sudah diterbitkan dan
   * memungkinkan siapa pun menebak nomor tetangganya. Alfabetnya membuang I, L,
   * O, dan U supaya nomor tetap terbaca ketika didiktekan lewat telepon atau
   * dibaca dari kartu yang sudah kotor.
   */
  private async generateCardNumber(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      let body = '';
      for (let i = 0; i < 8; i += 1) {
        body += CARD_NUMBER_ALPHABET[randomInt(CARD_NUMBER_ALPHABET.length)];
      }
      const candidate = `BG-${body.slice(0, 4)}-${body.slice(4)}`;
      const clash = await this.prisma.memberCard.findUnique({
        where: { cardNumber: candidate },
      });
      if (!clash) return candidate;
    }
    throw new ConflictException('Gagal membuat nomor kartu unik, coba lagi');
  }

  private toDto(card: CardWithHolder): MemberCardDto {
    return {
      id: card.id,
      cardNumber: card.cardNumber,
      cardUidMasked: card.cardUid ? maskCardUid(card.cardUid) : null,
      holderName: card.holder.name,
      holderPhone: card.holder.phone,
      holderUserId: card.holderId,
      verificationLevel: card.holder.verificationLevel as VerificationLevel,
      status: card.status as MemberCardStatus,
      issuedByName: card.issuedBy.partnerName ?? card.issuedBy.name,
      issuedAt: card.issuedAt.toISOString(),
      lastUsedAt: card.lastUsedAt ? card.lastUsedAt.toISOString() : null,
      region: card.region,
      regionKey: card.regionKey,
      // Akun yang sudah punya kata sandi berarti pemegangnya sudah mengklaimnya
      // lewat ponsel sendiri. Kartu tetap berlaku; sekarang ada dua pintu.
      claimed: card.holder.passwordHash != null,
      note: card.note,
    };
  }
}
