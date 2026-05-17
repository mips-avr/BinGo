import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ReportsService, VERIFICATION_THRESHOLD } from '../reports.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { PointsService } from '../../points/points.service';

function reportRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'r1',
    citizenId: 'c1',
    status: 'DILAPORKAN',
    lat: -6.2,
    lng: 106.8,
    location: null,
    description: null,
    imageUrl: 'https://cdn.bingo.id/test.jpg',
    verificationCount: 0,
    createdAt: new Date('2026-05-17T00:00:00Z'),
    updatedAt: new Date('2026-05-17T00:00:00Z'),
    ...overrides,
  } as never;
}

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: {
    report: { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
    $transaction: jest.Mock;
  };
  let points: { award: jest.Mock };

  beforeEach(async () => {
    prisma = {
      report: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
      $transaction: jest.fn(),
    };
    points = { award: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: prisma },
        { provide: PointsService, useValue: points },
      ],
    }).compile();
    service = moduleRef.get(ReportsService);
  });

  describe('create', () => {
    it('menyimpan laporan dengan koordinat & image URL', async () => {
      prisma.report.create.mockResolvedValue(reportRow());
      const dto = await service.create('c1', {
        location: { lat: -6.2, lng: 106.8 },
        imageUrl: 'https://cdn.bingo.id/test.jpg',
      });
      expect(dto.imageUrl).toContain('cdn.bingo.id');
      expect(dto.status).toBe('DILAPORKAN');
    });
  });

  describe('verify', () => {
    it('menolak verifikasi laporan milik sendiri', async () => {
      prisma.report.findUnique.mockResolvedValue(reportRow({ citizenId: 'me' }));
      await expect(
        service.verify('r1', { id: 'me', role: 'CITIZEN' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('menolak verifikasi laporan SELESAI', async () => {
      prisma.report.findUnique.mockResolvedValue(reportRow({ status: 'SELESAI' }));
      await expect(
        service.verify('r1', { id: 'other', role: 'CITIZEN' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('hanya menaikkan counter saat di bawah threshold', async () => {
      prisma.report.findUnique.mockResolvedValue(reportRow({ verificationCount: 0 }));
      const txReport = { update: jest.fn() };
      txReport.update.mockResolvedValueOnce(reportRow({ verificationCount: 1 }));
      prisma.$transaction.mockImplementationOnce(async (fn: (tx: unknown) => unknown) =>
        fn({ report: txReport, user: { update: jest.fn() } }),
      );

      const res = await service.verify('r1', { id: 'other', role: 'CITIZEN' });
      expect(res.status).toBe('DILAPORKAN');
      expect(res.verificationCount).toBe(1);
      expect(points.award).not.toHaveBeenCalled();
    });

    it('menaikkan status ke DIVERIFIKASI & memberi poin pada threshold', async () => {
      prisma.report.findUnique.mockResolvedValue(reportRow({ verificationCount: VERIFICATION_THRESHOLD - 1 }));
      const txReport = { update: jest.fn() };
      txReport.update
        .mockResolvedValueOnce(reportRow({ verificationCount: VERIFICATION_THRESHOLD }))
        .mockResolvedValueOnce(reportRow({ status: 'DIVERIFIKASI', verificationCount: VERIFICATION_THRESHOLD }));
      prisma.$transaction.mockImplementationOnce(async (fn: (tx: unknown) => unknown) =>
        fn({ report: txReport, user: { update: jest.fn() } }),
      );

      const res = await service.verify('r1', { id: 'other', role: 'CITIZEN' });
      expect(res.status).toBe('DIVERIFIKASI');
      expect(points.award).toHaveBeenCalledWith('c1', 'REPORT_VERIFIED', undefined, expect.anything());
    });
  });

  describe('resolve', () => {
    it('menolak warga lain (bukan pembuat)', async () => {
      prisma.report.findUnique.mockResolvedValue(reportRow({ status: 'DIVERIFIKASI' }));
      await expect(
        service.resolve('r1', { id: 'other', role: 'CITIZEN' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('pemulung boleh menyelesaikan laporan diverifikasi', async () => {
      prisma.report.findUnique.mockResolvedValue(reportRow({ status: 'DIVERIFIKASI' }));
      prisma.report.update.mockResolvedValue(reportRow({ status: 'SELESAI' }));
      const res = await service.resolve('r1', { id: 'a1', role: 'WASTE_AGENT' });
      expect(res.status).toBe('SELESAI');
    });

    it('menolak resolve sebelum diverifikasi', async () => {
      prisma.report.findUnique.mockResolvedValue(reportRow({ status: 'DILAPORKAN' }));
      await expect(
        service.resolve('r1', { id: 'a1', role: 'WASTE_AGENT' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('melempar NotFound bila laporan tidak ada', async () => {
      prisma.report.findUnique.mockResolvedValue(null);
      await expect(
        service.resolve('r-missing', { id: 'a1', role: 'WASTE_AGENT' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
