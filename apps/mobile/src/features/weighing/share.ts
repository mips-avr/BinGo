import { Share } from 'react-native';
import { MATERIAL_GRADES, type WeighingReceiptDto } from '@bingo/shared-types';
import { formatIDR, formatWaktuID } from '@bingo/shared-utils';
import { t } from '../../i18n';

/**
 * Mengubah bukti timbang menjadi teks yang bisa dikirim lewat WhatsApp, SMS,
 * atau disimpan sebagai catatan.
 *
 * MENGAPA TEKS, BUKAN GAMBAR ATAU PDF
 * -----------------------------------
 * Klaim inti bukti timbang adalah "kedua pihak bisa memeriksanya". Selama ia
 * hanya hidup di dalam aplikasi, pihak yang tidak memasang BinGo — dan itu
 * mayoritas penyetor di lapangan — tidak bisa memeriksa apa pun. Teks biasa
 * bisa dibaca di ponsel apa saja, tidak butuh koneksi untuk dibuka kembali,
 * bisa dicari di riwayat WhatsApp, dan ukurannya beberapa ratus byte pada
 * paket data yang dihitung per megabyte. Gambar atau PDF memerlukan modul
 * native tambahan (`expo-print`/`react-native-view-shot`) yang tidak ada di
 * Expo Go, sehingga akan merusak APK yang dipasang juri.
 *
 * Susunannya sengaja mengikuti urutan yang sama dengan `ReceiptView`: pembaca
 * yang menyandingkan layar dan pesan menemukan angka pada baris yang sama.
 */
export function receiptToText(receipt: WeighingReceiptDto, sellerName?: string): string {
  const lines: string[] = [];

  lines.push(t.weighing.shareHeader);
  lines.push(receipt.receiptNo);
  lines.push('');
  lines.push(`${t.weighing.partnerName}: ${receipt.partnerName}`);
  lines.push(`${t.weighing.region}: ${receipt.region}`);
  lines.push(
    `${t.weighing.scaleTeraNo}: ${
      receipt.scaleTeraNo ? receipt.scaleTeraNo : t.weighing.scaleUnverified
    }`,
  );
  if (sellerName) lines.push(`${t.weighing.seller}: ${sellerName}`);
  lines.push(`${t.weighing.issuedAt}: ${formatWaktuID(receipt.createdAt)}`);
  // Penanda walk-in ikut terbawa keluar aplikasi. Kalau tidak, bukti walk-in
  // yang dibagikan tampak identik dengan bukti yang menyusun papan harga.
  if (receipt.walkIn) lines.push(`⚠ ${t.weighing.walkInBadge}`);
  lines.push('');
  lines.push(`--- ${t.weighing.lines} ---`);

  for (const line of receipt.lines) {
    const label = MATERIAL_GRADES[line.grade]?.label ?? line.grade;
    lines.push('');
    lines.push(label);
    lines.push(`  ${t.weighing.weightKg}: ${line.weightKg} kg`);
    if (line.deductionKg > 0) {
      lines.push(`  ${t.weighing.deductionKg}: -${line.deductionKg} kg`);
    }
    lines.push(`  ${t.weighing.netWeight}: ${line.netWeightKg} kg`);
    lines.push(`  ${t.weighing.pricePerKg}: ${formatIDR(line.pricePerKg)}`);
    lines.push(`  ${t.weighing.grossAmount}: ${formatIDR(line.grossAmount)}`);
    if (line.deductionAmount > 0) {
      lines.push(`  ${t.weighing.deductionAmount}: -${formatIDR(line.deductionAmount)}`);
    }
    // Alasan potongan ikut dibagikan. Justru inilah bagian yang paling sering
    // dipersengketakan, dan menghilangkannya dari salinan akan mengulang
    // masalah yang ingin diselesaikan bukti timbang.
    if (line.deductionReason) {
      lines.push(`  ${t.weighing.deductionReason}: ${line.deductionReason}`);
    }
    lines.push(`  ${t.weighing.subtotal}: ${formatIDR(line.subtotal)}`);
  }

  lines.push('');
  lines.push(`${t.weighing.totalWeight}: ${receipt.totalWeightKg} kg`);
  lines.push(`${t.weighing.netWeight}: ${receipt.totalNetWeightKg} kg`);
  if (receipt.totalDeductionAmount > 0) {
    lines.push(`${t.weighing.totalDeduction}: -${formatIDR(receipt.totalDeductionAmount)}`);
  }
  lines.push(`${t.weighing.totalNet}: ${formatIDR(receipt.totalNetAmount)}`);

  if (receipt.notes) {
    lines.push('');
    lines.push(`${t.weighing.notes}: ${receipt.notes}`);
  }

  lines.push('');
  lines.push(t.weighing.shareFooter);

  return lines.join('\n');
}

/**
 * Membuka lembar berbagi bawaan sistem.
 * Mengembalikan `false` bila gagal, supaya pemanggil bisa memberi tahu.
 */
export async function shareReceipt(
  receipt: WeighingReceiptDto,
  sellerName?: string,
): Promise<boolean> {
  try {
    await Share.share(
      {
        message: receiptToText(receipt, sellerName),
        title: t.weighing.shareDialogTitle,
      },
      { dialogTitle: t.weighing.shareDialogTitle },
    );
    return true;
  } catch {
    return false;
  }
}
