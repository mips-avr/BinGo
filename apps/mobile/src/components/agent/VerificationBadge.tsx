import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { VerificationLevel } from '@bingo/shared-types';
import { colors, radius, spacing } from '../../theme';
import { t } from '../../i18n';

const LEVEL_KEYS = ['0', '1', '2'] as const;

/** Nama tingkat dalam bahasa pengguna. */
export function verificationLevelName(level: VerificationLevel): string {
  return t.agent.verification.levelName[LEVEL_KEYS[level] ?? '0'];
}

/** Ringkasan hak yang dimiliki pada satu tingkat. */
export function verificationLevelSummary(level: VerificationLevel): string {
  return t.agent.verification.levelSummary[LEVEL_KEYS[level] ?? '0'];
}

export interface VerificationBadgeProps {
  level: VerificationLevel;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Lencana tingkat verifikasi pemulung.
 *
 * Tiga tingkat dibedakan oleh warna DAN ikon DAN angka, bukan warna saja:
 * pengguna sasaran BinGo banyak memakai ponsel entry-level dengan layar
 * berkontras rendah, sering dibaca di bawah matahari. Lencana yang hanya
 * berbeda rona akan terbaca sama di layar seperti itu.
 */
export function VerificationBadge({ level, style, testID }: VerificationBadgeProps) {
  const tone = TONE[level] ?? TONE[0];
  return (
    <View
      style={[badgeS.base, { backgroundColor: tone.bg, borderColor: tone.border }, style]}
      accessibilityRole="text"
      accessibilityLabel={`${t.agent.verification.badgeLabel.replace(
        '{level}',
        String(level),
      )} · ${verificationLevelName(level)}`}
      testID={testID ?? `verification-badge-${level}`}
    >
      <Feather name={tone.icon} size={13} color={tone.fg} style={badgeS.icon} />
      <Text style={[badgeS.text, { color: tone.fg }]} numberOfLines={1}>
        {t.agent.verification.badgeLabel.replace('{level}', String(level))} ·{' '}
        {verificationLevelName(level)}
      </Text>
    </View>
  );
}

const TONE: Record<
  number,
  { bg: string; border: string; fg: string; icon: keyof typeof Feather.glyphMap }
> = {
  0: { bg: colors.neutral100, border: colors.neutral300, fg: colors.neutral700, icon: 'user' },
  1: { bg: colors.bingo100, border: colors.bingo200, fg: colors.bingo800, icon: 'check-circle' },
  2: { bg: colors.amber50, border: colors.amber100, fg: colors.amber800, icon: 'award' },
};

const badgeS = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  icon: { marginRight: spacing.xxs },
  text: { fontSize: 12, fontWeight: '700' },
});
