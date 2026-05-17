import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import type { AuthResponse, JwtPayload, UserRole } from '@bingo/shared-types';
import { normalizePhoneID } from '@bingo/shared-utils';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const BCRYPT_COST = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const phone = normalizePhoneID(dto.phone);
    if (!phone) {
      throw new BadRequestException('Nomor telepon tidak valid');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);

    const user = await this.users.create({
      name: dto.name.trim(),
      phone,
      passwordHash,
      role: dto.role,
      nik: dto.nik?.trim() || null,
    });

    return this.buildAuthResponse(user.id, user.role as UserRole, this.users.toProfile(user));
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const phone = normalizePhoneID(dto.phone);
    if (!phone) {
      throw new UnauthorizedException('Nomor telepon atau kata sandi salah');
    }

    const user = await this.users.findByPhone(phone);
    if (!user) {
      // Sengaja pakai pesan generik agar tidak membocorkan keberadaan akun.
      throw new UnauthorizedException('Nomor telepon atau kata sandi salah');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Nomor telepon atau kata sandi salah');
    }

    return this.buildAuthResponse(user.id, user.role as UserRole, this.users.toProfile(user));
  }

  /**
   * Dipakai oleh `JwtStrategy.validate()` untuk memastikan user masih ada
   * di database (mencegah token milik akun yang sudah dihapus).
   */
  async validateJwtPayload(payload: JwtPayload): Promise<{ id: string; role: UserRole }> {
    const user = await this.users.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Token tidak valid atau sudah kedaluwarsa');
    }
    return { id: user.id, role: user.role as UserRole };
  }

  private buildAuthResponse(
    userId: string,
    role: UserRole,
    profile: AuthResponse['user'],
  ): AuthResponse {
    const payload: JwtPayload = { sub: userId, role };
    const accessToken = this.jwt.sign(payload);
    const expiresInSeconds = this.parseExpiresInToSeconds(
      this.config.get<string>('JWT_EXPIRES_IN') ?? '7d',
    );

    return {
      user: profile,
      token: { accessToken, expiresIn: expiresInSeconds },
    };
  }

  /** Konversi format ekspresi waktu ('7d', '12h', '3600') ke detik. */
  private parseExpiresInToSeconds(value: string): number {
    const match = value.match(/^(\d+)([smhdw])?$/);
    if (!match) return 0;
    const n = Number(match[1]);
    const unit = match[2] ?? 's';
    const multiplier: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400, w: 604800 };
    return n * (multiplier[unit] ?? 1);
  }
}
