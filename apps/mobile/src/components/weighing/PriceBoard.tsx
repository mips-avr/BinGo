import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MATERIAL_GRADES, type MaterialGrade } from '@bingo/shared-types';
import { usePriceBoard } from '../../features/weighing/hooks';
import { GRADE_ORDER } from './GradePicker';
import { PriceBandCard } from './PriceBandCard';
import { RegionAutocomplete } from './RegionAutocomplete';
import { Card } from '../ui/Card';
import { Chip } from '../ui/Chip';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { KeyboardAvoider } from '../ui/KeyboardAvoider';
import { SkeletonList } from '../ui/Skeleton';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { extractApiErrorMessage } from '../../lib/api/client';
import { colors, spacing, typography } from '../../theme';
import { t } from '../../i18n';

const WINDOWS = [7, 14, 30];

export interface PriceBoardProps {
  /** Judul layar. Warga dan pemulung memakai kalimat pembuka berbeda. */
  title: string;
  subtitle: string;
  /** Tawarkan "Pakai lokasi saya" untuk mengisi wilayah otomatis. */
  allowLocation?: boolean;
  /** Ruang tambahan di bawah agar tombol terakhir tidak menempel tab bar. */
  bottomInset: number;
  /** Konten opsional di atas kolom wilayah (mis. pengumuman untuk warga). */
  header?: React.ReactNode;
}

/**
 * Isi papan harga, dipakai bersama oleh tab pemulung dan tab warga.
 *
 * Papan ini publik di sisi backend justru supaya pemulung Tingkat 0 tanpa akun
 * bisa memeriksa harga sebelum menyetor. Menaruhnya hanya di dalam tab pemulung
 * — seperti sebelumnya — membuat klaim keadilan proposal ini tidak pernah
 * sampai ke pihak yang paling dirugikan ketidakadilan itu: warga yang menjual.
 */
