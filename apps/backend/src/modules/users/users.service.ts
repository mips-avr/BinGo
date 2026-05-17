import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { User } from '@prisma/client';
import type { UserProfile, UserRole } from '@bingo/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateUserInput {
  name: string;
  phone: string;
  /** Hash password sudah harus dihitung oleh AuthService. */
  passwordHash: string;
  role: UserRole;
  nik?: string | null;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  async findByNik(nik: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { nik } });
  }

  /**
   * Membuat user baru. Akan melempar `ConflictException` (HTTP 409) bila
   * nomor telepon atau NIK sudah terdaftar.
   */
  async create(input: CreateUserInput): Promise<User> {
    const [existingPhone, existingNik] = await Promise.all([
      this.findByPhone(input.phone),
      input.nik ? this.findByNik(input.nik) : Promise.resolve(null),
    ]);
    if (existingPhone) {
      throw new ConflictException('Nomor telepon sudah terdaftar');
    }
    if (existingNik) {
      throw new ConflictException('NIK sudah terdaftar');
    }

    return this.prisma.user.create({
      data: {
        name: input.name,
        phone: input.phone,
        passwordHash: input.passwordHash,
        role: input.role,
        nik: input.nik ?? null,
      },
    });
  }

  async getProfileOrThrow(id: string): Promise<UserProfile> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan');
    }
    return this.toProfile(user);
  }

  /** Memetakan entitas Prisma ke DTO publik (tanpa passwordHash). */
  toProfile(user: User): UserProfile {
    return {
      id: user.id,
      nik: user.nik,
      name: user.name,
      phone: user.phone,
      role: user.role as UserRole,
      pointsBalance: user.pointsBalance,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
