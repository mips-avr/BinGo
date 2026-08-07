import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsLatitude, IsLongitude, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { MaterialType } from '@bingo/shared-types';

/**
 * Query radar pemulung.
 *
 * Berbeda dari `/nearby` yang sekadar mengembalikan daftar terdekat, radar
 * dipakai saat pemulung sedang di jalan: ia menyaring pekerjaan yang memang
 * sanggup diangkut (jenis material dan berat minimum) lalu memberi arah, bukan
 * hanya jarak.
 */
export class RadarQueryDto {
  @ApiProperty({ example: -6.1944, description: 'Posisi pemulung saat ini (latitude)' })
  @Type(() => Number)
  @IsLatitude({ message: 'Latitude tidak valid' })
  lat!: number;

  @ApiProperty({ example: 106.8229, description: 'Posisi pemulung saat ini (longitude)' })
  @Type(() => Number)
  @IsLongitude({ message: 'Longitude tidak valid' })
  lng!: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Radius pencarian dalam kilometer (default 5, maks 25)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Radius harus berupa angka' })
  @Min(0.1, { message: 'Radius minimal 0.1 km' })
  @Max(25, { message: 'Radius maksimal 25 km' })
  radiusKm?: number = 5;

  @ApiPropertyOptional({
    enum: Object.values(MaterialType),
    description: 'Saring menurut jenis material yang ingin diangkut',
  })
  @IsOptional()
  @IsEnum(MaterialType, { message: 'Jenis material tidak dikenali' })
  materialType?: MaterialType;

  @ApiPropertyOptional({
    example: 3,
    description:
      'Hanya tampilkan permintaan dengan estimasi berat minimal sekian kilogram. Berguna agar perjalanan jauh tidak dihabiskan untuk satu kilogram material.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Berat minimum harus berupa angka' })
  @Min(0, { message: 'Berat minimum tidak boleh negatif' })
  @Max(9999.99, { message: 'Berat minimum maksimal 9999.99 kg' })
  minWeightKg?: number;
}
