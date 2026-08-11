import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsLatitude, IsLongitude, IsNumber, IsOptional, Max, Min } from 'class-validator';

import { MAX_DROP_POINT_RADIUS_KM } from '@bingo/shared-types';

/** Nilai enum MaterialType, disalin agar validator tidak bergantung pada Prisma. */
const MATERIAL_TYPES = [
  'PET',
  'HDPE',
  'PVC',
  'LDPE',
  'PP',
  'PS',
  'OTHER_PLASTIC',
  'PAPER',
  'METAL',
  'GLASS',
  'ORGANIC',
  'MIXED',
] as const;

export class NearbyDropPointQueryDto {
  @ApiProperty({ example: -6.2088 })
  @Type(() => Number)
  @IsLatitude({ message: 'Latitude tidak valid' })
  lat!: number;

  @ApiProperty({ example: 106.8456 })
  @Type(() => Number)
  @IsLongitude({ message: 'Longitude tidak valid' })
  lng!: number;

  @ApiPropertyOptional({ example: 5, minimum: 0.5, maximum: MAX_DROP_POINT_RADIUS_KM })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Radius harus berupa angka' })
  @Min(0.5, { message: 'Radius minimum 0,5 km' })
  @Max(MAX_DROP_POINT_RADIUS_KM, { message: `Radius maksimum ${MAX_DROP_POINT_RADIUS_KM} km` })
  radiusKm?: number;

  @ApiPropertyOptional({ enum: MATERIAL_TYPES })
  @IsOptional()
  @IsEnum(MATERIAL_TYPES, { message: 'Jenis material tidak dikenal' })
  material?: (typeof MATERIAL_TYPES)[number];
}
