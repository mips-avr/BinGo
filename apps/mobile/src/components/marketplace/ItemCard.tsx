import { Image, StyleSheet, Text, View } from 'react-native';
import type { MarketplaceItemDto } from '@bingo/shared-types';
import { formatIDR } from '@bingo/shared-utils';
import { Card } from '../ui/Card';
import { colors, radius, spacing, typography } from '../../theme';
import { t } from '../../i18n';

const FALLBACK = 'https://placehold.co/600x400/16A34A/FFFFFF?text=BinGo';

export function ItemCard({ item, onPress }: { item: MarketplaceItemDto; onPress?: () => void }) {
  return (
    <Card
      onPress={onPress}
      style={cardS.mb}
      padded={false}
      accessibilityLabel={`${item.itemName}, ${item.supplierName}, ${formatIDR(item.price)}`}
      testID={`item-${item.id}`}
    >
      <Image source={{ uri: item.imageUrl ?? FALLBACK }} style={cardS.image} resizeMode="cover" />
      <View style={cardS.body}>
        <Text style={cardS.supplier}>{item.supplierName}</Text>
        <Text style={cardS.name} numberOfLines={2}>
          {item.itemName}
        </Text>
        <View style={cardS.priceRow}>
          <Text style={cardS.price} numberOfLines={1}>
            {formatIDR(item.price)}
          </Text>
          <Text style={cardS.minOrder} numberOfLines={1}>
            {t.marketplace.minOrder}: {item.minOrderQty}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const cardS = StyleSheet.create({
  mb: { marginBottom: spacing.sm },
  image: {
    height: 144,
    width: '100%',
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    backgroundColor: colors.neutral200,
  },
  body: {
    padding: spacing.md,
  },
  supplier: typography.overline,
  name: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral900,
  },
  // (jarak & radius mengikuti token di atas)
  priceRow: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    ...typography.numeric,
    flexShrink: 0,
    color: colors.bingo700,
  },
  minOrder: {
    flexShrink: 1,
    marginLeft: spacing.xs,
    textAlign: 'right',
    fontSize: 12,
    color: colors.neutral600,
  },
});
