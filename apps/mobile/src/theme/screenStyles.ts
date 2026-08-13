import { StyleSheet } from 'react-native';
import { colors, radius, spacing, shadow } from './tokens';
import { fonts } from './fonts';
import { typography } from './typography';

/** Gaya layar bersama (auth, splash, pemilihan peran). */
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
    marginTop: spacing.sm,
    ...typography.body,
    color: colors.bingo700,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  scrollContentForm: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  brandTitle: {
    fontSize: 32,
    fontFamily: fonts.extraBold,
    color: colors.bingo800,
  },
  brandTagline: {
    marginTop: spacing.xxs,
    ...typography.body,
    fontFamily: fonts.medium,
    color: colors.bingo700,
  },
  screenTitle: {
    marginBottom: spacing.xxs,
    ...typography.screenTitle,
  },
  screenSubtitle: {
    marginBottom: spacing.lg,
    ...typography.body,
    fontFamily: fonts.semiBold,
    color: colors.bingo700,
  },
  bodyMuted: {
    marginTop: spacing.xxs,
    ...typography.body,
    color: colors.neutral700,
  },
  footerRow: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  footerText: {
    ...typography.body,
    color: colors.neutral700,
  },
  footerLink: {
    ...typography.body,
    fontFamily: fonts.bold,
    color: colors.bingo700,
    textDecorationLine: 'underline',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    minHeight: 44,
    alignSelf: 'flex-start',
    paddingRight: spacing.sm,
  },
  backText: {
    marginLeft: spacing.xxs,
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.bingo700,
  },
  roleList: {
    marginTop: spacing.lg,
  },
  roleCard: {
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.bingo200,
    backgroundColor: colors.white,
    padding: spacing.md,
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
    ...typography.sectionTitle,
    color: colors.bingo800,
  },
  roleCardDesc: {
    marginTop: spacing.xxs,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.neutral700,
    lineHeight: 18,
  },
});
