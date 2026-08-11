import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import type { AgentVerificationStatus } from '@bingo/shared-types';
import { DECIDABLE_VERIFICATION_STATUSES } from '@bingo/shared-types';

/** Jawaban mitra atas satu pengajuan penjaminan. */
export class DecideAttestationDto {
  @ApiProperty({ enum: DECIDABLE_VERIFICATION_STATUSES as unknown as string[] })
  @IsIn(DECIDABLE_VERIFICATION_STATUSES as unknown as string[], {
    message: 'Status keputusan harus DISETUJUI, DITOLAK, atau DICABUT',
  })
  status!: AgentVerificationStatus;

  @ApiPropertyOptional({ example: 'Yang bersangkutan rutin menyetor sejak 2024.' })
  @IsOptional()
  @IsString({ message: 'Catatan harus berupa teks' })
  @Length(0, 500, { message: 'Catatan maksimal 500 karakter' })
  note?: string;
}
