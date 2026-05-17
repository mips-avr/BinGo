import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { formatIDR } from '@bingo/shared-utils';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { useCheckout } from '../../../src/features/marketplace/hooks';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { useCartStore } from '../../../src/store/cartStore';
import { colors, shadow } from '../../../src/theme/screen';
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
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <Text style={s.title}>{t.msme.cart.title}</Text>
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
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>{t.msme.cart.title}</Text>
      </View>
      <FlatList
        data={lines}
        keyExtractor={(l) => l.item.id}
        contentContainerStyle={s.listContent}
        renderItem={({ item: line }) => (
          <Card style={s.mb12}>
            <Text style={s.itemName}>{line.item.itemName}</Text>
            <Text style={s.itemSupplier}>{line.item.supplierName}</Text>
            <Text style={s.itemPrice}>{formatIDR(line.item.price)} / unit</Text>
            <View style={s.qtyRow}>
              <View style={s.qtyControls}>
                <Pressable
                  onPress={() => setQty(line.item.id, line.qty - 1)}
                  style={s.qtyBtnMinus}
                >
                  <Text style={s.qtyBtnText}>−</Text>
                </Pressable>
                <Text style={s.qtyValue}>{line.qty}</Text>
                <Pressable
                  onPress={() => setQty(line.item.id, line.qty + 1)}
                  style={s.qtyBtnPlus}
                >
                  <Text style={s.qtyBtnPlusText}>+</Text>
                </Pressable>
              </View>
              <Pressable onPress={() => removeItem(line.item.id)}>
                <Text style={s.removeText}>{t.msme.cart.remove}</Text>
              </Pressable>
            </View>
            <Text style={s.lineTotal}>
              {formatIDR(line.item.price * line.qty)}
            </Text>
          </Card>
        )}
      />
      <View style={s.bottomBar}>
        <Text style={s.totalLabel}>{t.msme.cart.total}</Text>
        <Text style={s.totalValue}>{formatIDR(total)}</Text>
        {error ? <Text style={s.errorText}>{error}</Text> : null}
        <View style={s.checkoutWrap}>
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

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 20, fontWeight: '700', color: colors.neutral900 },
  listContent: { paddingHorizontal: 20, paddingBottom: 120 },
  mb12: { marginBottom: 12 },
  itemName: { fontSize: 16, fontWeight: '600', color: colors.neutral900 },
  itemSupplier: { fontSize: 14, color: colors.neutral600 },
  itemPrice: { marginTop: 4, fontSize: 14, fontWeight: '600', color: colors.bingo700 },
  qtyRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qtyControls: { flexDirection: 'row', alignItems: 'center' },
  qtyBtnMinus: {
    height: 36, width: 36, alignItems: 'center', justifyContent: 'center',
    borderRadius: 8, backgroundColor: colors.neutral100,
  },
  qtyBtnText: { fontSize: 18, fontWeight: '700', color: colors.neutral800 },
  qtyValue: { marginHorizontal: 16, fontSize: 16, fontWeight: '600', color: colors.neutral900 },
  qtyBtnPlus: {
    height: 36, width: 36, alignItems: 'center', justifyContent: 'center',
    borderRadius: 8, backgroundColor: colors.bingo100,
  },
  qtyBtnPlusText: { fontSize: 18, fontWeight: '700', color: colors.bingo700 },
  removeText: { fontSize: 14, color: colors.red600 },
  lineTotal: { marginTop: 8, textAlign: 'right', fontWeight: '600', color: colors.neutral800, fontSize: 16 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopWidth: 1, borderTopColor: colors.neutral200,
    backgroundColor: colors.white, paddingHorizontal: 20, paddingVertical: 16,
    ...shadow(4),
  },
  totalLabel: { fontSize: 14, color: colors.neutral600 },
  totalValue: { fontSize: 24, fontWeight: '700', color: colors.bingo700 },
  errorText: { marginTop: 4, fontSize: 14, color: colors.red600 },
  checkoutWrap: { marginTop: 12 },
});
