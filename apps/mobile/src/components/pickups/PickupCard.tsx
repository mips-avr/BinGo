import { Text, View } from 'react-native';
import type { PickupRequestDto } from '@bingo/shared-types';
import { formatRelativeId } from '@bingo/shared-utils';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { t } from '../../i18n';

export function PickupCard({
  pickup,
  onPress,
}: {
  pickup: PickupRequestDto;
  onPress?: () => void;
}) {
  return (
    <Card onPress={onPress} className="mb-3">
      <View className="flex-row items-center justify-between">
        <Text className="flex-1 text-base font-semibold text-neutral-900" numberOfLines={1}>
          {pickup.address}
        </Text>
        <StatusBadge status={pickup.status} />
      </View>
      <View className="mt-2 flex-row items-center justify-between">
        <Text className="text-sm text-neutral-700">
          {t.pickup.material_label[pickup.materialType]} · {pickup.estimatedWeightKg} kg
        </Text>
        <Text className="text-xs text-neutral-500">{formatRelativeId(pickup.createdAt)}</Text>
      </View>
    </Card>
  );
}
