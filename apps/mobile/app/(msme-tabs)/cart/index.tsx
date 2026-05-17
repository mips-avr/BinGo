import { useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { formatIDR } from '@bingo/shared-utils';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { useCheckout } from '../../../src/features/marketplace/hooks';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { useCartStore } from '../../../src/store/cartStore';
import { t } from '../../../src/i18n';

export default function MsmeCartScreen() {
  const router = useRouter();
  const lines = useCartStore((s) => Object.values(s.lines));
  const setQty = useCartStore((s) => s.setQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);
  const toCheckoutItems = useCartStore((s) => s.toCheckoutItems);
  const total = useCartStore((s) => s.totalAmount());
  const checkout = useCheckout();
  const [error, setError] = useState<string | null>(null);

  async function onCheckout() {
    const items = toCheckoutItems();
    if (items.length === 0) return;
    setError(null);
    try {
      await checkout.mutateAsync({ items });
      clear();
      Alert.alert(t.common.success, t.msme.cart.checkoutSuccess, [
        { text: 'OK', onPress: () => router.push('/(msme-tabs)/orders') },
      ]);
    } catch (e) {
      setError(extractApiErrorMessage(e, t.common.error));
    }
  }

  if (lines.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-bingo-50" edges={['top']}>
        <View className="px-5 py-4">
          <Text className="text-xl font-bold text-neutral-900">{t.msme.cart.title}</Text>
        </View>
        <EmptyState
          icon="🧺"
          title={t.msme.cart.emptyTitle}
          message={t.msme.cart.emptyMessage}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bingo-50" edges={['top']}>
      <View className="px-5 py-4">
        <Text className="text-xl font-bold text-neutral-900">{t.msme.cart.title}</Text>
      </View>
      <FlatList
        data={lines}
        keyExtractor={(l) => l.item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        renderItem={({ item: line }) => (
          <Card className="mb-3">
            <Text className="font-semibold text-neutral-900">{line.item.itemName}</Text>
            <Text className="text-sm text-neutral-500">{line.item.supplierName}</Text>
            <Text className="mt-1 text-bingo-700">{formatIDR(line.item.price)} / unit</Text>
            <View className="mt-3 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Pressable
                  onPress={() => setQty(line.item.id, line.qty - 1)}
                  className="h-9 w-9 items-center justify-center rounded-lg bg-neutral-100"
                >
                  <Text className="text-lg font-bold">−</Text>
                </Pressable>
                <Text className="mx-4 text-base font-semibold">{line.qty}</Text>
                <Pressable
                  onPress={() => setQty(line.item.id, line.qty + 1)}
                  className="h-9 w-9 items-center justify-center rounded-lg bg-bingo-100"
                >
                  <Text className="text-lg font-bold text-bingo-700">+</Text>
                </Pressable>
              </View>
              <Pressable onPress={() => removeItem(line.item.id)}>
                <Text className="text-sm text-red-600">{t.msme.cart.remove}</Text>
              </Pressable>
            </View>
            <Text className="mt-2 text-right font-semibold text-neutral-800">
              {formatIDR(line.item.price * line.qty)}
            </Text>
          </Card>
        )}
      />
      <View className="absolute bottom-0 left-0 right-0 border-t border-neutral-200 bg-white px-5 py-4">
        <Text className="text-sm text-neutral-500">{t.msme.cart.total}</Text>
        <Text className="text-2xl font-bold text-bingo-700">{formatIDR(total)}</Text>
        {error ? <Text className="mt-1 text-sm text-red-600">{error}</Text> : null}
        <View className="mt-3">
          <Button
            label={t.msme.cart.checkout}
            onPress={onCheckout}
            loading={checkout.isPending}
            testID="msme-checkout"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
