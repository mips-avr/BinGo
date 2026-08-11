import { StyleSheet, Text, View } from 'react-native';
import type { WeighingReceiptDto } from '@bingo/shared-types';
import { formatIDR, formatWaktuID } from '@bingo/shared-utils';
import { Card } from '../ui/Card';
import { colors, spacing, typography } from '../../theme';
import { t } from '../../i18n';

export interface ReceiptCardProps {
  receipt: WeighingReceiptDto;
  onPress?: () => void;
}

export function ReceiptCard({ receipt, onPress }: ReceiptCardProps) {
  return (
    <Card onPress={onPress} style={rcS.card}>
      <View style={rcS.row}>
        <Text style={rcS.receiptNo} numberOfLines={1}>
          {receipt.receiptNo}
        </Text>
        <Text style={rcS.amount} numberOfLines={1}>
          {formatIDR(receipt.totalNetAmount)}
        </Text>
      </View>
      <Text style={rcS.partner} numberOfLines={1}>
        {receipt.partnerName}
      </Text>
      <View style={rcS.row}>
        <Text style={rcS.meta} numberOfLines={1}>
          {t.weighing.lineCount.replace('{count}', String(receipt.lines.length))} ·{' '}
          {receipt.totalNetWeightKg} kg
        </Text>
        {!receipt.scaleVerified ? (
          <Text style={rcS.unverified}>{t.weighing.scaleUnverified}</Text>
        ) : null}
      </View>
      <Text style={rcS.date}>{formatWaktuID(receipt.createdAt)}</Text>
    </Card>
  );
}

const rcS = StyleSheet.create({
  card: { marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  receiptNo: {
    flexShrink: 1,
    marginRight: spacing.xs,
    fontSize: 15,
    fontWeight: '800',
    color: colors.neutral900,
    letterSpacing: 0.4,
  },
  amount: { ...typography.numeric, flexShrink: 0, fontWeight: '800', color: colors.bingo700 },
  partner: { marginTop: spacing.xxs + 2, fontSize: 14, color: colors.neutral800 },
  meta: {
    flexShrink: 1,
    marginTop: spacing.xxs + 2,
    marginRight: spacing.xs,
    fontSize: 13,
    color: colors.neutral600,
  },
  unverified: {
    flexShrink: 0,
    marginTop: spacing.xxs + 2,
    fontSize: 11,
    fontWeight: '700',
    color: colors.amber700,
  },
  date: { marginTop: spacing.xs, fontSize: 12, color: colors.neutral500 },
});
