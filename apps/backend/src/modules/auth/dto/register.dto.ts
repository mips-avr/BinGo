import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  Length,
  MinLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { normalizePhoneID } from '@bingo/shared-utils';
import { UserRole } from '@bingo/shared-types';

@ValidatorConstraint({ name: 'IsIndonesianPhone', async: false })
class IsIndonesianPhoneConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'string' && normalizePhoneID(value) !== null;
  }
  defaultMessage(): string {
    return 'Nomor telepon harus berformat Indonesia (contoh: 08123456789 atau +628123456789)';
  }
}

/**
 * Pendaftaran BinGo.
 *
 * Sengaja tidak ada field NIK. Pendaftaran hanya memerlukan nama panggilan,
 * nomor telepon, dan kata sandi — yaitu Tingkat 0 "Terdaftar" pada verifikasi
 * berjenjang. Akuntabilitas pemulung dibangun setelahnya lewat penjaminan
 * mitra (lihat modul agent-verifications), bukan lewat nomor kependudukan yang
 * tidak dapat dicocokkan ke sumber resmi mana pun.
 */
export class RegisterDto {
  @ApiProperty({ example: 'Budi Santoso', minLength: 2, maxLength: 120 })
  @IsString({ message: 'Nama harus berupa teks' })
  @Length(2, 120, { message: 'Nama minimal 2 dan maksimal 120 karakter' })
  name!: string;

  @ApiProperty({ example: '08123456789' })
  @IsString({ message: 'Nomor telepon harus berupa teks' })
  @Validate(IsIndonesianPhoneConstraint)
  @Transform(({ value }) =>
    typeof value === 'string' ? (normalizePhoneID(value) ?? value) : value,
  )
  phone!: string;

  @ApiProperty({ example: 'rahasiaSekali123', minLength: 8 })
  @IsString({ message: 'Kata sandi harus berupa teks' })
  @MinLength(8, { message: 'Kata sandi minimal 8 karakter' })
  password!: string;

  @ApiProperty({ enum: ['HOUSEHOLD', 'MANAGER_ADMIN', 'BUSINESS_BUYER'] })
  @IsEnum(UserRole, { message: 'Peran tidak dikenali' })
  @IsIn(['HOUSEHOLD', 'MANAGER_ADMIN', 'BUSINESS_BUYER'], {
    message: 'Pendaftaran publik hanya tersedia untuk Warga, Pengelola, dan Business',
  })
  role!: UserRole;

  @ApiProperty({ required: false, example: 'Pengelola Sirkular RW 08' })
  @IsOptional()
  @IsString()
  @Length(3, 180)
  organizationName?: string;
}
