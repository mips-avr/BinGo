import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { PickupRequestDto } from '@bingo/shared-types';
import { formatRelativeId } from '@bingo/shared-utils';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { colors } from '../../theme/screen';
import { t } from '../../i18n';

export function PickupCard({
  pickup,
  onPress,
}: {
  pickup: PickupRequestDto;
  onPress?: () => void;
}) {
  return (
    <Card onPress={onPress} style={cardS.mb}>
      <View style={cardS.row}>
        {/* Icon indicator */}
        <View style={cardS.iconCircle}>
          <Feather name="truck" size={14} color={colors.bingo600} />
        </View>
        <Text style={cardS.title} numberOfLines={1}>
          {pickup.address}
        </Text>
        <StatusBadge status={pickup.status} />
      </View>
      {/* Divider */}
      <View style={cardS.divider} />
      <View style={cardS.meta}>
        <Text style={cardS.metaLeft}>
          {t.pickup.material_label[pickup.materialType]} · {pickup.estimatedWeightKg} kg
        </Text>
        <Text style={cardS.metaRight}>{formatRelativeId(pickup.createdAt)}</Text>
      </View>
    </Card>
  );
}

const cardS = StyleSheet.create({
  mb: { marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bingo100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.neutral900,
    marginRight: 8,
  },
  divider: {
    marginTop: 12,
    marginBottom: 10,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.neutral200,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaLeft: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.neutral500,
  },
  metaRight: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.neutral400,
  },
});
