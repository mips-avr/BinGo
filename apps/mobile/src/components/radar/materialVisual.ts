import { MaterialType } from '@bingo/shared-types';
import { colors } from '../../theme';

/**
 * Penanda visual satu jenis material di radar.
 *
 * `letter` bukan hiasan. Radar ini dipakai di bawah matahari langsung pada
 * layar ponsel murah, oleh pengguna yang sebagiannya buta warna, dan
 * `colors.bingo600` vs `colors.emerald800` praktis tidak terbedakan di sana.
 * Warna mempercepat pemindaian mata; hurufnyalah yang menentukan artinya.
 */
export interface MaterialVisual {
  /** Satu huruf/dua huruf yang tercetak di dalam titik radar. */
  letter: string;
  color: string;
}

const FALLBACK: MaterialVisual = { letter: '?', color: colors.neutral500 };

/**
 * Dua belas kelas dipadatkan menjadi enam keluarga penanda: plastik dipisahkan
 * menurut kode resinnya (angka yang sama dengan yang tercetak pada kemasan),
 * sisanya memakai huruf awal namanya dalam Bahasa Indonesia.
 */
const VISUALS: Record<MaterialType, MaterialVisual> = {
  PET: { letter: '1', color: colors.blue600 },
  HDPE: { letter: '2', color: colors.indigo800 },
  PVC: { letter: '3', color: colors.neutral700 },
  LDPE: { letter: '4', color: colors.blue800 },
  PP: { letter: '5', color: colors.orange500 },
  PS: { letter: '6', color: colors.amber700 },
  OTHER_PLASTIC: { letter: '7', color: colors.neutral600 },
  PAPER: { letter: 'K', color: colors.amber800 },
  METAL: { letter: 'L', color: colors.neutral800 },
  GLASS: { letter: 'C', color: colors.emerald800 },
  ORGANIC: { letter: 'O', color: colors.bingo600 },
  MIXED: { letter: 'X', color: colors.red600 },
};

export function materialVisual(material: MaterialType): MaterialVisual {
  return VISUALS[material] ?? FALLBACK;
}

/** Jari-jari titik radar dalam dp menurut estimasi berat. */
export const MARKER_MIN_RADIUS = 8;
export const MARKER_MAX_RADIUS = 16;

/**
 * Berat → jari-jari titik.
 *
 * Skala akar kuadrat dipakai supaya LUAS lingkaran yang tumbuh sebanding dengan
 * beratnya. Menaikkan jari-jari secara linear membuat 20 kg terlihat sepuluh
 * kali lebih "berat" daripada 2 kg, padahal hanya sepuluh kali beratnya —
 * kesalahan baca yang klasik pada bagan gelembung.
 */
export function markerRadiusForWeight(weightKg: number, maxWeightKg: number): number {
  if (!Number.isFinite(weightKg) || weightKg <= 0 || maxWeightKg <= 0) {
    return MARKER_MIN_RADIUS;
  }
  const ratio = Math.sqrt(Math.min(weightKg, maxWeightKg) / maxWeightKg);
  return MARKER_MIN_RADIUS + ratio * (MARKER_MAX_RADIUS - MARKER_MIN_RADIUS);
}
