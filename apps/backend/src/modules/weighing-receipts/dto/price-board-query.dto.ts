import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { MaterialGrade } from '@bingo/shared-types';

export class PriceBoardQueryDto {
  @ApiProperty({
    example: 'Kecamatan Beji, Depok',
    description:
      'Wilayah papan harga; ejaan bebas karena dinormalkan menjadi regionKey di server. Tidak ada papan harga nasional.',
  })
  @IsString({ message: 'Wilayah harus berupa teks' })
  @Length(3, 120, { message: 'Wilayah minimal 3 dan maksimal 120 karakter' })
  region!: string;

  @ApiPropertyOptional({
    enum: Object.values(MaterialGrade),
    description: 'Bila diisi, papan hanya memuat sebaran harga untuk satu grade ini.',
  })
  @IsOptional()
  @IsEnum(MaterialGrade, { message: 'Grade material tidak dikenali' })
  grade?: MaterialGrade;

  @ApiProperty({
    required: false,
    default: 7,
    description:
      'Jendela kesegaran data dalam hari. Bukti timbang yang lebih tua tidak dihitung sebagai harga berlaku.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Jendela hari harus berupa bilangan bulat' })
  @Min(1, { message: 'Jendela hari minimal 1' })
  @Max(90, { message: 'Jendela hari maksimal 90' })
  windowDays?: number;
}
