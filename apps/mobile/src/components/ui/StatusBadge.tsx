import { StyleSheet, Text, View } from 'react-native';
import type { PickupStatus, ReportStatus, TransactionStatus } from '@bingo/shared-types';
import { colors, radius, spacing } from '../../theme';
import { t } from '../../i18n';

type AnyStatus = PickupStatus | ReportStatus | TransactionStatus;

/**
 * Beberapa nilai status dipakai oleh lebih dari satu domain (`PENDING` ada di
 * penjemputan maupun transaksi) dengan arti berbeda, jadi pemanggil menyebutkan
 * domainnya. Tanpa ini status transaksi jatuh ke label penjemputan atau, lebih
 * buruk, bocor sebagai teks enum mentah seperti "SHIPPED".
 */
export type StatusDomain = 'pickup' | 'report' | 'transaction';

interface ToneConfig {
  bg: string;
  text: string;
}

const TONE: Record<string, ToneConfig> = {
  // pickup
  PENDING: { bg: colors.amber100, text: colors.amber800 },
  ACCEPTED: { bg: colors.blue100, text: colors.blue800 },
  IN_PROGRESS: { bg: colors.indigo100, text: colors.indigo800 },
  COMPLETED: { bg: colors.emerald100, text: colors.emerald800 },
  CANCELLED: { bg: colors.neutral200, text: colors.neutral700 },
  // report
  DILAPORKAN: { bg: colors.amber100, text: colors.amber800 },
  DIVERIFIKASI: { bg: colors.blue100, text: colors.blue800 },
  SELESAI: { bg: colors.emerald100, text: colors.emerald800 },
  // transaction
  PAID: { bg: colors.emerald100, text: colors.emerald800 },
  SHIPPED: { bg: colors.indigo100, text: colors.indigo800 },
};

const DEFAULT_TONE: ToneConfig = { bg: colors.neutral100, text: colors.neutral700 };

function lookup(dict: Record<string, string>, status: string): string | undefined {
  return dict[status];
}

function labelFor(status: AnyStatus, domain?: StatusDomain): string {
  if (domain === 'transaction') {
    return lookup(t.transaction.status, status) ?? status;
  }
  if (domain === 'report') {
    return lookup(t.report.status, status) ?? status;
  }
  if (domain === 'pickup') {
    return lookup(t.pickup.status, status) ?? status;
  }
  return (
    lookup(t.pickup.status, status) ??
    lookup(t.report.status, status) ??
    lookup(t.transaction.status, status) ??
    status
  );
}

export function StatusBadge({
  status,
  domain,
  testID,
}: {
  status: AnyStatus;
  domain?: StatusDomain;
  testID?: string;
}) {
  const tone = TONE[status] ?? DEFAULT_TONE;
  const label = labelFor(status, domain);
  return (
    <View
      style={[badgeStyles.container, { backgroundColor: tone.bg }]}
      accessibilityRole="text"
      accessibilityLabel={label}
      testID={testID}
    >
      <Text style={[badgeStyles.label, { color: tone.text }]}>{label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: spacing.xxs - 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});
