import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsObject, IsOptional, IsString, IsUrl, Length, ValidateNested } from 'class-validator';
import { LatLngDto } from '../../pickup-requests/dto/lat-lng.dto';

export class CreateReportDto {
  @ApiProperty({ type: LatLngDto })
  @IsObject({ message: 'Lokasi wajib diisi' })
  @ValidateNested()
  @Type(() => LatLngDto)
  location!: LatLngDto;

  @ApiProperty({ example: 'https://cdn.bingo.id/reports/abc123.jpg' })
  @IsUrl({ require_protocol: true }, { message: 'URL foto harus URL valid (https://...)' })
  @Length(8, 512, { message: 'URL foto maksimal 512 karakter' })
  imageUrl!: string;

  @ApiPropertyOptional({ example: 'Tumpukan sampah di pinggir kali, sudah berhari-hari' })
  @IsOptional()
  @IsString({ message: 'Deskripsi harus berupa teks' })
  @Length(0, 1000, { message: 'Deskripsi maksimal 1000 karakter' })
  description?: string;
}
