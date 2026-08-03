import { StyleSheet, Text, View } from 'react-native';
import type { WeighingReceiptDto } from '@bingo/shared-types';
import { formatIDR, formatWaktuID } from '@bingo/shared-utils';
import { Card } from '../ui/Card';
import { colors } from '../../theme/screen';
import { t } from '../../i18n';

export interface ReceiptCardProps {
  receipt: WeighingReceiptDto;
  onPress?: () => void;
}

export function ReceiptCard({ receipt, onPress }: ReceiptCardProps) {
  return (
    <Card onPress={onPress} style={rcS.card}>
      <View style={rcS.row}>
        <Text style={rcS.receiptNo}>{receipt.receiptNo}</Text>
        <Text style={rcS.amount}>{formatIDR(receipt.totalNetAmount)}</Text>
      </View>
      <Text style={rcS.partner} numberOfLines={1}>
        {receipt.partnerName}
      </Text>
      <View style={rcS.row}>
        <Text style={rcS.meta}>
          {receipt.lines.length} material · {receipt.totalNetWeightKg} kg
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
  receiptNo: { fontSize: 15, fontWeight: '800', color: colors.neutral900, letterSpacing: 0.4 },
  amount: { fontSize: 16, fontWeight: '800', color: colors.bingo700 },
  partner: { marginTop: 6, fontSize: 14, color: colors.neutral800 },
  meta: { marginTop: 6, fontSize: 13, color: colors.neutral600 },
  unverified: { marginTop: 6, fontSize: 11, fontWeight: '700', color: colors.amber700 },
  date: { marginTop: 8, fontSize: 12, color: colors.neutral500 },
});
