import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { CollectionDay, MaterialType } from '@bingo/shared-types';

export class CollectionScheduleQueryDto {
  @ApiPropertyOptional({ example: 'Duren Sawit, Jakarta Timur' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  region?: string;

  @ApiPropertyOptional({ enum: Object.values(MaterialType) })
  @IsOptional()
  @IsEnum(MaterialType)
  material?: MaterialType;

  @ApiPropertyOptional({ enum: Object.values(CollectionDay) })
  @IsOptional()
  @IsEnum(CollectionDay)
  day?: CollectionDay;
}
