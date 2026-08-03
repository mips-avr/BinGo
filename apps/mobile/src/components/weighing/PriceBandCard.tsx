import { StyleSheet, Text, View } from 'react-native';
import type { PriceBandDto } from '@bingo/shared-types';
import { formatIDR, formatWaktuID } from '@bingo/shared-utils';
import { Card } from '../ui/Card';
import { colors } from '../../theme/screen';
import { t } from '../../i18n';

export interface PriceBandCardProps {
  band: PriceBandDto;
}

/**
 * Menampilkan sebaran harga satu grade.
 *
 * Median ditonjolkan, tetapi P25 dan P75 selalu ikut ditampilkan. Menyajikan
 * satu angka saja akan menyiratkan kepastian yang tidak dimiliki data ini —
 * harga material yang sama bisa berbeda beberapa kali lipat antar-wilayah,
 * bahkan antar-titik penerima di wilayah yang sama.
 */
export function PriceBandCard({ band }: PriceBandCardProps) {
  const spread = band.p75 - band.p25;
  return (
    <Card style={pbS.card}>
      <View style={pbS.headRow}>
        <Text style={pbS.label}>{band.label}</Text>
        <Text style={pbS.median}>{formatIDR(band.median)}</Text>
      </View>
      <Text style={pbS.medianCaption}>{t.weighing.median} / kg</Text>

      <View style={pbS.rangeRow}>
        <View style={pbS.rangeCell}>
          <Text style={pbS.rangeLabel}>P25</Text>
          <Text style={pbS.rangeValue}>{formatIDR(band.p25)}</Text>
        </View>
        <View style={pbS.rangeBarWrap}>
          <View style={pbS.rangeBar} />
        </View>
        <View style={[pbS.rangeCell, pbS.rangeCellRight]}>
          <Text style={pbS.rangeLabel}>P75</Text>
          <Text style={pbS.rangeValue}>{formatIDR(band.p75)}</Text>
        </View>
      </View>

      {spread > 0 ? (
        <Text style={pbS.spread}>
          {t.weighing.priceRange}: {formatIDR(band.p25)} – {formatIDR(band.p75)} / kg
        </Text>
      ) : null}

      <View style={pbS.footer}>
        <Text style={pbS.meta}>
          {t.weighing.sampleCount.replace('{count}', String(band.sampleCount))} ·{' '}
          {t.weighing.partnerCount.replace('{count}', String(band.partnerCount))}
        </Text>
        <Text style={pbS.meta}>
          {t.weighing.lastReported.replace('{time}', formatWaktuID(band.lastReportedAt))}
        </Text>
      </View>
    </Card>
  );
}

const pbS = StyleSheet.create({
  card: { marginBottom: 12 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { flex: 1, marginRight: 12, fontSize: 15, fontWeight: '700', color: colors.neutral900 },
  median: { fontSize: 20, fontWeight: '800', color: colors.bingo700 },
  medianCaption: { textAlign: 'right', fontSize: 11, color: colors.neutral500 },
  rangeRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center' },
  rangeCell: { minWidth: 76 },
  rangeCellRight: { alignItems: 'flex-end' },
  rangeLabel: { fontSize: 11, fontWeight: '700', color: colors.neutral500 },
  rangeValue: { marginTop: 2, fontSize: 14, fontWeight: '600', color: colors.neutral800 },
  rangeBarWrap: { flex: 1, paddingHorizontal: 10 },
  rangeBar: { height: 4, borderRadius: 2, backgroundColor: colors.bingo200 },
  spread: { marginTop: 10, fontSize: 13, color: colors.neutral700 },
  footer: { marginTop: 12, borderTopWidth: 1, borderTopColor: colors.neutral200, paddingTop: 8 },
  meta: { fontSize: 12, color: colors.neutral600, lineHeight: 18 },
});
