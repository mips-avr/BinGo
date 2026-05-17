import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsLatitude, IsLongitude, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { ReportStatus } from '@bingo/shared-types';

export class ListReportsQueryDto {
  @ApiPropertyOptional({ enum: Object.values(ReportStatus) })
  @IsOptional()
  @IsEnum(ReportStatus, { message: 'Status tidak dikenali' })
  status?: ReportStatus;

  @ApiPropertyOptional({ description: 'Pusat radius pencarian (opsional)' })
  @IsOptional()
  @Type(() => Number)
  @IsLatitude({ message: 'Latitude tidak valid' })
  lat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsLongitude({ message: 'Longitude tidak valid' })
  lng?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Radius harus berupa angka' })
  @Min(0.1)
  @Max(50)
  radiusKm?: number;
}
