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
  RegionSummaryDto,
  WeighingLineDto,
  WeighingReceiptDto,
} from '@bingo/shared-types';
import { MATERIAL_GRADES, REGION_KEY_MAX_LENGTH, normalizeRegionKey } from '@bingo/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { AgentVerificationsService } from '../agent-verifications/agent-verifications.service';
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

interface RegionRow {
  region_key: string;
  label: string;
  receipt_count: number;
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

  constructor(
    private readonly prisma: PrismaService,
    private readonly verifications: AgentVerificationsService,
  ) {}

  // -------------------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------------------
  /**
   * Menerbitkan bukti timbang.
   *
   * Aturan keterlacakan (paling penting di berkas ini): bukti timbang harus
   * dapat dihubungkan ke sebuah serah terima yang benar-benar terjadi. Tanpa
   * aturan ini, seorang pemulung dapat menerbitkan bukti atas nama `sellerId`
   * mana pun yang ia ketahui, dengan harga berapa pun, tanpa pernah menyentuh
   * material — dan bukti itu ikut menyusun papan harga. Artinya papan harga,
   * klaim terkuat produk ini, dapat digerakkan oleh satu akun dari rumah.
   *
   * Karena itu bukti hanya diterima dalam dua bentuk:
   *   1. terikat `pickupRequestId` — permintaan itu harus milik penyetor dan
   *      dipegang oleh penerbit, sehingga kedua pihak memang bertemu; atau
   *   2. `walkIn: true` — setoran langsung di titik penerima. Bukti ini tetap
   *      sah dan lengkap sebagai catatan dua pihak (penyetor dapat membukanya,
   *      memeriksa potongan, dan mempersoalkannya), tetapi TIDAK dihitung ke
   *      papan harga karena tidak ada apa pun yang dapat mengonfirmasi bahwa
   *      serah terima itu terjadi.
   *
   * Menolak walk-in sama sekali bukan pilihan: sebagian besar setoran nyata di
   * lapangan memang berbentuk datang langsung ke lapak. Yang benar adalah
   * mencatatnya, menandainya, dan tidak memakainya sebagai rujukan harga.
   *
   * Aturan kedua, dipasang paling awal: penerbit harus sudah Tingkat 1. Bukti
   * timbang adalah dokumen yang dipegang warga sebagai pegangan harga dan
   * sekaligus bahan mentah papan harga; penerbit yang tidak dijamin siapa pun
   * dapat mencetak keduanya sekaligus.
   */
  async create(issuedById: string, dto: CreateWeighingReceiptDto): Promise<WeighingReceiptDto> {
    await this.verifications.assertCanIssueReceipt(issuedById);

    if (dto.sellerId === issuedById) {
      throw new BadRequestException(
        'Penerbit bukti timbang tidak boleh sama dengan pihak yang menyetor',
      );
    }

    // Status walk-in diturunkan dari ada/tidaknya kaitan penjemputan, bukan
    // sekadar dipercaya dari penanda yang dikirim klien. Bila permintaan
    // penjemputan ada dan lolos pemeriksaan di bawah, bukti ini menurut
    // definisinya bukan setoran langsung.
    const isWalkIn = !dto.pickupRequestId;
    if (isWalkIn && dto.walkIn !== true) {
      throw new BadRequestException(
        'Bukti timbang harus terkait permintaan penjemputan, atau ditandai sebagai setoran langsung (walkIn)',
      );
    }

    const regionKey = normalizeRegionKey(dto.region);
    if (!regionKey) {
      throw new BadRequestException(
        'Nama wilayah tidak dikenali. Sertakan nama kecamatan atau kota, bukan hanya kata "Kecamatan" atau tanda baca',
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
      // Pemeriksaan awal ini hanya untuk pesan yang jelas. Penjaga sebenarnya
      // adalah indeks unik pada `pickup_request_id`; bila dua permintaan
      // berbarengan lolos pemeriksaan ini, basis data menolak yang kedua dan
      // AllExceptionsFilter memetakan P2002 menjadi HTTP 409.
      const existing = await this.prisma.weighingReceipt.findUnique({
        where: { pickupRequestId: dto.pickupRequestId },
      });
      if (existing) {
        throw new BadRequestException('Permintaan ini sudah memiliki bukti timbang');
      }
    }

    const lines = dto.lines.map((line, index) => this.computeLine(line, index));
    const totals = this.computeTotals(lines);

    const created = await this.createWithUniqueReceiptNo(issuedById, dto, {
      regionKey: regionKey.slice(0, REGION_KEY_MAX_LENGTH),
      walkIn: isWalkIn,
      lines,
      totals,
    });
    // Transaksi nirsengketa adalah salah satu syarat Tingkat 2, jadi bukti
    // yang baru terbit dapat menaikkan tingkat penerbitnya. Dihitung ulang di
    // sini supaya kenaikan terasa saat pekerjaan berikutnya, bukan menunggu
    // kejadian lain yang kebetulan memicu perhitungan.
    await this.verifications.recomputeLevel(issuedById);

    this.logger.log(
      `Bukti timbang ${created.receiptNo} diterbitkan oleh ${issuedById} untuk ${dto.sellerId}` +
        `${isWalkIn ? ' (setoran langsung, tidak masuk papan harga)' : ''}`,
    );
    return this.toDto(created);
  }

  // -------------------------------------------------------------------------
  // SENGKETA
  // -------------------------------------------------------------------------
  /**
   * Penyetor mempersoalkan bukti timbang yang diterbitkan atas namanya.
   *
   * Seluruh rancangan bukti timbang bertumpu pada janji bahwa penyetor dapat
   * membukanya, memeriksa potongan, dan mempersoalkannya — tetapi sampai
   * sekarang dua yang pertama ada dan yang ketiga tidak. Tanpa jalur ini,
   * "10 transaksi nirsengketa" pada Tingkat 2 hanyalah "10 transaksi".
   *
   * Sengketa tidak menghapus bukti dan tidak mengubah angkanya: yang dicatat
   * adalah bahwa salah satu pihak tidak menerimanya. Bukti yang disengketakan
   * berhenti dihitung sebagai rekam jejak penerbitnya, sehingga tingkatnya
   * dapat turun kembali.
   */
  async dispute(id: string, sellerId: string, reason: string): Promise<WeighingReceiptDto> {
    const receipt = await this.prisma.weighingReceipt.findUnique({ where: { id } });
    if (!receipt) throw new NotFoundException('Bukti timbang tidak ditemukan');
    if (receipt.sellerId !== sellerId) {
      throw new ForbiddenException('Hanya penyetor yang boleh mempersoalkan bukti timbang ini');
    }
    if (receipt.disputedAt) {
      throw new BadRequestException('Bukti timbang ini sudah dipersoalkan sebelumnya');
    }

    const updated = await this.prisma.weighingReceipt.update({
      where: { id },
      data: { disputedAt: new Date(), disputeReason: reason },
      include: { lines: true },
    });

    await this.verifications.recomputeLevel(receipt.issuedById);
    this.logger.warn(`Bukti timbang ${receipt.receiptNo} dipersoalkan penyetor ${sellerId}`);
    return this.toDto(updated);
  }

  /**
   * Nomor bukti dibuat acak lalu disimpan; bila bertabrakan dengan nomor yang
   * sudah ada, ulangi. Tabrakan sangat jarang, tetapi menanganinya di sini
   * lebih aman daripada mengandalkan keunikan probabilistik.
   */
  private async createWithUniqueReceiptNo(
    issuedById: string,
    dto: CreateWeighingReceiptDto,
    computed: {
      regionKey: string;
      walkIn: boolean;
      lines: ComputedLine[];
      totals: ReturnType<WeighingReceiptsService['computeTotals']>;
    },
  ): Promise<ReceiptWithLines> {
    const { regionKey, walkIn, lines, totals } = computed;
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
            regionKey,
            walkIn,
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
        // Hanya tabrakan nomor bukti yang layak diulang. Pelanggaran unik lain
        // (mis. dua bukti untuk satu permintaan penjemputan) diteruskan apa
        // adanya; AllExceptionsFilter memetakannya menjadi HTTP 409, bukan 500.
        if (!this.isDuplicateOf(error, 'receipt_no') || attempt === MAX_ATTEMPTS) throw error;
      }
    }
    // Tidak tercapai: loop di atas selalu mengembalikan nilai atau melempar.
    throw new Error('Gagal membuat nomor bukti timbang yang unik');
  }

  /** `true` bila galat Prisma adalah pelanggaran unik pada kolom tertentu. */
  private isDuplicateOf(error: unknown, column: string): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      String(error.meta?.target ?? '').includes(column)
    );
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
   * Tiga penyaringan menentukan bukti mana yang boleh menjadi rujukan harga:
   *
   *   1. `region_key` — bukan `region`. Wilayah diketik manusia; mencocokkan
   *      teks mentah membuat "Kecamatan Beji, Depok" dan "kec. beji depok"
   *      menjadi dua wilayah berbeda yang keduanya tidak pernah cukup data.
   *   2. `scale_tera_no IS NOT NULL` — bukti tanpa nomor tera timbangan tetap
   *      sah sebagai catatan dua pihak, tetapi beratnya tidak dapat
   *      dipertanggungjawabkan, sehingga harganya tidak layak jadi rujukan.
   *   3. `walk_in = false` — setoran langsung tidak dapat ditelusuri ke serah
   *      terima mana pun, sehingga tidak boleh menggerakkan papan harga.
   *
   * `sample_count` menghitung bukti timbang berbeda (COUNT DISTINCT r.id),
   * bukan baris. Menghitung baris berarti satu bukti yang memuat tiga baris
   * grade yang sama sudah memenuhi ambang tiga sampel, sehingga satu transaksi
   * tunggal dapat menyamar sebagai median pasar.
   */
  async getPriceBoard(query: PriceBoardQueryDto): Promise<PriceBoardDto> {
    const windowDays = query.windowDays ?? DEFAULT_PRICE_WINDOW_DAYS;
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
    const regionKey = normalizeRegionKey(query.region);

    // Wilayah yang tidak menyisakan satu kata pun tidak mungkin cocok dengan
    // bukti mana pun; kembalikan papan kosong tanpa menyentuh basis data.
    if (!regionKey) {
      return { region: query.region, regionKey, windowDays, bands: [], insufficient: [] };
    }

    const gradeFilter = query.grade
      ? Prisma.sql`AND l.grade = CAST(${query.grade} AS "MaterialGrade")`
      : Prisma.empty;

    const rows = await this.prisma.$queryRaw<PriceBandRow[]>(Prisma.sql`
      SELECT
        l.grade,
        percentile_cont(0.25) WITHIN GROUP (ORDER BY l.price_per_kg) AS p25,
        percentile_cont(0.50) WITHIN GROUP (ORDER BY l.price_per_kg) AS median,
        percentile_cont(0.75) WITHIN GROUP (ORDER BY l.price_per_kg) AS p75,
        COUNT(DISTINCT r.id)::int AS sample_count,
        COUNT(DISTINCT r.partner_name)::int AS partner_count,
        MAX(r.created_at) AS last_reported_at
      FROM weighing_receipt_lines l
      JOIN weighing_receipts r ON r.id = l.receipt_id
      WHERE r.region_key = ${regionKey}
        AND r.scale_tera_no IS NOT NULL
        AND r.walk_in = false
        AND r.created_at >= ${since}
        ${gradeFilter}
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
        regionKey,
        p25: Math.round(Number(row.p25 ?? 0)),
        median: Math.round(Number(row.median ?? 0)),
        p75: Math.round(Number(row.p75 ?? 0)),
        sampleCount: Number(row.sample_count),
        partnerCount: Number(row.partner_count),
        lastReportedAt: row.last_reported_at.toISOString(),
      });
    }

    return { region: query.region, regionKey, windowDays, bands, insufficient };
  }

  /**
   * Daftar wilayah yang sudah memiliki bukti timbang.
   *
   * Papan harga hanya berguna bila pengguna memasukkan wilayah yang memang
   * punya data. Tanpa daftar ini, pemulung mengetik buta dan hampir selalu
   * mendapat papan kosong, lalu menyimpulkan fiturnya rusak. Label memakai
   * ejaan dari bukti timbang TERBARU di wilayah tersebut, supaya yang
   * ditawarkan adalah tulisan yang benar-benar dipakai orang di sana.
   */
  async listRegions(): Promise<RegionSummaryDto[]> {
    const rows = await this.prisma.$queryRaw<RegionRow[]>(Prisma.sql`
      SELECT
        agg.region_key,
        latest.region AS label,
        agg.receipt_count
      FROM (
        SELECT region_key, COUNT(*)::int AS receipt_count
        FROM weighing_receipts
        GROUP BY region_key
      ) agg
      JOIN (
        SELECT DISTINCT ON (region_key) region_key, region
        FROM weighing_receipts
        ORDER BY region_key, created_at DESC
      ) latest ON latest.region_key = agg.region_key
      ORDER BY agg.receipt_count DESC, latest.region ASC
      LIMIT 100
    `);

    return rows.map((r) => ({
      label: r.label,
      regionKey: r.region_key,
      receiptCount: Number(r.receipt_count),
    }));
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
      regionKey: r.regionKey,
      walkIn: r.walkIn,
      lines,
      totalWeightKg,
      totalDeductionKg,
      totalNetWeightKg: this.round2(totalWeightKg - totalDeductionKg),
      totalGrossAmount: r.totalGrossAmount,
      totalDeductionAmount: r.totalDeductionAmount,
      totalNetAmount: r.totalNetAmount,
      notes: r.notes,
      disputedAt: r.disputedAt?.toISOString() ?? null,
      disputeReason: r.disputeReason ?? null,
      createdAt: r.createdAt.toISOString(),
    };
  }
}