export function PriceBoard({
  title,
  subtitle,
  allowLocation = false,
  bottomInset,
  header,
}: PriceBoardProps) {
  const [region, setRegion] = useState('');
  const [windowDays, setWindowDays] = useState(7);
  const [grade, setGrade] = useState<MaterialGrade | null>(null);

  // Tanpa debounce, setiap ketukan huruf pada kolom wilayah memicu satu
  // permintaan papan harga.
  const debouncedRegion = useDebouncedValue(region, 400);
  const query = usePriceBoard(debouncedRegion, windowDays, grade);

  const board = query.data;
  const hasRegion = debouncedRegion.trim().length >= 3;

  const methodology = (
    <Card style={s.methodCard}>
      <Text style={s.methodTitle}>{t.weighing.methodologyTitle}</Text>
      <Text style={s.methodBody}>{t.weighing.methodologyBody}</Text>
      {/* Jawaban langsung untuk "apa yang mencegah orang memalsukan papan
          harga": dua jenis bukti yang tidak dapat diperiksa ulang dibuang. */}
      <Text style={s.methodExcluded}>{t.weighing.methodologyExcluded}</Text>
    </Card>
  );

  return (
    <KeyboardAvoider>
      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: bottomInset }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={hasRegion && query.isFetching && !query.isLoading}
            onRefresh={() => query.refetch()}
            tintColor={colors.bingo700}
          />
        }
      >
        <Text style={s.title} accessibilityRole="header">
          {title}
        </Text>
        <Text style={s.subtitle}>{subtitle}</Text>
        {header}

        <RegionAutocomplete
          value={region}
          onChange={setRegion}
          allowLocation={allowLocation}
          testID="region-autocomplete"
        />

        <Text style={s.filterLabel}>{t.weighing.windowFilter}</Text>
        <View style={s.chipRow} accessibilityRole="radiogroup">
          {WINDOWS.map((d) => (
            <Chip
              key={d}
              label={t.weighing.priceBoardWindow.replace('{days}', String(d))}
              selected={windowDays === d}
              onPress={() => setWindowDays(d)}
              style={s.chip}
              testID={`price-window-${d}`}
            />
          ))}
        </View>

        {/* Saringan grade: papan penuh punya 18 baris, dan pemulung yang hanya
            membawa kardus tidak perlu menggulir melewati tembaga dan jelantah. */}
        <Text style={s.filterLabel}>{t.weighing.gradeFilter}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.gradeRow}
          accessibilityRole="radiogroup"
        >
          <Chip
            label={t.weighing.gradeFilterAll}
            selected={grade === null}
            onPress={() => setGrade(null)}
            testID="price-grade-all"
          />
          {GRADE_ORDER.map((g) => (
            <Chip
              key={g}
              label={MATERIAL_GRADES[g].label}
              selected={grade === g}
              onPress={() => setGrade(grade === g ? null : g)}
              testID={`price-grade-${g}`}
            />
          ))}
        </ScrollView>

        {!hasRegion ? (
          <EmptyState
            icon="map-pin"
            title={t.weighing.priceBoardRegionPromptTitle}
            message={t.weighing.priceBoardRegionPromptMessage}
          />
        ) : query.isLoading ? (
          <SkeletonList count={3} lines={3} />
        ) : query.isError ? (
          <ErrorState
            message={extractApiErrorMessage(query.error, t.common.errorMessage)}
            onRetry={() => query.refetch()}
            testID="price-board-error"
          />
        ) : board && board.bands.length > 0 ? (
          <>
            {board.bands.map((band) => (
              <PriceBandCard key={band.grade} band={band} />
            ))}
            {board.insufficient.length > 0 ? (
              <Card style={s.insufficientCard}>
                <Text style={s.insufficientTitle}>{t.weighing.priceBoardInsufficient}</Text>
                <Text style={s.insufficientHint}>{t.weighing.priceBoardInsufficientHint}</Text>
                <Text style={s.insufficientList}>
                  {board.insufficient.map((g) => MATERIAL_GRADES[g]?.label ?? g).join(', ')}
                </Text>
              </Card>
            ) : null}
            {methodology}
          </>
        ) : (
          <>
            <EmptyState
              icon="bar-chart-2"
              title={t.weighing.priceBoardEmptyTitle}
              message={t.weighing.priceBoardEmptyMessage}
            />
            {methodology}
          </>
        )}
      </ScrollView>
    </KeyboardAvoider>
  );
}

const s = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  title: { ...typography.screenTitle, fontWeight: '800' },
  subtitle: { marginTop: spacing.xxs, marginBottom: spacing.md, ...typography.bodyMuted },
  filterLabel: { marginBottom: spacing.xxs, ...typography.overline },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  // Jarak diatur `gap` pada baris, jadi margin bawaan chip dinolkan.
  chip: { marginRight: 0 },
  gradeRow: { paddingVertical: spacing.xxs, paddingRight: spacing.lg, marginBottom: spacing.md },
  insufficientCard: {
    marginTop: spacing.xxs,
    marginBottom: spacing.sm,
    backgroundColor: colors.amber50,
  },
  insufficientTitle: { fontSize: 14, fontWeight: '700', color: colors.amber800 },
  insufficientHint: {
    marginTop: spacing.xxs + 2,
    fontSize: 13,
    color: colors.neutral700,
    lineHeight: 19,
  },
  insufficientList: {
    marginTop: spacing.xs,
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral800,
  },
  methodCard: { marginTop: spacing.xs },
  methodTitle: { fontSize: 14, fontWeight: '700', color: colors.neutral900 },
  methodBody: {
    marginTop: spacing.xxs + 2,
    fontSize: 13,
    color: colors.neutral700,
    lineHeight: 20,
  },
  methodExcluded: {
    marginTop: spacing.sm,
    fontSize: 13,
    fontWeight: '600',
    color: colors.amber800,
    lineHeight: 20,
  },
});
