import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUrl, Length, Min } from 'class-validator';

export class CreateItemDto {
  @ApiProperty({ example: 'CV Hijau Lestari' })
  @IsString({ message: 'Nama supplier harus berupa teks' })
  @Length(2, 160)
  supplierName!: string;

  @ApiProperty({ example: 'Kantong belanja kraft 30x40 cm' })
  @IsString({ message: 'Nama produk harus berupa teks' })
  @Length(2, 160)
  itemName!: string;

  @ApiProperty({ example: 'Kantong kertas kraft food-grade, dapat didaur ulang' })
  @IsString({ message: 'Deskripsi harus berupa teks' })
  @Length(5, 5000)
  description!: string;

  @ApiProperty({ example: 1500, description: 'Harga per unit dalam Rupiah (integer)' })
  @IsInt({ message: 'Harga harus berupa bilangan bulat (IDR tanpa desimal)' })
  @Min(0, { message: 'Harga tidak boleh negatif' })
  price!: number;

  @ApiProperty({ example: 100, description: 'Minimal kuantitas pemesanan' })
  @IsInt({ message: 'Minimal pesanan harus berupa bilangan bulat' })
  @Min(1, { message: 'Minimal pesanan minimal 1' })
  minOrderQty!: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @IsInt({ message: 'Stok harus berupa bilangan bulat' })
  @Min(0, { message: 'Stok tidak boleh negatif' })
  stock?: number;

  @ApiPropertyOptional({ example: 'https://cdn.bingo.id/items/kraft30.jpg' })
  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: 'URL foto harus URL valid' })
  imageUrl?: string;
}
