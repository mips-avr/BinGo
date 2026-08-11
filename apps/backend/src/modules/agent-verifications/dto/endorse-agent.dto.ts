import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

/** Rekomendasi seorang pemulung Tingkat 2 kepada pemulung lain. */
export class EndorseAgentDto {
  @ApiProperty({
    example: '081234500022',
    description: 'Nomor telepon pemulung yang direkomendasikan',
  })
  @IsString({ message: 'Nomor telepon pemulung harus berupa teks' })
  agentPhone!: string;

  @ApiPropertyOptional({ example: 'Sudah lima tahun satu wilayah, tidak pernah bermasalah.' })
  @IsOptional()
  @IsString({ message: 'Catatan harus berupa teks' })
  @Length(0, 500, { message: 'Catatan maksimal 500 karakter' })
  note?: string;
}
