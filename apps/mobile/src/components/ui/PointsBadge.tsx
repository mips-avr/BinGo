import { Text, View } from 'react-native';
import { t } from '../../i18n';

export function PointsBadge({ points }: { points: number }) {
  return (
    <View className="flex-row items-center self-start rounded-full bg-bingo-50 px-3 py-1.5">
      <Text className="mr-1 text-base">🌿</Text>
      <Text className="text-sm font-semibold text-bingo-700">
        {points.toLocaleString('id-ID')} {t.points.label.replace('Poin ', '')}
      </Text>
    </View>
  );
}
