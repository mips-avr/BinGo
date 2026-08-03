import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MATERIAL_GRADES } from '@bingo/shared-types';
import { usePriceBoard } from '../../src/features/weighing/hooks';
import { PriceBandCard } from '../../src/components/weighing/PriceBandCard';
import { Card } from '../../src/components/ui/Card';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Input } from '../../src/components/ui/Input';
import { extractApiErrorMessage } from '../../src/lib/api/client';
import { colors } from '../../src/theme/screen';
import { t } from '../../src/i18n';

const WINDOWS = [7, 14, 30];

export default function PriceBoardScreen() {
  const [region, setRegion] = useState('');
  const [windowDays, setWindowDays] = useState(7);
  const query = usePriceBoard(region, windowDays);

  const board = query.data;
  const hasRegion = region.trim().length >= 3;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>{t.weighing.priceBoardTitle}</Text>
        <Text style={s.subtitle}>{t.weighing.priceBoardSubtitle}</Text>

        <Input
          label={t.weighing.priceBoardRegion}
          placeholder={t.weighing.regionPlaceholder}
          value={region}
          onChangeText={setRegion}
          autoCapitalize="words"
          testID="price-region"
        />

        <View style={s.windowRow}>
          {WINDOWS.map((d) => {
            const active = windowDays === d;
            return (
              <Text
                key={d}
                onPress={() => setWindowDays(d)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[s.windowChip, active ? s.windowChipActive : s.windowChipIdle]}
              >
                {t.weighing.priceBoardWindow.replace('{days}', String(d))}
              </Text>
            );
          })}
        </View>

        {!hasRegion ? (
          <EmptyState
            icon="📍"
            title={t.weighing.priceBoardRegion}
            message={t.weighing.regionPlaceholder}
          />
        ) : query.isLoading ? (
          <ActivityIndicator style={s.loader} color={colors.bingo600} />
        ) : query.isError ? (
          <Text style={s.error}>{extractApiErrorMessage(query.error, t.common.error)}</Text>
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
                  {board.insufficient
                    .map((g) => MATERIAL_GRADES[g]?.label ?? g)
                    .join(', ')}
                </Text>
              </Card>
            ) : null}
            <Card style={s.methodCard}>
              <Text style={s.methodTitle}>{t.weighing.methodologyTitle}</Text>
              <Text style={s.methodBody}>{t.weighing.methodologyBody}</Text>
            </Card>
          </>
        ) : (
          <>
            <EmptyState
              icon="📊"
              title={t.weighing.priceBoardEmptyTitle}
              message={t.weighing.priceBoardEmptyMessage}
            />
            <Card style={s.methodCard}>
              <Text style={s.methodTitle}>{t.weighing.methodologyTitle}</Text>
              <Text style={s.methodBody}>{t.weighing.methodologyBody}</Text>
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: colors.neutral900 },
  subtitle: { marginTop: 4, marginBottom: 16, fontSize: 14, color: colors.neutral600 },
  windowRow: { flexDirection: 'row', marginBottom: 16 },
  windowChip: {
    marginRight: 8,
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
  },
  windowChipActive: {
    borderColor: colors.bingo600,
    backgroundColor: colors.bingo600,
    color: colors.white,
    fontWeight: '700',
  },
  windowChipIdle: {
    borderColor: colors.neutral300,
    backgroundColor: colors.white,
    color: colors.neutral800,
    fontWeight: '500',
  },
  loader: { marginTop: 32 },
  error: { marginTop: 16, fontSize: 14, color: colors.red600 },
  insufficientCard: { marginTop: 4, marginBottom: 12, backgroundColor: colors.amber50 },
  insufficientTitle: { fontSize: 14, fontWeight: '700', color: colors.amber800 },
  insufficientHint: { marginTop: 6, fontSize: 13, color: colors.neutral700, lineHeight: 19 },
  insufficientList: { marginTop: 8, fontSize: 13, fontWeight: '600', color: colors.neutral800 },
  methodCard: { marginTop: 8 },
  methodTitle: { fontSize: 14, fontWeight: '700', color: colors.neutral900 },
  methodBody: { marginTop: 6, fontSize: 13, color: colors.neutral700, lineHeight: 20 },
});
