import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { MaterialType } from '@bingo/shared-types';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { colors } from '../../../src/theme/screen';
import { t } from '../../../src/i18n';

export default function ScanResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    materialType: string;
    confidence: string;
    disposalTip: string;
    pointsHint: string;
    engine: string;
  }>();

  const materialType = params.materialType as MaterialType;
  const confidence = Number(params.confidence ?? 0);
  const percent = Math.round(confidence * 100);
  const engineLabel =
    params.engine === 'tflite'
      ? t.scanner.engineTflite
      : params.engine === 'enhanced-heuristic'
        ? t.scanner.engineEnhanced
        : t.scanner.engineHeuristic;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title={t.scanner.resultTitle} />
      <ScrollView contentContainerStyle={s.scrollContent}>
        <Card>
          <Text style={s.sectionLabel}>{t.scanner.result.material}</Text>
          <Text style={s.materialText}>
            {t.pickup.material_label[materialType]}
          </Text>
          <Text style={s.confidenceText}>
            {t.scanner.confidence.replace('{percent}', String(percent))}
          </Text>
          <Text style={s.engineText}>{engineLabel}</Text>
        </Card>

        <Card style={s.mt12}>
          <Text style={s.sectionLabel}>{t.scanner.result.disposal}</Text>
          <Text style={s.disposalText}>{params.disposalTip}</Text>
        </Card>

        <Card style={[s.mt12, s.pointsCard]}>
          <Text style={s.sectionLabel}>{t.scanner.result.points}</Text>
          <Text style={s.pointsText}>+{params.pointsHint}</Text>
        </Card>

        <View style={s.btnGroup}>
          <Button
            label={t.scanner.useForPickup}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/pickups/new',
                params: { materialType },
              })
            }
          />
          <View style={s.btnSpacer} />
          <Button
            label={t.scanner.scanAgain}
            variant="secondary"
            onPress={() => router.replace('/(tabs)/scanner')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 32 },
  sectionLabel: { fontSize: 12, textTransform: 'uppercase', color: colors.neutral600 },
  materialText: { marginTop: 4, fontSize: 24, fontWeight: '700', color: colors.bingo700 },
  confidenceText: { marginTop: 8, fontSize: 14, color: colors.neutral600 },
  engineText: { marginTop: 4, fontSize: 12, color: colors.neutral500 },
  mt12: { marginTop: 12 },
  disposalText: { marginTop: 8, fontSize: 16, lineHeight: 24, color: colors.neutral800 },
  pointsCard: { backgroundColor: colors.bingo100 },
  pointsText: { marginTop: 4, fontSize: 20, fontWeight: '700', color: colors.bingo700 },
  btnGroup: { marginTop: 24 },
  btnSpacer: { height: 12 },
});
