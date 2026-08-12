import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { WeighingReceiptsService } from '../weighing-receipts.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { AgentVerificationsService } from '../../agent-verifications/agent-verifications.service';
import type { CreateWeighingReceiptDto } from '../dto/create-weighing-receipt.dto';

const AGENT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CITIZEN = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function baseDto(overrides: Partial<CreateWeighingReceiptDto> = {}): CreateWeighingReceiptDto {
  return {
    sellerId: CITIZEN,
    partnerName: 'Bank Sampah Melati',
    region: 'Kecamatan Beji, Depok',
    scaleTeraNo: 'DKI-2025-004821',
    // Bukti tanpa `pickupRequestId` wajib mengaku sebagai setoran langsung;
    // lihat aturan keterlacakan di WeighingReceiptsService.create(). Bila
    // `pickupRequestId` diisi pada test tertentu, penanda ini diabaikan karena
    // service menurunkan status walk-in dari ada/tidaknya kaitan penjemputan.
    walkIn: true,
    lines: [{ grade: 'PET_BOTOL_BENING', weightKg: 10, pricePerKg: 2500 }],
    ...overrides,
  } as CreateWeighingReceiptDto;
}

/** Membentuk baris tersimpan dari payload `lines.create` yang dikirim service. */
function storedLine(input: Record<string, unknown>, index: number) {
  return { id: `line-${index}`, receiptId: 'r1', ...input };
}

