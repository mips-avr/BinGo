import { Text, View } from 'react-native';
import type { PickupStatus, ReportStatus, TransactionStatus } from '@bingo/shared-types';
import { t } from '../../i18n';

type AnyStatus = PickupStatus | ReportStatus | TransactionStatus;

const TONE: Record<string, string> = {
  // pickup
  PENDING: 'bg-amber-100 text-amber-800',
  ACCEPTED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-neutral-200 text-neutral-700',
  // report
  DILAPORKAN: 'bg-amber-100 text-amber-800',
  DIVERIFIKASI: 'bg-blue-100 text-blue-800',
  SELESAI: 'bg-emerald-100 text-emerald-800',
  // transaction
  PAID: 'bg-emerald-100 text-emerald-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
};

function labelFor(status: AnyStatus): string {
  const pickup = (t.pickup.status as Record<string, string>)[status];
  if (pickup) return pickup;
  const report = (t.report.status as Record<string, string>)[status];
  if (report) return report;
  return status;
}

export function StatusBadge({ status }: { status: AnyStatus }) {
  const tone = TONE[status] ?? 'bg-neutral-100 text-neutral-700';
  const [bg, text] = tone.split(' ');
  return (
    <View className={`self-start rounded-full px-2.5 py-0.5 ${bg}`}>
      <Text className={`text-xs font-semibold ${text}`}>{labelFor(status)}</Text>
    </View>
  );
}
