import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { MaterialGrade } from '@bingo/shared-types';

export class CreateWeighingLineDto {
  @ApiProperty({ enum: Object.values(MaterialGrade), example: MaterialGrade.PET_BOTOL_BENING })
  @IsEnum(MaterialGrade, { message: 'Grade material tidak dikenali' })
  grade!: MaterialGrade;

  @ApiProperty({ example: 12.5, description: 'Berat kotor hasil timbang dalam kilogram' })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Berat harus berupa angka maksimal 2 desimal' })
  @IsPositive({ message: 'Berat harus lebih dari 0' })
  @Max(99999.99, { message: 'Berat maksimal 99999.99 kg' })
  weightKg!: number;

  @ApiProperty({ example: 2500, description: 'Harga per kilogram dalam Rupiah' })
  @IsInt({ message: 'Harga per kg harus berupa bilangan bulat Rupiah' })
  @Min(0, { message: 'Harga per kg tidak boleh negatif' })
  pricePerKg!: number;

  @ApiProperty({ required: false, example: 0.5, description: 'Potongan berat, mis. kadar air' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Potongan berat harus berupa angka' })
  @Min(0, { message: 'Potongan berat tidak boleh negatif' })
  deductionKg?: number;

  @ApiProperty({ required: false, example: 'Kadar air tinggi' })
  @IsOptional()
  @IsString({ message: 'Alasan potongan harus berupa teks' })
  @Length(3, 160, { message: 'Alasan potongan minimal 3 dan maksimal 160 karakter' })
  deductionReason?: string;

  @ApiProperty({
    required: false,
    example: 2000,
    description: 'Potongan Rupiah, mis. biaya angkut',
  })
  @IsOptional()
  @IsInt({ message: 'Potongan rupiah harus berupa bilangan bulat' })
  @Min(0, { message: 'Potongan rupiah tidak boleh negatif' })
  deductionAmount?: number;
}

export class CreateWeighingReceiptDto {
  @ApiProperty({
    required: false,
    description:
      'Permintaan penjemputan asal. Wajib diisi kecuali `walkIn` bernilai true. Permintaan harus milik penyetor dan dipegang oleh penerbit.',
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID permintaan penjemputan tidak valid' })
  pickupRequestId?: string;

  @ApiProperty({
    required: false,
    default: false,
    description:
      'Tandai true untuk setoran langsung di titik penerima (tanpa penjemputan). Bukti walk-in dicatat penuh, tetapi tidak menyusun papan harga.',
  })
  @IsOptional()
  @IsBoolean({ message: 'Penanda setoran langsung harus berupa true atau false' })
  walkIn?: boolean;

  @ApiProperty({ description: 'ID pengguna yang menyerahkan material' })
  @IsUUID('4', { message: 'ID penyetor tidak valid' })
  sellerId!: string;

  @ApiProperty({ example: 'Bank Sampah Melati' })
  @IsString({ message: 'Nama titik penerima harus berupa teks' })
  @Length(3, 160, { message: 'Nama titik penerima minimal 3 dan maksimal 160 karakter' })
  partnerName!: string;

  @ApiProperty({ example: 'Kecamatan Beji, Depok' })
  @IsString({ message: 'Wilayah harus berupa teks' })
  @Length(3, 120, { message: 'Wilayah minimal 3 dan maksimal 120 karakter' })
  region!: string;

  @ApiProperty({
    required: false,
    example: 'DKI-2025-004821',
    description:
      'Nomor tera timbangan mitra (UU No. 2 Tahun 1981). Bukti tanpa nomor tera tetap dicatat, tetapi tidak dihitung ke papan harga.',
  })
  @IsOptional()
  @IsString({ message: 'Nomor tera harus berupa teks' })
  @Length(3, 64, { message: 'Nomor tera minimal 3 dan maksimal 64 karakter' })
  scaleTeraNo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'Catatan harus berupa teks' })
  @Length(0, 500, { message: 'Catatan maksimal 500 karakter' })
  notes?: string;

  @ApiProperty({ type: [CreateWeighingLineDto] })
  @IsArray({ message: 'Rincian timbang harus berupa daftar' })
  @ArrayMinSize(1, { message: 'Bukti timbang harus memuat minimal satu baris material' })
  @ArrayMaxSize(30, { message: 'Bukti timbang maksimal 30 baris material' })
  @ValidateNested({ each: true })
  @Type(() => CreateWeighingLineDto)
  lines!: CreateWeighingLineDto[];
}
