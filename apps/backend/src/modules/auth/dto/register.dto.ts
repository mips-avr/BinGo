import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MinLength,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isValidNIK, normalizePhoneID } from '@bingo/shared-utils';
import { UserRole } from '@bingo/shared-types';

@ValidatorConstraint({ name: 'IsIndonesianPhone', async: false })
class IsIndonesianPhoneConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'string' && normalizePhoneID(value) !== null;
  }
  defaultMessage(_args: ValidationArguments): string {
    return 'Nomor telepon harus berformat Indonesia (contoh: 08123456789 atau +628123456789)';
  }
}

@ValidatorConstraint({ name: 'IsValidNIK', async: false })
class IsValidNIKConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (value === undefined || value === null || value === '') return true;
    return typeof value === 'string' && isValidNIK(value);
  }
  defaultMessage(_args: ValidationArguments): string {
    return 'NIK harus 16 digit angka dan memuat tanggal lahir yang valid';
  }
}

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

  @ApiProperty({ enum: ['CITIZEN', 'WASTE_AGENT', 'MSME'] })
  @IsEnum(UserRole, { message: 'Peran tidak dikenali' })
  role!: UserRole;

  @ApiProperty({ example: '3174010101900001', required: false })
  @IsOptional()
  @IsString({ message: 'NIK harus berupa teks' })
  @Validate(IsValidNIKConstraint)
  nik?: string;
}
