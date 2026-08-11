import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

/**
 * Alasan penyetor mempersoalkan satu bukti timbang.
 *
 * Alasan wajib diisi dan tidak boleh sekadar satu kata: sengketa menurunkan
 * rekam jejak penerbit, jadi ia harus meninggalkan keterangan yang dapat
 * dibaca kedua pihak — sama seperti potongan pada bukti yang juga wajib
 * disertai alasan.
 */
export class DisputeWeighingReceiptDto {
  @ApiProperty({ example: 'Berat yang dicatat 12 kg, timbangan di lapak menunjukkan 15 kg.' })
  @IsString({ message: 'Alasan sengketa harus berupa teks' })
  @Length(10, 500, { message: 'Alasan sengketa minimal 10 dan maksimal 500 karakter' })
  reason!: string;
}
