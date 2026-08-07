import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { AuthResponse, UserProfile } from '@bingo/shared-types';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../common/types/authenticated-request';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

/**
 * Batas laju ketat untuk endpoint yang menjalankan bcrypt.
 *
 * Kata sandi di-hash dengan cost 12 — sekitar seperempat detik CPU untuk SATU
 * permintaan, dan itu memang disengaja agar tebakan kata sandi menjadi mahal
 * bagi penyerang. Efek sampingnya: endpoint ini juga mahal bagi server.
 * Beberapa puluh permintaan per detik ke `/auth/login` sudah cukup membuat
 * seluruh API tak responsif, tanpa perlu satu pun kredensial yang benar.
 * Batas ini menutup jalur tersebut sekaligus memperlambat penebakan kata sandi.
 *
 * Angkanya tidak dibuat sekecil mungkin. Batas ini berlaku per alamat IP,
 * sementara di Indonesia satu alamat IP publik kerap dipakai bersama oleh
 * seluruh kampung lewat CGNAT — dan justru begitulah BinGo diperkenalkan, satu
 * bank sampah mendaftarkan puluhan warga dalam satu sesi. Batas yang terlalu
 * ketat akan menghentikan acara pengenalan itu, bukan penyerangnya. Nilai di
 * bawah tetap memotong laju penyerang beberapa puluh kali lipat sambil
 * menyisakan ruang untuk pemakaian ramai-ramai yang wajar.
 */
const LOGIN_THROTTLE = { default: { limit: 10, ttl: 60_000 } };
const REGISTER_THROTTLE = { default: { limit: 20, ttl: 300_000 } };

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @Throttle(REGISTER_THROTTLE)
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({ description: 'Akun berhasil dibuat & token diterbitkan' })
  async register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(dto);
  }

  @Public()
  @Throttle(LOGIN_THROTTLE)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ description: 'Berhasil masuk, token JWT diterbitkan' })
  async login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOkResponse({ description: 'Profil pengguna yang sedang login' })
  async me(@CurrentUser() user: AuthenticatedUser): Promise<UserProfile> {
    return this.usersService.getProfileOrThrow(user.id);
  }
}
