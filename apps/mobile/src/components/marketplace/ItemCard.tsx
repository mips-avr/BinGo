import { Image, Text, View } from 'react-native';
import type { MarketplaceItemDto } from '@bingo/shared-types';
import { formatIDR } from '@bingo/shared-utils';
import { Card } from '../ui/Card';
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
    <Card onPress={onPress} className="mb-3" padded={false}>
      <Image
        source={{ uri: item.imageUrl ?? FALLBACK }}
        className="h-36 w-full rounded-t-2xl bg-neutral-200"
        resizeMode="cover"
      />
      <View className="p-4">
        <Text className="text-xs uppercase text-neutral-500">{item.supplierName}</Text>
        <Text className="mt-0.5 text-base font-semibold text-neutral-900" numberOfLines={2}>
          {item.itemName}
        </Text>
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-base font-bold text-bingo-700">{formatIDR(item.price)}</Text>
          <Text className="text-xs text-neutral-500">
            {t.marketplace.minOrder}: {item.minOrderQty}
          </Text>
        </View>
      </View>
    </Card>
  );
}
