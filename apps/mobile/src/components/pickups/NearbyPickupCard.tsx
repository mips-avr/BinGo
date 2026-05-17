import { Text, View } from 'react-native';
import type { NearbyPickupResult } from '../../features/pickups/api';
import { formatDistanceMeters } from '../../lib/geo/format';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { t } from '../../i18n';

export function NearbyPickupCard({
  pickup,
  onPress,
  onAccept,
  accepting,
}: {
  pickup: NearbyPickupResult;
  onPress?: () => void;
  onAccept?: () => void;
  accepting?: boolean;
}) {
  return (
    <Card onPress={onPress} className="mb-3">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-2">
          <Text className="text-base font-semibold text-neutral-900" numberOfLines={2}>
            {pickup.address}
          </Text>
          <Text className="mt-1 text-sm text-bingo-700">
            📍 {formatDistanceMeters(pickup.distanceMeters)}
          </Text>
          <Text className="mt-1 text-sm text-neutral-600">
            {t.pickup.material_label[pickup.materialType]} · {pickup.estimatedWeightKg} kg
          </Text>
        </View>
      </View>
      {onAccept ? (
        <View className="mt-3">
          <Button
            label={t.pickup.accept}
            onPress={onAccept}
            loading={accepting}
            testID={`accept-pickup-${pickup.id}`}
          />
        </View>
      ) : null}
    </Card>
  );
}
