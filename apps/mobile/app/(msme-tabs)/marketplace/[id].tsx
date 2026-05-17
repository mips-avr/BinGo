import { useState } from 'react';
import { Alert, Image, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { formatIDR } from '@bingo/shared-utils';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { Input } from '../../../src/components/ui/Input';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { useMarketplaceItem } from '../../../src/features/marketplace/hooks';
import { useCartStore } from '../../../src/store/cartStore';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { t } from '../../../src/i18n';

const FALLBACK = 'https://placehold.co/800x500/16A34A/FFFFFF?text=BinGo';

export default function MsmeMarketplaceItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const query = useMarketplaceItem(id);
  const addItem = useCartStore((s) => s.addItem);
  const [qty, setQty] = useState('');

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
  const parsedQty = Number(qty.replace(',', '.'));
  const orderQty = Number.isFinite(parsedQty) && parsedQty > 0 ? parsedQty : item.minOrderQty;

  function onAddToCart() {
    if (orderQty < item.minOrderQty) {
      Alert.alert(
        t.common.error,
        t.msme.cart.minOrderWarning.replace('{min}', String(item.minOrderQty)),
      );
      return;
    }
    if (orderQty > item.stock) {
      Alert.alert(t.common.error, `${t.marketplace.stock}: ${item.stock}`);
      return;
    }
    addItem(item, orderQty);
    Alert.alert(t.marketplace.addToCart, item.itemName, [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.msme.tabs.cart, onPress: () => router.push('/(msme-tabs)/cart') },
    ]);
  }

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
          <Text className="text-2xl font-bold text-bingo-700">{formatIDR(item.price)}</Text>
          <Text className="mt-2 text-sm text-neutral-600">
            {t.marketplace.minOrder}: {item.minOrderQty} · {t.marketplace.stock}: {item.stock}
          </Text>
          <Text className="mt-3 text-base leading-6 text-neutral-800">{item.description}</Text>
        </Card>

        <View className="mt-4">
          <Input
            label={t.msme.cart.qty}
            placeholder={String(item.minOrderQty)}
            value={qty}
            onChangeText={setQty}
            keyboardType="numeric"
          />
          <Button label={t.msme.cart.addToCart} onPress={onAddToCart} testID="msme-add-cart" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
