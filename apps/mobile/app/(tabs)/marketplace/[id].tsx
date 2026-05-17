import { Image, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { formatIDR } from '@bingo/shared-utils';
import { Card } from '../../../src/components/ui/Card';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { useMarketplaceItem } from '../../../src/features/marketplace/hooks';
import { useAuthStore } from '../../../src/store/authStore';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { t } from '../../../src/i18n';

const FALLBACK = 'https://placehold.co/800x500/16A34A/FFFFFF?text=BinGo';

export default function MarketplaceItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const role = useAuthStore((s) => s.user?.role);
  const query = useMarketplaceItem(id);

  if (query.isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bingo-50" edges={['top']}>
        <Text className="text-sm text-neutral-500">{t.common.loading}</Text>
      </SafeAreaView>
    );
  }

  if (query.isError || !query.data) {
    return (
      <SafeAreaView className="flex-1 bg-bingo-50" edges={['top']}>
        <ScreenHeader title={t.marketplace.title} />
        <Text className="mx-5 mt-4 text-sm text-red-600">
          {extractApiErrorMessage(query.error, t.common.error)}
        </Text>
      </SafeAreaView>
    );
  }

  const item = query.data;

  return (
    <SafeAreaView className="flex-1 bg-bingo-50" edges={['top']}>
      <ScreenHeader title={item.itemName} subtitle={item.supplierName} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
      >
        <Image
          source={{ uri: item.imageUrl ?? FALLBACK }}
          className="h-56 w-full rounded-2xl bg-neutral-200"
          resizeMode="cover"
        />

        <Card className="mt-3">
          <Text className="text-xs uppercase text-neutral-500">{item.supplierName}</Text>
          <Text className="mt-0.5 text-xl font-bold text-neutral-900">{item.itemName}</Text>
          <Text className="mt-2 text-2xl font-bold text-bingo-700">{formatIDR(item.price)}</Text>
          <View className="mt-3 flex-row">
            <View className="mr-6">
              <Text className="text-xs font-semibold uppercase text-neutral-500">
                {t.marketplace.minOrder}
              </Text>
              <Text className="mt-1 text-base text-neutral-900">{item.minOrderQty}</Text>
            </View>
            <View>
              <Text className="text-xs font-semibold uppercase text-neutral-500">
                {t.marketplace.stock}
              </Text>
              <Text className="mt-1 text-base text-neutral-900">{item.stock}</Text>
            </View>
          </View>
        </Card>

        <Card className="mt-3">
          <Text className="text-xs font-semibold uppercase text-neutral-500">Deskripsi</Text>
          <Text className="mt-1 text-base leading-6 text-neutral-800">{item.description}</Text>
        </Card>

        {role === 'CITIZEN' ? (
          <Card className="mt-3 bg-amber-50">
            <Text className="text-sm text-amber-800">{t.marketplace.citizenNotice}</Text>
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
