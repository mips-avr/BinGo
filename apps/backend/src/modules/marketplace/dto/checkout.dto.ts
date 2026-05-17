import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsUUID, Min, ValidateNested } from 'class-validator';

export class CartItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'ID produk tidak valid' })
  itemId!: string;

  @ApiProperty({ example: 200, description: 'Kuantitas pemesanan' })
  @IsInt({ message: 'Kuantitas harus bilangan bulat' })
  @Min(1, { message: 'Kuantitas minimal 1' })
  qty!: number;
}

export class CheckoutDto {
  @ApiProperty({ type: [CartItemDto] })
  @IsArray({ message: 'Items harus berupa array' })
  @ArrayMinSize(1, { message: 'Keranjang tidak boleh kosong' })
  @ArrayMaxSize(50, { message: 'Maksimal 50 item per transaksi' })
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items!: CartItemDto[];
}
