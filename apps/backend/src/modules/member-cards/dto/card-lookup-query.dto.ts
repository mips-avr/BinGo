import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

/**
 * Dua jalur pencarian, dan keduanya memang perlu ada.
 *
 * `uid` adalah jalur normal: kartu ditempel, selesai. `cardNumber` adalah jalur
 * yang menyelamatkan konter ketika NFC gagal — chip rusak, ponsel petugas tidak
 * membaca, kartu tertinggal dan pemiliknya hafal nomornya. Tanpa jalur kedua,
 * satu chip rusak berarti seseorang tidak bisa menjual hari itu.
 */
export class CardLookupQueryDto {
  @ApiPropertyOptional({ example: '04A2B3C4D5E680' })
  @IsOptional()
  @Matches(/^[0-9A-Fa-f]{8,32}$/, { message: 'UID kartu harus heksadesimal 8–32 karakter' })
  uid?: string;

  @ApiPropertyOptional({ example: 'BG-7K2M-9XQ4' })
  @IsOptional()
  @IsString()
  @Length(8, 16, { message: 'Nomor kartu tidak valid' })
  cardNumber?: string;
}
