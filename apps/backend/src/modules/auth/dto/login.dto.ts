import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';
import { normalizePhoneID } from '@bingo/shared-utils';

export class LoginDto {
  @ApiProperty({ example: '08123456789' })
  @IsString({ message: 'Nomor telepon harus berupa teks' })
  @Transform(({ value }) =>
    typeof value === 'string' ? (normalizePhoneID(value) ?? value) : value,
  )
  phone!: string;

  @ApiProperty({ example: 'rahasiaSekali123', minLength: 8 })
  @IsString({ message: 'Kata sandi harus berupa teks' })
  @MinLength(8, { message: 'Kata sandi minimal 8 karakter' })
  password!: string;
}
