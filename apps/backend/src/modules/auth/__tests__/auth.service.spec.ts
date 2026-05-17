import { Test } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let users: jest.Mocked<Pick<UsersService, 'create' | 'findByPhone' | 'findById' | 'toProfile'>>;
  let jwt: { sign: jest.Mock };
  let config: { get: jest.Mock };

  beforeEach(async () => {
    users = {
      create: jest.fn(),
      findByPhone: jest.fn(),
      findById: jest.fn(),
      toProfile: jest.fn().mockImplementation((u) => ({
        id: u.id,
        nik: u.nik ?? null,
        name: u.name,
        phone: u.phone,
        role: u.role,
        pointsBalance: u.pointsBalance ?? 0,
        createdAt: (u.createdAt ?? new Date()).toISOString?.() ?? new Date().toISOString(),
      })),
    } as never;
    jwt = { sign: jest.fn().mockReturnValue('signed.jwt.token') };
    config = { get: jest.fn().mockReturnValue('7d') };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: users },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    service = moduleRef.get(AuthService);

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_pw');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  describe('register', () => {
    it('menormalkan telepon, mem-hash password, dan menerbitkan token', async () => {
      users.create.mockResolvedValue({
        id: 'u1',
        name: 'Budi',
        phone: '+628123456789',
        passwordHash: 'hashed_pw',
        role: 'CITIZEN',
        nik: null,
        pointsBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      const res = await service.register({
        name: 'Budi',
        phone: '08123456789',
        password: 'rahasia123',
        role: 'CITIZEN',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('rahasia123', 12);
      expect(users.create).toHaveBeenCalledWith(
        expect.objectContaining({ phone: '+628123456789', passwordHash: 'hashed_pw' }),
      );
      expect(res.token.accessToken).toBe('signed.jwt.token');
      expect(res.token.expiresIn).toBe(7 * 86400);
      expect(res.user.id).toBe('u1');
    });

    it('menolak telepon dengan format aneh', async () => {
      await expect(
        service.register({
          name: 'Budi',
          phone: 'tidak-valid',
          password: 'rahasia123',
          role: 'CITIZEN',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('login', () => {
    it('menolak ketika user tidak ditemukan (pesan generik)', async () => {
      users.findByPhone.mockResolvedValue(null);
      await expect(
        service.login({ phone: '+628123456789', password: 'rahasia123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('menolak ketika password salah', async () => {
      users.findByPhone.mockResolvedValue({
        id: 'u1',
        passwordHash: 'hash',
        role: 'CITIZEN',
      } as never);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
      await expect(
        service.login({ phone: '+628123456789', password: 'salah' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('menerbitkan token saat kredensial benar', async () => {
      users.findByPhone.mockResolvedValue({
        id: 'u1',
        name: 'Budi',
        phone: '+628123456789',
        passwordHash: 'hashed',
        role: 'WASTE_AGENT',
        nik: null,
        pointsBalance: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      const res = await service.login({ phone: '08123456789', password: 'rahasia123' });
      expect(res.user.role).toBe('WASTE_AGENT');
      expect(res.token.accessToken).toBe('signed.jwt.token');
      expect(jwt.sign).toHaveBeenCalledWith({ sub: 'u1', role: 'WASTE_AGENT' });
    });
  });

  describe('validateJwtPayload', () => {
    it('melempar 401 ketika user di token sudah tidak ada', async () => {
      users.findById.mockResolvedValue(null);
      await expect(
        service.validateJwtPayload({ sub: 'u404', role: 'CITIZEN' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('mengembalikan id+role saat user valid', async () => {
      users.findById.mockResolvedValue({ id: 'u1', role: 'MSME' } as never);
      const res = await service.validateJwtPayload({ sub: 'u1', role: 'MSME' });
      expect(res).toEqual({ id: 'u1', role: 'MSME' });
    });
  });
});
