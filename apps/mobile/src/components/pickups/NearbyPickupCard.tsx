import { StyleSheet, Text, View } from 'react-native';
import type { NearbyPickupResult } from '../../features/pickups/api';
import { formatDistanceMeters } from '../../lib/geo/format';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { colors } from '../../theme/screen';
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
    <Card onPress={onPress} style={cardS.mb}>
      <View style={cardS.row}>
        <View style={cardS.content}>
          <Text style={cardS.address} numberOfLines={2}>
            {pickup.address}
          </Text>
          <Text style={cardS.distance}>
            📍 {formatDistanceMeters(pickup.distanceMeters)}
          </Text>
          <Text style={cardS.material}>
            {t.pickup.material_label[pickup.materialType]} · {pickup.estimatedWeightKg} kg
          </Text>
        </View>
      </View>
      {onAccept ? (
        <View style={cardS.btnWrap}>
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

const cardS = StyleSheet.create({
  mb: { marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    paddingRight: 8,
  },
  address: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral900,
  },
  distance: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
    color: colors.bingo700,
  },
  material: {
    marginTop: 4,
    fontSize: 14,
    color: colors.neutral700,
  },
  btnWrap: {
    marginTop: 12,
  },
});
