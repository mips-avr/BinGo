/* eslint-disable @typescript-eslint/no-var-requires */
// Palet & skala di bawah ini DITURUNKAN dari sumber tunggal `src/theme/tokens.json`
// yang juga dipakai `src/theme/tokens.ts`. Jangan menulis nilai heksa langsung di
// berkas ini — dulu itulah penyebab `bingo-50` NativeWind (#F0FDF4) berbeda dari
// `colors.bingo50` StyleSheet (#F4F6F8).
const tokens = require('./src/theme/tokens.json');

const c = tokens.colors;

/** Token numerik disimpan tanpa satuan di JSON; CSS Tailwind memerlukan `px`. */
const px = (scale) =>
  Object.fromEntries(Object.entries(scale).map(([key, value]) => [key, `${value}px`]));

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}', './app/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bingo: {
          50: c.bingo50,
          100: c.bingo100,
          200: c.bingo200,
          500: c.bingo500,
          600: c.bingo600,
          700: c.bingo700,
          800: c.bingo800,
        },
        neutral: {
          50: c.neutral50,
          100: c.neutral100,
          200: c.neutral200,
          300: c.neutral300,
          400: c.neutral400,
          500: c.neutral500,
          600: c.neutral600,
          700: c.neutral700,
          800: c.neutral800,
          900: c.neutral900,
        },
        danger: { 100: c.red100, 500: c.red500, 600: c.red600, 700: c.red700 },
        warning: { 50: c.amber50, 100: c.amber100, 700: c.amber700, 800: c.amber800 },
        info: { 100: c.blue100, 600: c.blue600, 800: c.blue800 },
        accent: { 100: c.indigo100, 800: c.indigo800 },
        success: { 100: c.emerald100, 800: c.emerald800 },
        orange: { 500: c.orange500 },
      },
      spacing: px(tokens.spacing),
      borderRadius: px(tokens.radius),
      fontSize: px({
        caption: tokens.fontSize.caption,
        meta: tokens.fontSize.meta,
        body: tokens.fontSize.body,
        'body-lg': tokens.fontSize.bodyLarge,
        'card-title': tokens.fontSize.cardTitle,
        'section-title': tokens.fontSize.sectionTitle,
        'header-title': tokens.fontSize.headerTitle,
        'screen-title': tokens.fontSize.screenTitle,
      }),
      minHeight: { touch: `${tokens.touch.minTarget}px` },
      minWidth: { touch: `${tokens.touch.minTarget}px` },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
