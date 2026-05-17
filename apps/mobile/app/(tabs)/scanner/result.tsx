import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { MaterialType } from '@bingo/shared-types';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
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
    params.engine === 'tflite' ? t.scanner.engineTflite : t.scanner.engineHeuristic;

  return (
    <SafeAreaView className="flex-1 bg-bingo-50" edges={['top']}>
      <ScreenHeader title={t.scanner.resultTitle} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        <Card>
          <Text className="text-xs uppercase text-neutral-500">{t.scanner.result.material}</Text>
          <Text className="mt-1 text-2xl font-bold text-bingo-700">
            {t.pickup.material_label[materialType]}
          </Text>
          <Text className="mt-2 text-sm text-neutral-500">
            {t.scanner.confidence.replace('{percent}', String(percent))}
          </Text>
          <Text className="mt-1 text-xs text-neutral-400">{engineLabel}</Text>
        </Card>

        <Card className="mt-3">
          <Text className="text-xs uppercase text-neutral-500">{t.scanner.result.disposal}</Text>
          <Text className="mt-2 text-base leading-6 text-neutral-800">{params.disposalTip}</Text>
        </Card>

        <Card className="mt-3 bg-bingo-50">
          <Text className="text-xs uppercase text-neutral-500">{t.scanner.result.points}</Text>
          <Text className="mt-1 text-xl font-bold text-bingo-700">+{params.pointsHint}</Text>
        </Card>

        <View className="mt-6 gap-3">
          <Button
            label={t.scanner.useForPickup}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/pickups/new',
                params: { materialType },
              })
            }
          />
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