describe('WeighingReceiptsService', () => {
  let service: WeighingReceiptsService;
  let prisma: {
    user: { findUnique: jest.Mock };
    pickupRequest: { findUnique: jest.Mock };
    weighingReceipt: { create: jest.Mock; findUnique: jest.Mock; findMany: jest.Mock };
    $queryRaw: jest.Mock;
  };
  /**
   * Penjenjangan verifikasi diuji di modulnya sendiri; di sini penjaga
   * dipalsukan sebagai lolos agar berkas ini tetap menguji perhitungan bukti
   * timbang.
   */
  let verifications: { assertCanIssueReceipt: jest.Mock; recomputeLevel: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: CITIZEN }) },
      pickupRequest: { findUnique: jest.fn() },
      weighingReceipt: {
        // Kembalikan data yang benar-benar dikirim service supaya asersi
        // perhitungan menguji nilai nyata, bukan nilai yang dipalsukan mock.
        create: jest.fn(
          async ({
            data,
          }: {
            data: Record<string, unknown> & { lines: { create: Record<string, unknown>[] } };
          }) => ({
            id: 'r1',
            ...data,
            pickupRequestId: data.pickupRequestId ?? null,
            scaleTeraNo: data.scaleTeraNo ?? null,
            notes: data.notes ?? null,
            createdAt: new Date('2026-08-03T10:00:00Z'),
            updatedAt: new Date('2026-08-03T10:00:00Z'),
            lines: data.lines.create.map(storedLine),
          }),
        ),
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
      },
      $queryRaw: jest.fn().mockResolvedValue([]),
    };
    verifications = {
      assertCanIssueReceipt: jest.fn().mockResolvedValue(undefined),
      recomputeLevel: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        WeighingReceiptsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AgentVerificationsService, useValue: verifications },
      ],
    }).compile();

    service = moduleRef.get(WeighingReceiptsService);
  });

  // -------------------------------------------------------------------------
  describe('perhitungan bukti timbang', () => {
    it('menghitung nilai kotor dari berat bersih dikali harga per kg', async () => {
      const receipt = await service.create(AGENT, baseDto());

      expect(receipt.lines).toHaveLength(1);
      expect(receipt.lines[0]).toMatchObject({
        weightKg: 10,
        deductionKg: 0,
        netWeightKg: 10,
        pricePerKg: 2500,
        grossAmount: 25000,
        subtotal: 25000,
      });
      expect(receipt.totalNetAmount).toBe(25000);
    });

    it('mengurangi potongan berat sebelum mengalikan harga', async () => {
      const receipt = await service.create(
        AGENT,
        baseDto({
          lines: [
            {
              grade: 'PET_BOTOL_BENING',
              weightKg: 10,
              deductionKg: 1.5,
              deductionReason: 'Kadar air tinggi',
              pricePerKg: 2500,
            },
          ],
        }),
      );

      // (10 - 1,5) × 2500 = 21.250
      expect(receipt.lines[0].netWeightKg).toBe(8.5);
      expect(receipt.lines[0].grossAmount).toBe(21250);
      expect(receipt.totalNetWeightKg).toBe(8.5);
    });

    it('mencatat potongan rupiah sebagai baris terpisah, bukan memotong harga', async () => {
      const receipt = await service.create(
        AGENT,
        baseDto({
          lines: [
            {
              grade: 'KERTAS_KARDUS',
              weightKg: 20,
              pricePerKg: 1260,
              deductionAmount: 5000,
              deductionReason: 'Biaya angkut',
            },
          ],
        }),
      );

      // Harga per kg tetap utuh; potongan berdiri sendiri dan dapat diperiksa.
      expect(receipt.lines[0].pricePerKg).toBe(1260);
      expect(receipt.lines[0].grossAmount).toBe(25200);
      expect(receipt.lines[0].deductionAmount).toBe(5000);
      expect(receipt.lines[0].subtotal).toBe(20200);
      expect(receipt.totalGrossAmount).toBe(25200);
      expect(receipt.totalDeductionAmount).toBe(5000);
      expect(receipt.totalNetAmount).toBe(20200);
    });

    it('menjumlahkan beberapa grade dalam satu bukti', async () => {
      const receipt = await service.create(
        AGENT,
        baseDto({
          lines: [
            { grade: 'PET_BOTOL_BENING', weightKg: 4, pricePerKg: 2500 },
            { grade: 'KERTAS_KORAN', weightKg: 6.25, pricePerKg: 3000 },
          ],
        }),
      );

      expect(receipt.totalWeightKg).toBe(10.25);
      expect(receipt.totalGrossAmount).toBe(10000 + 18750);
      expect(receipt.totalNetAmount).toBe(28750);
    });
  });

  // -------------------------------------------------------------------------
  describe('penolakan bukti yang tidak dapat dipertanggungjawabkan', () => {
    it('menolak potongan tanpa alasan', async () => {
      await expect(
        service.create(
          AGENT,
          baseDto({
            lines: [{ grade: 'PET_BOTOL_BENING', weightKg: 10, deductionKg: 2, pricePerKg: 2500 }],
          }),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('menolak potongan berat yang melebihi berat timbang', async () => {
      await expect(
        service.create(
          AGENT,
          baseDto({
            lines: [
              {
                grade: 'PET_BOTOL_BENING',
                weightKg: 5,
                deductionKg: 6,
                deductionReason: 'Kadar air',
                pricePerKg: 2500,
              },
            ],
          }),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('menolak potongan rupiah yang membuat pembayaran menjadi negatif', async () => {
      await expect(
        service.create(
          AGENT,
          baseDto({
            lines: [
              {
                grade: 'LDPE_KRESEK',
                weightKg: 2,
                pricePerKg: 50,
                deductionAmount: 5000,
                deductionReason: 'Biaya angkut',
              },
            ],
          }),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('menolak bila penerbit dan penyetor adalah orang yang sama', async () => {
      await expect(service.create(AGENT, baseDto({ sellerId: AGENT }))).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('menolak bila penyetor tidak ditemukan', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);
      await expect(service.create(AGENT, baseDto())).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  // -------------------------------------------------------------------------
  describe('keterkaitan dengan permintaan penjemputan', () => {
    const PICKUP = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

    it('menolak bila bukti diterbitkan oleh pemulung yang bukan pemegang permintaan', async () => {
      prisma.pickupRequest.findUnique.mockResolvedValue({
        id: PICKUP,
        agentId: 'agen-lain',
        citizenId: CITIZEN,
      });
      await expect(
        service.create(AGENT, baseDto({ pickupRequestId: PICKUP })),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('menolak bila penyetor tidak cocok dengan pemilik permintaan', async () => {
      prisma.pickupRequest.findUnique.mockResolvedValue({
        id: PICKUP,
        agentId: AGENT,
        citizenId: 'warga-lain',
      });
      await expect(
        service.create(AGENT, baseDto({ pickupRequestId: PICKUP })),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('menolak permintaan yang sudah punya bukti timbang', async () => {
      prisma.pickupRequest.findUnique.mockResolvedValue({
        id: PICKUP,
        agentId: AGENT,
        citizenId: CITIZEN,
      });
      prisma.weighingReceipt.findUnique.mockResolvedValueOnce({ id: 'sudah-ada' });
      await expect(
        service.create(AGENT, baseDto({ pickupRequestId: PICKUP })),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  // -------------------------------------------------------------------------
  describe('nomor bukti', () => {
    it('berformat BG-YYMMDD-XXXX tanpa karakter yang mudah tertukar', async () => {
      const receipt = await service.create(AGENT, baseDto());
      expect(receipt.receiptNo).toMatch(/^BG-\d{6}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/);
    });

    it('mengulang pembuatan bila nomor bertabrakan', async () => {
      const duplicate = new Prisma.PrismaClientKnownRequestError('duplikat', {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['receipt_no'] },
      });
      const original = prisma.weighingReceipt.create.getMockImplementation()!;
      prisma.weighingReceipt.create
        .mockRejectedValueOnce(duplicate)
        .mockImplementationOnce(original as never);

      const receipt = await service.create(AGENT, baseDto());
      expect(prisma.weighingReceipt.create).toHaveBeenCalledTimes(2);
      expect(receipt.receiptNo).toMatch(/^BG-/);
    });
  });

  // -------------------------------------------------------------------------
  describe('akses bukti timbang', () => {
    const stored = {
      id: 'r1',
      receiptNo: 'BG-260803-AB2C',
      pickupRequestId: null,
      sellerId: CITIZEN,
      issuedById: AGENT,
      partnerName: 'Bank Sampah Melati',
      scaleTeraNo: null,
      region: 'Kecamatan Beji, Depok',
      notes: null,
      totalWeightKg: new Prisma.Decimal(10),
      totalDeductionKg: new Prisma.Decimal(0),
      totalGrossAmount: 25000,
      totalDeductionAmount: 0,
      totalNetAmount: 25000,
      createdAt: new Date('2026-08-03T10:00:00Z'),
      updatedAt: new Date('2026-08-03T10:00:00Z'),
      lines: [],
    };

    it('mengizinkan penyetor dan penerbit', async () => {
      prisma.weighingReceipt.findUnique.mockResolvedValue(stored);
      await expect(
        service.getByIdForUser('r1', { id: CITIZEN, role: 'CITIZEN' } as never),
      ).resolves.toMatchObject({ id: 'r1' });
      await expect(
        service.getByIdForUser('r1', { id: AGENT, role: 'WASTE_AGENT' } as never),
      ).resolves.toMatchObject({ id: 'r1' });
    });

    it('menolak pihak ketiga', async () => {
      prisma.weighingReceipt.findUnique.mockResolvedValue(stored);
      await expect(
        service.getByIdForUser('r1', { id: 'orang-lain', role: 'CITIZEN' } as never),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('menandai bukti tanpa nomor tera sebagai belum terverifikasi', async () => {
      prisma.weighingReceipt.findUnique.mockResolvedValue(stored);
      const dto = await service.getByIdForUser('r1', { id: AGENT, role: 'WASTE_AGENT' } as never);
      expect(dto.scaleVerified).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  describe('papan harga', () => {
    const region = 'Kecamatan Beji, Depok';

    it('menampilkan sebaran hanya bila memenuhi ambang minimum data', async () => {
      prisma.$queryRaw.mockResolvedValue([
        {
          grade: 'PET_BOTOL_BENING',
          p25: 2300.4,
          median: 2500,
          p75: 2700.6,
          sample_count: 5,
          partner_count: 3,
          last_reported_at: new Date('2026-08-03T09:00:00Z'),
        },
        // Cukup sampel, tetapi hanya satu mitra — ini pengumuman satu pembeli,
        // bukan informasi pasar.
        {
          grade: 'KERTAS_KARDUS',
          p25: 1200,
          median: 1260,
          p75: 1300,
          sample_count: 4,
          partner_count: 1,
          last_reported_at: new Date('2026-08-03T09:00:00Z'),
        },
        // Dua mitra, tetapi sampelnya kurang dari tiga.
        {
          grade: 'LOGAM_ALUMINIUM',
          p25: 9000,
          median: 9000,
          p75: 9000,
          sample_count: 2,
          partner_count: 2,
          last_reported_at: new Date('2026-08-03T09:00:00Z'),
        },
      ]);

      const board = await service.getPriceBoard({ region });

      expect(board.bands).toHaveLength(1);
      expect(board.bands[0]).toMatchObject({
        grade: 'PET_BOTOL_BENING',
        label: 'Botol plastik bening',
        p25: 2300,
        median: 2500,
        p75: 2701,
        sampleCount: 5,
        partnerCount: 3,
      });
      expect(board.insufficient).toEqual(['KERTAS_KARDUS', 'LOGAM_ALUMINIUM']);
    });

    it('memakai jendela 7 hari bila tidak ditentukan', async () => {
      const board = await service.getPriceBoard({ region });
      expect(board.windowDays).toBe(7);
      expect(board.region).toBe(region);
    });

    it('mengembalikan sebaran kosong saat belum ada data sama sekali', async () => {
      prisma.$queryRaw.mockResolvedValue([]);
      const board = await service.getPriceBoard({ region, windowDays: 30 });
      expect(board.bands).toEqual([]);
      expect(board.insufficient).toEqual([]);
      expect(board.windowDays).toBe(30);
    });
  });
});
