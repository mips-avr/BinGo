import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { User } from '@prisma/client';
import type { UserProfile, UserRole, VerificationLevel } from '@bingo/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateUserInput {
  name: string;
  phone: string;
  /** Hash password sudah harus dihitung oleh AuthService. */
  passwordHash: string;
  role: UserRole;
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

  /**
   * Membuat user baru. Akan melempar `ConflictException` (HTTP 409) bila
   * nomor telepon sudah terdaftar.
   *
   * Nomor telepon adalah satu-satunya pengenal unik yang diminta. Tidak ada
   * pemeriksaan NIK karena tidak ada NIK yang disimpan: setiap akun baru mulai
   * dari Tingkat 0 dan naik lewat penjaminan mitra.
   */
  async create(input: CreateUserInput): Promise<User> {
    const existingPhone = await this.findByPhone(input.phone);
    if (existingPhone) {
      throw new ConflictException('Nomor telepon sudah terdaftar');
    }

    return this.prisma.user.create({
      data: {
        name: input.name,
        phone: input.phone,
        passwordHash: input.passwordHash,
        role: input.role,
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
      name: user.name,
      phone: user.phone,
      role: user.role as UserRole,
      pointsBalance: user.pointsBalance,
      // `?? 0` menjaga profil tetap terbentuk pada baris lama yang belum
      // memiliki kolom ini — tingkat 0 adalah nilai yang aman: tidak memberi
      // satu pun izin tambahan.
      verificationLevel: (user.verificationLevel ?? 0) as VerificationLevel,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
