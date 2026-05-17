import { ApiProperty } from '@nestjs/swagger';
import { IsLatitude, IsLongitude } from 'class-validator';

/**
 * Pasangan koordinat WGS84.
 * Validasi rentang lat/lng dilakukan oleh class-validator + DB CHECK.
 */
export class LatLngDto {
  @ApiProperty({ example: -6.1944, description: 'Latitude WGS84 (-90..90)' })
  @IsLatitude({ message: 'Latitude tidak valid' })
  lat!: number;

  @ApiProperty({ example: 106.8229, description: 'Longitude WGS84 (-180..180)' })
  @IsLongitude({ message: 'Longitude tidak valid' })
  lng!: number;
}
