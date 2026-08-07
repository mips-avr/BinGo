import { Platform } from 'react-native';
import tokens from './tokens.json';

/**
 * Token desain BinGo.
 *
 * Nilai mentah hidup di `tokens.json` supaya berkas yang sama bisa dibaca oleh
 * `tailwind.config.js` (CommonJS) tanpa duplikasi. Sebelumnya palet Tailwind dan
 * palet StyleSheet berbeda (`bingo50` sempat `#F0FDF4` di Tailwind tetapi
 * `#F4F6F8` di sini) sehingga latar layar bisa berganti warna antar-layar.
 */
export const colors = tokens.colors;

/** Skala jarak: 4 / 8 / 12 / 16 / 20 / 24 / 32. Padding layar standar = `spacing.lg`. */
export const spacing = tokens.spacing;

/** Radius sudut. `pill` untuk chip & badge. */
export const radius = tokens.radius;

/** Ukuran huruf mentah — pakai `typography` bila memungkinkan. */
export const fontSize = tokens.fontSize;

/**
 * Ambang ergonomi sentuh. 44dp mengikuti panduan WCAG 2.5.5 / Apple HIG;
 * pengguna sasaran BinGo banyak memakai ponsel entry-level sambil berdiri
 * atau membawa barang, jadi target kecil benar-benar terasa.
 */
export const touch = tokens.touch;

/** Bayangan lintas platform — diperkuat agar Card putih tetap terlihat. */
export function shadow(elevation = 2) {
  if (Platform.OS === 'android') {
    return { elevation: elevation + 1 };
  }
  return {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: elevation },
    shadowOpacity: 0.06 + elevation * 0.03,
    shadowRadius: elevation * 2,
  };
}

export type ColorToken = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
