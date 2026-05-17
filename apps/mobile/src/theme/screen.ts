import { Platform, StyleSheet } from 'react-native';

/**
 * Palet & layout — StyleSheet eksplisit agar teks selalu terbaca.
 * Semua warna dipilih untuk kontras tinggi di latar bingo-50 (#F0FDF4).
 */
export const colors = {
  /** Background utama — abu netral agar Card putih menonjol (kontras tinggi). */
  bingo50: '#F4F6F8',
  bingo100: '#DCFCE7',
  bingo200: '#BBF7D0',
  bingo500: '#22C55E',
  bingo600: '#16A34A',
  bingo700: '#15803D',
  bingo800: '#166534',
  neutral50: '#FAFAFA',
  neutral100: '#F5F5F5',
  neutral200: '#E5E5E5',
  neutral300: '#D4D4D4',
  neutral400: '#A3A3A3',
  neutral500: '#737373',
  neutral600: '#525252',
  neutral700: '#404040',
  neutral800: '#262626',
  neutral900: '#171717',
  white: '#FFFFFF',
  red500: '#EF4444',
  red600: '#DC2626',
  red700: '#B91C1C',
  amber50: '#FFFBEB',
  amber100: '#FEF3C7',
  amber700: '#B45309',
  amber800: '#92400E',
  blue100: '#DBEAFE',
  blue600: '#2563EB',
  blue800: '#1E40AF',
  indigo100: '#E0E7FF',
  indigo800: '#3730A3',
  emerald100: '#D1FAE5',
  emerald800: '#065F46',
  orange500: '#EA580C',
} as const;

/** Cross-platform shadow helper — strengthened for visible card elevation. */
export function shadow(elevation = 2) {
  if (Platform.OS === 'android') {
    return { elevation: elevation + 1 };
  }
  return {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: elevation },
    shadowOpacity: 0.06 + elevation * 0.03,
    shadowRadius: elevation * 2,
  };
}

export const screenStyles = StyleSheet.create({
  safeRoot: {
    flex: 1,
    backgroundColor: colors.bingo50,
  },
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bingo50,
  },
  splashText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.bingo700,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  scrollContentForm: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.bingo800,
  },
  brandTagline: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '500',
    color: colors.bingo700,
  },
  screenTitle: {
    marginBottom: 4,
    fontSize: 24,
    fontWeight: '700',
    color: colors.neutral900,
  },
  screenSubtitle: {
    marginBottom: 20,
    fontSize: 14,
    fontWeight: '600',
    color: colors.bingo700,
  },
  bodyMuted: {
    marginTop: 4,
    fontSize: 14,
    color: colors.neutral700,
    lineHeight: 20,
  },
  footerRow: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  footerText: {
    fontSize: 14,
    color: colors.neutral700,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.bingo700,
    textDecorationLine: 'underline',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backText: {
    marginLeft: 4,
    fontSize: 15,
    fontWeight: '600',
    color: colors.bingo700,
  },
  roleList: {
    marginTop: 20,
  },
  roleCard: {
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.bingo200,
    backgroundColor: colors.white,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...shadow(2),
  },
  roleIcon: {
    fontSize: 28,
    marginRight: 14,
    marginTop: 2,
  },
  roleCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.bingo800,
  },
  roleCardDesc: {
    marginTop: 4,
    fontSize: 13,
    color: colors.neutral700,
    lineHeight: 18,
  },
});
