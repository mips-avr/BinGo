import { StyleSheet, Text, View } from 'react-native';
import type { PriceBandDto } from '@bingo/shared-types';
import { formatIDR, formatWaktuID } from '@bingo/shared-utils';
import { Card } from '../ui/Card';
import { colors, radius, spacing, typography } from '../../theme';
import { t } from '../../i18n';

export interface PriceBandCardProps {
  band: PriceBandDto;
}

/** Tinggi batang sebaran. Cukup tebal untuk terbaca, cukup tipis untuk kartu. */
const BAR_HEIGHT = 14;

/**
 * Berapa persen ruang kosong disisakan di atas P75.
 *
 * Tanpa ini, batang untuk sebaran terlebar akan menyentuh tepi kanan dan
 * pembaca tidak punya petunjuk bahwa sumbunya memang berhenti di situ.
 */
const AXIS_HEADROOM = 1.15;

/**
 * Menampilkan sebaran harga satu grade.
 *
 * BAGAN, BUKAN HIASAN
 * -------------------
 * Versi sebelumnya menggambar `rangeBar` selebar `flex: 1` dengan tinggi 4dp:
 * panjangnya sama persis untuk sebaran Rp50 maupun Rp5.000. Bagan yang
 * panjangnya tidak berarti apa-apa lebih buruk daripada tidak ada bagan sama
 * sekali, karena pembaca tetap menyimpulkan sesuatu darinya.
 *
 * Sekarang sumbunya dimulai dari Rp0 dan berakhir sedikit di atas P75, dengan:
 *   • posisi batang  → tingkat harga (seberapa mahal material ini),
 *   • panjang batang → lebar sebaran P25–P75 (seberapa tidak seragam harganya),
 *   • garis di dalam → median.
 *
 * Sumbu dimulai dari nol dengan sengaja. Memulai dari P25 akan membuat setiap
 * sebaran memenuhi lebar kartu, dan sebaran Rp100 akan tampak sama lebarnya
 * dengan sebaran Rp3.000 — persis kesalahan yang ingin diperbaiki di sini.
 */
