import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UsersService } from '../users.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(UsersService);
  });

  describe('create', () => {
    it('membuat user baru ketika telepon & NIK belum dipakai', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null); // findByPhone
      prisma.user.findUnique.mockResolvedValueOnce(null); // findByNik
      prisma.user.create.mockResolvedValue({
        id: 'u1',
        name: 'Budi',
        phone: '+628123456789',
        passwordHash: 'hash',
        role: 'CITIZEN',
        nik: '3174010101900001',
        pointsBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const user = await service.create({
        name: 'Budi',
        phone: '+628123456789',
        passwordHash: 'hash',
        role: 'CITIZEN',
        nik: '3174010101900001',
      });

      expect(user.id).toBe('u1');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'Budi',
          phone: '+628123456789',
          passwordHash: 'hash',
          role: 'CITIZEN',
          nik: '3174010101900001',
        },
      });
    });

    it('menolak bila nomor telepon sudah terdaftar', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ id: 'existing' });
      await expect(
        service.create({
          name: 'Budi',
          phone: '+628123456789',
          passwordHash: 'hash',
          role: 'CITIZEN',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('menolak bila NIK sudah terdaftar', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null); // phone bebas
      prisma.user.findUnique.mockResolvedValueOnce({ id: 'existing' }); // NIK bentrok
      await expect(
        service.create({
          name: 'Budi',
          phone: '+628123456789',
          passwordHash: 'hash',
          role: 'CITIZEN',
          nik: '3174010101900001',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('getProfileOrThrow', () => {
    it('mengembalikan profile publik tanpa passwordHash', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        name: 'Budi',
        phone: '+628123456789',
        passwordHash: 'rahasia',
        role: 'CITIZEN',
        nik: null,
        pointsBalance: 25,
        createdAt: new Date('2026-05-17T00:00:00Z'),
        updatedAt: new Date('2026-05-17T00:00:00Z'),
      });

      const profile = await service.getProfileOrThrow('u1');
      expect(profile).toEqual({
        id: 'u1',
        nik: null,
        name: 'Budi',
        phone: '+628123456789',
        role: 'CITIZEN',
        pointsBalance: 25,
        createdAt: '2026-05-17T00:00:00.000Z',
      });
      expect(profile as unknown as { passwordHash?: string }).not.toHaveProperty('passwordHash');
    });

    it('melempar NotFound bila user tidak ada', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getProfileOrThrow('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
