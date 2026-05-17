import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Max,
  ValidateNested,
} from 'class-validator';
import { MaterialType } from '@bingo/shared-types';
import { LatLngDto } from './lat-lng.dto';

export class CreatePickupDto {
  @ApiProperty({ type: LatLngDto })
  @IsObject({ message: 'Lokasi wajib diisi' })
  @ValidateNested()
  @Type(() => LatLngDto)
  location!: LatLngDto;

  @ApiProperty({ example: 'Jl. Sudirman No. 1, Jakarta Pusat' })
  @IsString({ message: 'Alamat harus berupa teks' })
  @Length(3, 255, { message: 'Alamat minimal 3 dan maksimal 255 karakter' })
  address!: string;

  @ApiProperty({ enum: Object.values(MaterialType) })
  @IsEnum(MaterialType, { message: 'Jenis material tidak dikenali' })
  materialType!: MaterialType;

  @ApiProperty({ example: 2.5, description: 'Estimasi berat dalam kilogram' })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Estimasi berat harus berupa angka' })
  @IsPositive({ message: 'Estimasi berat harus lebih dari 0' })
  @Max(9999.99, { message: 'Estimasi berat maksimal 9999.99 kg' })
  estimatedWeightKg!: number;

  @ApiProperty({ required: false, example: 'Pagar warna hijau, dekat warung Bu Lia' })
  @IsOptional()
  @IsString({ message: 'Catatan harus berupa teks' })
  @Length(0, 500, { message: 'Catatan maksimal 500 karakter' })
  notes?: string;
}