export function PriceBandCard({ band }: PriceBandCardProps) {
  const spread = Math.max(0, band.p75 - band.p25);
  const axisMax = Math.max(band.p75 * AXIS_HEADROOM, 1);

  const toPercent = (value: number): `${number}%` =>
    `${Math.min(100, Math.max(0, (value / axisMax) * 100))}%`;
  const startPercent = toPercent(band.p25);
  const widthPercent = toPercent(spread);
  const medianPercent = toPercent(band.median);

  // Sebaran dinilai relatif terhadap mediannya: selisih Rp500 berarti banyak
  // untuk kertas seharga Rp1.500 dan hampir tidak berarti untuk tembaga.
  const relativeSpread = band.median > 0 ? spread / band.median : 0;
  const spreadNote =
    spread === 0
      ? t.weighing.spreadSingle
      : relativeSpread >= 0.35
        ? t.weighing.spreadWide
        : t.weighing.spreadNarrow;

  const accessibilityLabel = t.weighing.bandAccessibility
    .replace('{label}', band.label)
    .replace('{median}', formatIDR(band.median))
    .replace('{p25}', formatIDR(band.p25))
    .replace('{p75}', formatIDR(band.p75));

  return (
    <Card
      style={pbS.card}
      accessibilityLabel={accessibilityLabel}
      testID={`price-band-${band.grade}`}
    >
      <View style={pbS.headRow}>
        {/* Label grade seperti "MULTILAYER_SACHET" dulu membungkus ke baris
            berikutnya dan tidak lagi sejajar dengan mediannya. */}
        <Text style={pbS.label} numberOfLines={2}>
          {band.label}
        </Text>
        <Text style={pbS.median} numberOfLines={1}>
          {formatIDR(band.median)}
        </Text>
      </View>
      <Text style={pbS.medianCaption}>{t.weighing.median} / kg</Text>

      {/* ── Bagan sebaran ── */}
      <Text style={pbS.axisTitle}>{t.weighing.spreadAxis}</Text>
      <View
        style={pbS.track}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View style={[pbS.bar, { left: startPercent, width: widthPercent }]} />
        {/* Median: garis gelap yang menembus seluruh tinggi batang. Titik bulat
            akan tertukar dengan ujung batang pada sebaran yang sangat sempit. */}
        <View style={[pbS.medianTick, { left: medianPercent }]} />
      </View>

      {/* Sumbu diberi angka di kedua ujungnya; tanpa itu panjang batang tidak
          bisa diterjemahkan kembali menjadi rupiah. */}
      <View style={pbS.axisRow}>
        <Text style={pbS.axisTick}>{formatIDR(0)}</Text>
        <Text style={pbS.axisTick}>{formatIDR(axisMax)}</Text>
      </View>

      <View style={pbS.legendRow}>
        <View style={pbS.legendCell}>
          <Text style={pbS.legendLabel}>P25</Text>
          <Text style={pbS.legendValue}>{formatIDR(band.p25)}</Text>
        </View>
        {/* Nilai mediannya sendiri sudah menjadi angka besar di kepala kartu;
            di sini yang perlu dijelaskan hanyalah arti garis gelap pada batang. */}
        <View style={[pbS.legendCell, pbS.legendCellCenter]}>
          <View style={pbS.medianSwatch} />
          <Text style={[pbS.legendLabel, pbS.legendLabelMedian]}>{t.weighing.median}</Text>
        </View>
        <View style={[pbS.legendCell, pbS.legendCellRight]}>
          <Text style={pbS.legendLabel}>P75</Text>
          <Text style={pbS.legendValue}>{formatIDR(band.p75)}</Text>
        </View>
      </View>

      <Text style={pbS.spreadNote}>{spreadNote}</Text>

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
  card: { marginBottom: spacing.sm },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  label: {
    flex: 1,
    marginRight: spacing.sm,
    ...typography.cardTitle,
  },
  median: {
    ...typography.numeric,
    flexShrink: 0,
    fontSize: 20,
    fontWeight: '800',
    color: colors.bingo700,
  },
  medianCaption: { textAlign: 'right', fontSize: 11, color: colors.neutral500 },

  axisTitle: { marginTop: spacing.sm, ...typography.overline },
  track: {
    marginTop: spacing.xs,
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    backgroundColor: colors.neutral100,
    borderWidth: 1,
    borderColor: colors.neutral200,
    overflow: 'hidden',
  },
  bar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    // Lebar minimum agar sebaran nol tetap terlihat sebagai satu batang tipis
    // alih-alih menghilang sama sekali.
    minWidth: 3,
    borderRadius: BAR_HEIGHT / 2,
    backgroundColor: colors.bingo500,
  },
  medianTick: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2.5,
    marginLeft: -1.25,
    backgroundColor: colors.bingo800,
  },
  axisRow: {
    marginTop: spacing.xxs,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  axisTick: { fontSize: 10, color: colors.neutral500 },

  legendRow: { marginTop: spacing.sm, flexDirection: 'row', justifyContent: 'space-between' },
  legendCell: { flex: 1 },
  legendCellCenter: { alignItems: 'center' },
  legendCellRight: { alignItems: 'flex-end' },
  legendLabel: { fontSize: 11, fontWeight: '700', color: colors.neutral500 },
  legendLabelMedian: { marginTop: 2, color: colors.bingo800 },
  legendValue: { marginTop: 2, fontSize: 13, fontWeight: '600', color: colors.neutral800 },
  medianSwatch: {
    width: 2.5,
    height: 12,
    backgroundColor: colors.bingo800,
  },

  spreadNote: {
    marginTop: spacing.sm,
    borderRadius: radius.xs,
    backgroundColor: colors.neutral50,
    paddingHorizontal: spacing.xs,
    paddingVertical: 6,
    fontSize: 12,
    color: colors.neutral700,
    lineHeight: 18,
  },
  footer: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral200,
    paddingTop: spacing.xs,
  },
  meta: { fontSize: 12, color: colors.neutral600, lineHeight: 18 },
});
