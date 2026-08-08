import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class IssueMemberCardDto {
  @ApiProperty({ example: 'Pak Slamet' })
  @IsString()
  @Length(2, 120, { message: 'Nama pemegang kartu 2–120 karakter' })
  holderName!: string;

  /**
   * Opsional, dan itu inti dari fitur ini.
   *
   * Kartu diterbitkan justru untuk orang yang belum punya ponsel. Menjadikan
   * nomor telepon wajib akan mengembalikan tepat penghalang yang hendak
   * dihilangkan.
   */
  @ApiPropertyOptional({ example: '+6281234567890' })
  @IsOptional()
  @Matches(/^\+62\d{8,13}$/, { message: 'Nomor telepon harus format +62…' })
  holderPhone?: string;

  @ApiProperty({ example: 'Kecamatan Beji, Depok' })
  @IsString()
  @Length(3, 120, { message: 'Wilayah 3–120 karakter' })
  region!: string;

  /**
   * UID chip NFC, heksadesimal. Opsional supaya kartu boleh dicetak dan
   * didaftarkan lebih dulu, lalu dipasangkan ke chip ketika kartunya tiba.
   */
  @ApiPropertyOptional({ example: '04A2B3C4D5E680' })
  @IsOptional()
  @Matches(/^[0-9A-Fa-f]{8,32}$/, { message: 'UID kartu harus heksadesimal 8–32 karakter' })
  cardUid?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 500)
  note?: string;
}
