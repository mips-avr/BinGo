import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PickupRequestsService } from '../pickup-requests.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { PointsService } from '../../points/points.service';

function pickupRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'p1',
    citizenId: 'c1',
    agentId: null,
    status: 'PENDING',
    lat: -6.2,
    lng: 106.8,
    location: null,
    address: 'Jl. Test',
    materialType: 'PET',
    estimatedWeightKg: new Prisma.Decimal(2.5),
    notes: null,
    createdAt: new Date('2026-05-17T00:00:00Z'),
    updatedAt: new Date('2026-05-17T00:00:00Z'),
    ...overrides,
  } as never;
}

describe('PickupRequestsService', () => {
  let service: PickupRequestsService;
  let prisma: {
    pickupRequest: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      updateMany: jest.Mock;
      update: jest.Mock;
    };
    $queryRaw: jest.Mock;
    $transaction: jest.Mock;
  };
  let points: { award: jest.Mock };

  beforeEach(async () => {
    prisma = {
      pickupRequest: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
      $queryRaw: jest.fn(),
      // Default $transaction: jalankan callback dengan tx mock minimal.
      // Test individu yang butuh perilaku khusus akan menimpa lewat
      // `prisma.$transaction.mockImplementationOnce`.
      $transaction: jest.fn(async (fn: (tx: unknown) => unknown) =>
        fn({
          pickupRequest: { update: jest.fn().mockResolvedValue(pickupRow()) },
          user: { update: jest.fn() },
        }),
      ),
    };
    points = { award: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PickupRequestsService,
        { provide: PrismaService, useValue: prisma },
        { provide: PointsService, useValue: points },
      ],
    }).compile();
    service = moduleRef.get(PickupRequestsService);
  });

  describe('createForCitizen', () => {
    it('menyimpan lat/lng & mengembalikan DTO ber-location', async () => {
      prisma.pickupRequest.create.mockResolvedValue(pickupRow({ id: 'new1' }));
      const dto = await service.createForCitizen('c1', {
        location: { lat: -6.2, lng: 106.8 },
        address: 'Jl. Test',
        materialType: 'PET' as never,
        estimatedWeightKg: 2.5,
      });
      expect(prisma.pickupRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          citizenId: 'c1',
          lat: -6.2,
          lng: 106.8,
          address: 'Jl. Test',
          materialType: 'PET',
        }),
      });
      expect(dto.location).toEqual({ lat: -6.2, lng: 106.8 });
      expect(dto.estimatedWeightKg).toBe(2.5);
    });
  });

  describe('findNearby', () => {
    it('mengonversi baris raw query menjadi DTO + distanceMeters', async () => {
      prisma.$queryRaw.mockResolvedValue([
        {
          id: 'p1',
          citizen_id: 'c1',
          agent_id: null,
          status: 'PENDING',
          lat: -6.2,
          lng: 106.8,
          address: 'Jl. Test',
          material_type: 'PET',
          estimated_weight_kg: new Prisma.Decimal(2.5),
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
          distance_m: 1234.567,
        },
      ]);
      const res = await service.findNearby({ lat: -6.2, lng: 106.8, radiusKm: 5 });
      expect(res).toHaveLength(1);
      expect(res[0]?.distanceMeters).toBe(1234.6);
      expect(res[0]?.location).toEqual({ lat: -6.2, lng: 106.8 });
    });
  });

  describe('accept', () => {
    it('berhasil ketika status masih PENDING', async () => {
      prisma.pickupRequest.updateMany.mockResolvedValue({ count: 1 });
      prisma.pickupRequest.findUniqueOrThrow.mockResolvedValue(
        pickupRow({ agentId: 'a1', status: 'ACCEPTED' }),
      );
      const res = await service.accept('p1', 'a1');
      expect(res.agentId).toBe('a1');
      expect(res.status).toBe('ACCEPTED');
    });

    it('melempar NotFound bila request sudah diambil agen lain', async () => {
      prisma.pickupRequest.updateMany.mockResolvedValue({ count: 0 });
      await expect(service.accept('p1', 'a1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('complete', () => {
    it('hanya agen pemilik pekerjaan yang boleh menyelesaikan', async () => {
      prisma.pickupRequest.findUnique.mockResolvedValue(
        pickupRow({ status: 'ACCEPTED', agentId: 'a-other' }),
      );
      await expect(service.complete('p1', 'a1')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('memberi poin & mengubah status menjadi COMPLETED', async () => {
      prisma.pickupRequest.findUnique.mockResolvedValue(
        pickupRow({ status: 'ACCEPTED', agentId: 'a1' }),
      );
      prisma.$transaction.mockImplementationOnce(async (fn: (tx: unknown) => unknown) => {
        const tx = {
          pickupRequest: {
            update: jest.fn().mockResolvedValue(pickupRow({ status: 'COMPLETED', agentId: 'a1' })),
          },
        };
        return fn(tx);
      });

      const res = await service.complete('p1', 'a1');
      expect(res.status).toBe('COMPLETED');
      expect(points.award).toHaveBeenCalledWith('c1', 'PICKUP_COMPLETED', undefined, expect.anything());
    });

    it('menolak menyelesaikan request yang sudah dibatalkan', async () => {
      prisma.pickupRequest.findUnique.mockResolvedValue(
        pickupRow({ status: 'CANCELLED', agentId: 'a1' }),
      );
      await expect(service.complete('p1', 'a1')).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('cancelByCitizen', () => {
    it('menolak bila bukan pemilik', async () => {
      prisma.pickupRequest.findUnique.mockResolvedValue(pickupRow({ citizenId: 'lain' }));
      await expect(service.cancelByCitizen('p1', 'c1')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('menolak bila request sudah diterima', async () => {
      prisma.pickupRequest.findUnique.mockResolvedValue(
        pickupRow({ citizenId: 'c1', status: 'ACCEPTED' }),
      );
      await expect(service.cancelByCitizen('p1', 'c1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('berhasil membatalkan saat masih PENDING', async () => {
      prisma.pickupRequest.findUnique.mockResolvedValue(pickupRow({ citizenId: 'c1' }));
      prisma.pickupRequest.update.mockResolvedValue(pickupRow({ status: 'CANCELLED' }));
      const res = await service.cancelByCitizen('p1', 'c1');
      expect(res.status).toBe('CANCELLED');
    });
  });

  describe('getByIdForUser', () => {
    it('warga hanya boleh melihat miliknya', async () => {
      prisma.pickupRequest.findUnique.mockResolvedValue(pickupRow({ citizenId: 'lain' }));
      await expect(
        service.getByIdForUser('p1', { id: 'c1', role: 'CITIZEN' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('agen boleh melihat request PENDING (calon pekerjaan)', async () => {
      prisma.pickupRequest.findUnique.mockResolvedValue(pickupRow({ status: 'PENDING' }));
      const res = await service.getByIdForUser('p1', { id: 'a1', role: 'WASTE_AGENT' });
      expect(res.id).toBe('p1');
    });

    it('agen TIDAK boleh melihat pekerjaan agen lain yang sudah ACCEPTED', async () => {
      prisma.pickupRequest.findUnique.mockResolvedValue(
        pickupRow({ status: 'ACCEPTED', agentId: 'a-other' }),
      );
      await expect(
        service.getByIdForUser('p1', { id: 'a1', role: 'WASTE_AGENT' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
