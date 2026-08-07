import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

/**
 * Pengajuan penjaminan oleh pemulung kepada satu mitra terdaftar.
 *
 * Mitra dikenali lewat nomor teleponnya, bukan lewat nama yang diketik bebas.
 * Nama bebas berarti pemulung dapat mengetik "Bank Sampah Melati" tanpa pihak
 * mana pun di Bank Sampah Melati pernah tahu, dan penjaminan berubah menjadi
 * pengakuan sepihak — persis kelemahan yang hendak dihindari mekanisme ini.
 */
export class RequestAttestationDto {
  @ApiProperty({ example: '081234500021', description: 'Nomor telepon akun operator mitra' })
  @IsString({ message: 'Nomor telepon mitra harus berupa teks' })
  attestorPhone!: string;

  @ApiPropertyOptional({ example: 'Saya menyetor ke lapak ini sejak 2024.' })
  @IsOptional()
  @IsString({ message: 'Catatan harus berupa teks' })
  @Length(0, 500, { message: 'Catatan maksimal 500 karakter' })
  note?: string;
}
