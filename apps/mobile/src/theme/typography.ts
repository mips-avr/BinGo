import { StyleSheet } from 'react-native';
import { colors, fontSize } from './tokens';

/**
 * Skala tipografi bernama.
 *
 * Sebelumnya judul bagian ditulis 17 di beberapa layar dan 16 di `ui/Section`,
 * sehingga dua bagian yang bersebelahan terlihat beda tingkat. Semua ukuran
 * sekarang berasal dari sini; pemakaian `fontSize` lepas hanya untuk kasus
 * khusus (mis. angka besar di kartu poin).
 */
export const typography = StyleSheet.create({
  /** Judul utama sebuah layar penuh (mis. "Papan harga"). */
  screenTitle: {
    fontSize: fontSize.screenTitle,
    fontWeight: '700',
    color: colors.neutral900,
  },
  /** Judul pada header daftar/tab (lebih ringkas dari `screenTitle`). */
  headerTitle: {
    fontSize: fontSize.headerTitle,
    fontWeight: '700',
    color: colors.neutral900,
  },
  /** Judul bagian di dalam layar. */
  sectionTitle: {
    fontSize: fontSize.sectionTitle,
    fontWeight: '700',
    color: colors.neutral900,
  },
  /** Judul di dalam kartu. */
  cardTitle: {
    fontSize: fontSize.cardTitle,
    fontWeight: '700',
    color: colors.neutral900,
  },
  /** Teks isi biasa. */
  body: {
    fontSize: fontSize.body,
    color: colors.neutral800,
    lineHeight: 20,
  },
  /** Teks isi sekunder / penjelas. */
  bodyMuted: {
    fontSize: fontSize.body,
    color: colors.neutral600,
    lineHeight: 20,
  },
  /** Keterangan kecil, meta data, stempel waktu. */
  caption: {
    fontSize: fontSize.caption,
    color: colors.neutral600,
    lineHeight: 17,
  },
  /**
   * Angka — berat, rupiah, poin. `tabular-nums` menjaga lebar digit tetap sama
   * sehingga kolom nominal pada bukti timbang tidak "bergoyang" saat berubah.
   */
  numeric: {
    fontSize: fontSize.bodyLarge,
    fontWeight: '700',
    color: colors.neutral900,
    fontVariant: ['tabular-nums'],
  },
  /** Label kecil huruf besar di atas nilai (mis. "MIN. PESANAN"). */
  overline: {
    fontSize: fontSize.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    color: colors.neutral600,
  },
  /** Pesan galat sebaris di bawah input. */
  error: {
    fontSize: fontSize.caption,
    color: colors.red600,
    lineHeight: 17,
  },
});
