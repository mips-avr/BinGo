import { randomInt } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  MaterialGrade as MaterialGradeType,
  PriceBandDto,
  PriceBoardDto,
  WeighingLineDto,
  WeighingReceiptDto,
} from '@bingo/shared-types';
import { MATERIAL_GRADES } from '@bingo/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../../common/types/authenticated-request';
import type {
  CreateWeighingLineDto,
  CreateWeighingReceiptDto,
} from './dto/create-weighing-receipt.dto';
import type { PriceBoardQueryDto } from './dto/price-board-query.dto';

/**
 * Ambang minimum sebelum sebaran harga boleh ditampilkan.
 *
 * Menampilkan median dari satu laporan tunggal berarti menyamarkan pengumuman
 * satu pembeli sebagai informasi pasar. Lebih jujur menampilkan "data belum
 * cukup" daripada angka yang terlihat pasti tetapi tidak berdasar.
 */
export const MIN_SAMPLES_PER_BAND = 3;
export const MIN_PARTNERS_PER_BAND = 2;

/** Jendela kesegaran bawaan papan harga, dalam hari. */
export const DEFAULT_PRICE_WINDOW_DAYS = 7;

interface PriceBandRow {
  grade: MaterialGradeType;
  p25: number | null;
  median: number | null;
  p75: number | null;
  sample_count: number;
  partner_count: number;
  last_reported_at: Date;
}

type ReceiptWithLines = Prisma.WeighingReceiptGetPayload<{ include: { lines: true } }>;

/** Hasil perhitungan satu baris sebelum disimpan. */
interface ComputedLine {
  grade: MaterialGradeType;
  weightKg: Prisma.Decimal;
  deductionKg: Prisma.Decimal;
  deductionReason: string | null;
  pricePerKg: number;
  deductionAmount: number;
  grossAmount: number;
  subtotal: number;
}

