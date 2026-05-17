import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude, IsNumber, IsOptional, Max, Min } from 'class-validator';

/**
 * Query untuk endpoint "permintaan terdekat" — dipakai oleh aplikasi pemulung
 * untuk memuat marker di peta. Radius default 5 km, maksimum 25 km.
 */
export class NearbyQueryDto {
  @ApiProperty({ example: -6.1944 })
  @Type(() => Number)
  @IsLatitude({ message: 'Latitude tidak valid' })
  lat!: number;

  @ApiProperty({ example: 106.8229 })
  @Type(() => Number)
  @IsLongitude({ message: 'Longitude tidak valid' })
  lng!: number;

  @ApiPropertyOptional({ example: 5, description: 'Radius pencarian dalam kilometer (default 5, maks 25)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Radius harus berupa angka' })
  @Min(0.1, { message: 'Radius minimal 0.1 km' })
  @Max(25, { message: 'Radius maksimal 25 km' })
  radiusKm?: number = 5;
}
