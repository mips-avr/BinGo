import { Image, StyleSheet, Text, View } from 'react-native';
import type { MarketplaceItemDto } from '@bingo/shared-types';
import { formatIDR } from '@bingo/shared-utils';
import { Card } from '../ui/Card';
import { colors } from '../../theme/screen';
import { t } from '../../i18n';

const FALLBACK = 'https://placehold.co/600x400/16A34A/FFFFFF?text=BinGo';

export function ItemCard({
  item,
  onPress,
}: {
  item: MarketplaceItemDto;
  onPress?: () => void;
}) {
  return (
    <Card onPress={onPress} style={cardS.mb} padded={false}>
      <Image
        source={{ uri: item.imageUrl ?? FALLBACK }}
        style={cardS.image}
        resizeMode="cover"
      />
      <View style={cardS.body}>
        <Text style={cardS.supplier}>{item.supplierName}</Text>
        <Text style={cardS.name} numberOfLines={2}>
          {item.itemName}
        </Text>
        <View style={cardS.priceRow}>
          <Text style={cardS.price}>{formatIDR(item.price)}</Text>
          <Text style={cardS.minOrder}>
            {t.marketplace.minOrder}: {item.minOrderQty}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const cardS = StyleSheet.create({
  mb: { marginBottom: 12 },
  image: {
    height: 144,
    width: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: colors.neutral200,
  },
  body: {
    padding: 16,
  },
  supplier: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: colors.neutral600,
    letterSpacing: 0.3,
  },
  name: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral900,
  },
  priceRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.bingo700,
  },
  minOrder: {
    fontSize: 12,
    color: colors.neutral600,
  },
});
