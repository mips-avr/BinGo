import { StyleSheet, Text, View } from 'react-native';
import type { PickupStatus, ReportStatus, TransactionStatus } from '@bingo/shared-types';
import { colors } from '../../theme/screen';
import { t } from '../../i18n';

type AnyStatus = PickupStatus | ReportStatus | TransactionStatus;

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

function labelFor(status: AnyStatus): string {
  const pickup = (t.pickup.status as Record<string, string>)[status];
  if (pickup) return pickup;
  const report = (t.report.status as Record<string, string>)[status];
  if (report) return report;
  return status;
}

export function StatusBadge({ status }: { status: AnyStatus }) {
  const tone = TONE[status] ?? DEFAULT_TONE;
  return (
    <View style={[badgeStyles.container, { backgroundColor: tone.bg }]}>
      <Text style={[badgeStyles.label, { color: tone.text }]}>{labelFor(status)}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});