@Injectable()
export class WeighingReceiptsService {
  private readonly logger = new Logger(WeighingReceiptsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------------------
  async create(issuedById: string, dto: CreateWeighingReceiptDto): Promise<WeighingReceiptDto> {
    if (dto.sellerId === issuedById) {
      throw new BadRequestException(
        'Penerbit bukti timbang tidak boleh sama dengan pihak yang menyetor',
      );
    }

    const seller = await this.prisma.user.findUnique({ where: { id: dto.sellerId } });
    if (!seller) throw new NotFoundException('Penyetor tidak ditemukan');

    if (dto.pickupRequestId) {
      const pickup = await this.prisma.pickupRequest.findUnique({
        where: { id: dto.pickupRequestId },
      });
      if (!pickup) throw new NotFoundException('Permintaan penjemputan tidak ditemukan');
      if (pickup.agentId !== issuedById) {
        throw new ForbiddenException(
          'Hanya pemulung yang memegang permintaan ini yang boleh menerbitkan bukti timbang',
        );
      }
      if (pickup.citizenId !== dto.sellerId) {
        throw new BadRequestException(
          'Penyetor pada bukti timbang tidak cocok dengan pemilik permintaan penjemputan',
        );
      }
      const existing = await this.prisma.weighingReceipt.findUnique({
        where: { pickupRequestId: dto.pickupRequestId },
      });
      if (existing) {
        throw new BadRequestException('Permintaan ini sudah memiliki bukti timbang');
      }
    }

    const lines = dto.lines.map((line, index) => this.computeLine(line, index));
    const totals = this.computeTotals(lines);

    const created = await this.createWithUniqueReceiptNo(issuedById, dto, lines, totals);
    this.logger.log(
      `Bukti timbang ${created.receiptNo} diterbitkan oleh ${issuedById} untuk ${dto.sellerId}`,
    );
    return this.toDto(created);
  }

  /**
   * Nomor bukti dibuat acak lalu disimpan; bila bertabrakan dengan nomor yang
   * sudah ada, ulangi. Tabrakan sangat jarang, tetapi menanganinya di sini
   * lebih aman daripada mengandalkan keunikan probabilistik.
   */
  private async createWithUniqueReceiptNo(
    issuedById: string,
    dto: CreateWeighingReceiptDto,
    lines: ComputedLine[],
    totals: ReturnType<WeighingReceiptsService['computeTotals']>,
  ): Promise<ReceiptWithLines> {
    const MAX_ATTEMPTS = 5;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        return await this.prisma.weighingReceipt.create({
          data: {
            receiptNo: this.generateReceiptNo(),
            pickupRequestId: dto.pickupRequestId ?? null,
            sellerId: dto.sellerId,
            issuedById,
            partnerName: dto.partnerName,
            scaleTeraNo: dto.scaleTeraNo ?? null,
            region: dto.region,
            notes: dto.notes ?? null,
            totalWeightKg: totals.totalWeightKg,
            totalDeductionKg: totals.totalDeductionKg,
            totalGrossAmount: totals.totalGrossAmount,
            totalDeductionAmount: totals.totalDeductionAmount,
            totalNetAmount: totals.totalNetAmount,
            lines: { create: lines },
          },
          include: { lines: true },
        });
      } catch (error) {
        const isDuplicateReceiptNo =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          String(error.meta?.target ?? '').includes('receipt_no');
        if (!isDuplicateReceiptNo || attempt === MAX_ATTEMPTS) throw error;
      }
    }
    // Tidak tercapai: loop di atas selalu mengembalikan nilai atau melempar.
    throw new Error('Gagal membuat nomor bukti timbang yang unik');
  }

  // -------------------------------------------------------------------------
  // READ
  // -------------------------------------------------------------------------
  async getByIdForUser(id: string, user: AuthenticatedUser): Promise<WeighingReceiptDto> {
    const receipt = await this.prisma.weighingReceipt.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!receipt) throw new NotFoundException('Bukti timbang tidak ditemukan');

    // Bukti timbang adalah dokumen dua pihak. Hanya penyetor dan penerbit yang
    // boleh membukanya.
    if (receipt.sellerId !== user.id && receipt.issuedById !== user.id) {
      throw new ForbiddenException('Anda tidak memiliki akses ke bukti timbang ini');
    }
    return this.toDto(receipt);
  }

  async listForUser(userId: string): Promise<WeighingReceiptDto[]> {
    const rows = await this.prisma.weighingReceipt.findMany({
      where: { OR: [{ sellerId: userId }, { issuedById: userId }] },
      include: { lines: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((r) => this.toDto(r));
  }

  // -------------------------------------------------------------------------
  // PAPAN HARGA — lapis 2: harga transaksi nyata
  // -------------------------------------------------------------------------
  /**
   * Menghitung sebaran harga per grade dari bukti timbang yang benar-benar
   * tercatat di wilayah tertentu.
   *
   * Hanya bukti dengan nomor tera timbangan yang dihitung. Bukti tanpa nomor
   * tera tetap sah sebagai catatan transaksi antara dua pihak, tetapi tidak
   * layak menjadi rujukan harga karena beratnya tidak dapat dipertanggungjawabkan.
   */
  async getPriceBoard(query: PriceBoardQueryDto): Promise<PriceBoardDto> {
    const windowDays = query.windowDays ?? DEFAULT_PRICE_WINDOW_DAYS;
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

    const rows = await this.prisma.$queryRaw<PriceBandRow[]>(Prisma.sql`
      SELECT
        l.grade,
        percentile_cont(0.25) WITHIN GROUP (ORDER BY l.price_per_kg) AS p25,
        percentile_cont(0.50) WITHIN GROUP (ORDER BY l.price_per_kg) AS median,
        percentile_cont(0.75) WITHIN GROUP (ORDER BY l.price_per_kg) AS p75,
        COUNT(*)::int AS sample_count,
        COUNT(DISTINCT r.partner_name)::int AS partner_count,
        MAX(r.created_at) AS last_reported_at
      FROM weighing_receipt_lines l
      JOIN weighing_receipts r ON r.id = l.receipt_id
      WHERE r.region = ${query.region}
        AND r.scale_tera_no IS NOT NULL
        AND r.created_at >= ${since}
      GROUP BY l.grade
      ORDER BY l.grade
    `);

    const bands: PriceBandDto[] = [];
    const insufficient: MaterialGradeType[] = [];

    for (const row of rows) {
      const enoughSamples = Number(row.sample_count) >= MIN_SAMPLES_PER_BAND;
      const enoughPartners = Number(row.partner_count) >= MIN_PARTNERS_PER_BAND;
      if (!enoughSamples || !enoughPartners) {
        insufficient.push(row.grade);
        continue;
      }
      bands.push({
        grade: row.grade,
        label: MATERIAL_GRADES[row.grade]?.label ?? row.grade,
        region: query.region,
        p25: Math.round(Number(row.p25 ?? 0)),
        median: Math.round(Number(row.median ?? 0)),
        p75: Math.round(Number(row.p75 ?? 0)),
        sampleCount: Number(row.sample_count),
        partnerCount: Number(row.partner_count),
        lastReportedAt: row.last_reported_at.toISOString(),
      });
    }

    return { region: query.region, windowDays, bands, insufficient };
  }

  // -------------------------------------------------------------------------
  // Perhitungan
  // -------------------------------------------------------------------------
  private computeLine(line: CreateWeighingLineDto, index: number): ComputedLine {
    const position = index + 1;
    const deductionKg = line.deductionKg ?? 0;
    const deductionAmount = line.deductionAmount ?? 0;

    if (deductionKg > line.weightKg) {
      throw new BadRequestException(
        `Baris ${position}: potongan berat tidak boleh melebihi berat timbang`,
      );
    }
    if ((deductionKg > 0 || deductionAmount > 0) && !line.deductionReason) {
      throw new BadRequestException(
        `Baris ${position}: potongan wajib disertai alasan agar dapat diperiksa penyetor`,
      );
    }

    const netWeightKg = this.round2(line.weightKg - deductionKg);
    const grossAmount = Math.round(netWeightKg * line.pricePerKg);

    if (deductionAmount > grossAmount) {
      throw new BadRequestException(
        `Baris ${position}: potongan rupiah melebihi nilai material, sehingga pembayaran menjadi negatif`,
      );
    }

    return {
      grade: line.grade,
      weightKg: new Prisma.Decimal(line.weightKg),
      deductionKg: new Prisma.Decimal(deductionKg),
      deductionReason: line.deductionReason ?? null,
      pricePerKg: line.pricePerKg,
      deductionAmount,
      grossAmount,
      subtotal: grossAmount - deductionAmount,
    };
  }

  private computeTotals(lines: ComputedLine[]) {
    const totalWeight = lines.reduce((sum, l) => sum + Number(l.weightKg), 0);
    const totalDeductionKg = lines.reduce((sum, l) => sum + Number(l.deductionKg), 0);
    return {
      totalWeightKg: new Prisma.Decimal(this.round2(totalWeight)),
      totalDeductionKg: new Prisma.Decimal(this.round2(totalDeductionKg)),
      totalGrossAmount: lines.reduce((sum, l) => sum + l.grossAmount, 0),
      totalDeductionAmount: lines.reduce((sum, l) => sum + l.deductionAmount, 0),
      totalNetAmount: lines.reduce((sum, l) => sum + l.subtotal, 0),
    };
  }

  /** Membulatkan ke 2 desimal tanpa galat penjumlahan floating point beruntun. */
  private round2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  /**
   * Nomor bukti berformat `BG-YYMMDD-XXXX`, cukup pendek untuk dibacakan saat
   * serah terima namun tetap sulit ditebak.
   */
  private generateReceiptNo(): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    // Tanpa huruf/angka yang mudah tertukar saat dibacakan (0/O, 1/I).
    const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let suffix = '';
    for (let i = 0; i < 4; i += 1) suffix += alphabet[randomInt(alphabet.length)];
    return `BG-${yy}${mm}${dd}-${suffix}`;
  }

  // -------------------------------------------------------------------------
  // Pemetaan DTO
  // -------------------------------------------------------------------------
  private toDto(r: ReceiptWithLines): WeighingReceiptDto {
    const lines: WeighingLineDto[] = r.lines.map((l) => {
      const weightKg = Number(l.weightKg);
      const deductionKg = Number(l.deductionKg);
      return {
        id: l.id,
        grade: l.grade as MaterialGradeType,
        weightKg,
        deductionKg,
        deductionReason: l.deductionReason,
        netWeightKg: this.round2(weightKg - deductionKg),
        pricePerKg: l.pricePerKg,
        deductionAmount: l.deductionAmount,
        grossAmount: l.grossAmount,
        subtotal: l.subtotal,
      };
    });

    const totalWeightKg = Number(r.totalWeightKg);
    const totalDeductionKg = Number(r.totalDeductionKg);

    return {
      id: r.id,
      receiptNo: r.receiptNo,
      pickupRequestId: r.pickupRequestId,
      sellerId: r.sellerId,
      issuedById: r.issuedById,
      partnerName: r.partnerName,
      scaleTeraNo: r.scaleTeraNo,
      scaleVerified: r.scaleTeraNo !== null,
      region: r.region,
      lines,
      totalWeightKg,
      totalDeductionKg,
      totalNetWeightKg: this.round2(totalWeightKg - totalDeductionKg),
      totalGrossAmount: r.totalGrossAmount,
      totalDeductionAmount: r.totalDeductionAmount,
      totalNetAmount: r.totalNetAmount,
      notes: r.notes,
      createdAt: r.createdAt.toISOString(),
    };
  }
}
