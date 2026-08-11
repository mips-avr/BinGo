import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { formatIDR } from '@bingo/shared-utils';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { useCheckout } from '../../../src/features/marketplace/hooks';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { useCartStore } from '../../../src/store/cartStore';
import { colors, radius, spacing, shadow, touch, typography } from '../../../src/theme';
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
        { text: t.common.ok, onPress: () => router.push('/(msme-tabs)/orders') },
      ]);
    } catch (e) {
      setError(extractApiErrorMessage(e, t.common.error));
    }
  }

  if (lines.length === 0) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <Text style={s.title} accessibilityRole="header">
            {t.msme.cart.title}
          </Text>
        </View>
        <EmptyState
          icon="shopping-cart"
          title={t.msme.cart.emptyTitle}
          message={t.msme.cart.emptyMessage}
          action={{
            label: t.msme.tabs.shop,
            onPress: () => router.push('/(msme-tabs)/marketplace'),
            testID: 'cart-empty-shop',
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title} accessibilityRole="header">
          {t.msme.cart.title}
        </Text>
      </View>
      <FlatList
        style={s.list}
        data={lines}
        keyExtractor={(l) => l.item.id}
        contentContainerStyle={s.listContent}
        renderItem={({ item: line }) => (
          <Card style={s.mb12}>
            <Text style={s.itemName} numberOfLines={2}>
              {line.item.itemName}
            </Text>
            <Text style={s.itemSupplier} numberOfLines={1}>
              {line.item.supplierName}
            </Text>
            <Text style={s.itemPrice}>
              {formatIDR(line.item.price)} / {t.common.unit}
            </Text>
            <View style={s.qtyRow}>
              <View style={s.qtyControls}>
                {/* 36×36 sebelumnya — di bawah ambang 44dp untuk kontrol yang
                    dipakai berulang kali. */}
                <Pressable
                  onPress={() => setQty(line.item.id, line.qty - 1)}
                  accessibilityRole="button"
                  accessibilityLabel={t.msme.cart.qtyDecrease}
                  testID={`qty-minus-${line.item.id}`}
                  style={({ pressed }) => [s.qtyBtnMinus, pressed ? s.pressed : null]}
                >
                  <Text style={s.qtyBtnText}>−</Text>
                </Pressable>
                <Text
                  style={s.qtyValue}
                  accessibilityLabel={`${t.msme.cart.qty}: ${line.qty}`}
                  testID={`qty-value-${line.item.id}`}
                >
                  {line.qty}
                </Text>
                <Pressable
                  onPress={() => setQty(line.item.id, line.qty + 1)}
                  accessibilityRole="button"
                  accessibilityLabel={t.msme.cart.qtyIncrease}
                  testID={`qty-plus-${line.item.id}`}
                  style={({ pressed }) => [s.qtyBtnPlus, pressed ? s.pressed : null]}
                >
                  <Text style={s.qtyBtnPlusText}>+</Text>
                </Pressable>
              </View>
              <Pressable
                onPress={() => removeItem(line.item.id)}
                accessibilityRole="button"
                accessibilityLabel={t.msme.cart.removeItem.replace('{name}', line.item.itemName)}
                hitSlop={spacing.xs}
                testID={`remove-${line.item.id}`}
                style={s.removeBtn}
              >
                <Feather name="trash-2" size={16} color={colors.red600} />
                <Text style={s.removeText}>{t.msme.cart.remove}</Text>
              </Pressable>
            </View>
            <Text style={s.lineTotal}>{formatIDR(line.item.price * line.qty)}</Text>
          </Card>
        )}
      />
      {/*
        Bilah bayar dulu diposisikan absolut pada `bottom: 0` di dalam
        SafeAreaView yang hanya menjaga sisi atas, sehingga tumpang tindih
        dengan area sistem di bawah. Sekarang ia anak flex biasa: daftar
        mengisi sisa ruang, bilah selalu duduk tepat di bawahnya.
      */}
      <View style={s.bottomBar}>
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>{t.msme.cart.total}</Text>
          <Text style={s.totalValue} numberOfLines={1}>
            {formatIDR(total)}
          </Text>
        </View>
        {error ? (
          <Text style={s.errorText} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}
        <Button
          label={t.msme.cart.checkout}
          onPress={onCheckout}
          loading={checkout.isPending}
          testID="msme-checkout"
          style={s.checkoutBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  title: typography.headerTitle,
  list: { flex: 1 },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  mb12: { marginBottom: spacing.sm },
  pressed: { opacity: 0.7 },
  itemName: { fontSize: 16, fontWeight: '600', color: colors.neutral900 },
  itemSupplier: { ...typography.bodyMuted },
  itemPrice: {
    marginTop: spacing.xxs,
    ...typography.body,
    fontWeight: '600',
    color: colors.bingo700,
  },
  qtyRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyControls: { flexDirection: 'row', alignItems: 'center' },
  qtyBtnMinus: {
    height: touch.minTarget,
    width: touch.minTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xs,
    backgroundColor: colors.neutral100,
  },
  qtyBtnText: { fontSize: 18, fontWeight: '700', color: colors.neutral800 },
  qtyValue: {
    marginHorizontal: spacing.md,
    minWidth: spacing.xl,
    textAlign: 'center',
    ...typography.numeric,
    fontWeight: '600',
  },
  qtyBtnPlus: {
    height: touch.minTarget,
    width: touch.minTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xs,
    backgroundColor: colors.bingo100,
  },
  qtyBtnPlusText: { fontSize: 18, fontWeight: '700', color: colors.bingo700 },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: touch.minTarget,
    paddingHorizontal: spacing.xs,
    gap: spacing.xxs + 2,
  },
  removeText: { ...typography.body, color: colors.red600 },
  lineTotal: {
    marginTop: spacing.xs,
    textAlign: 'right',
    ...typography.numeric,
    color: colors.neutral800,
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral200,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadow(4),
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  totalLabel: { ...typography.bodyMuted, flexShrink: 1 },
  totalValue: {
    ...typography.numeric,
    flexShrink: 0,
    fontSize: 24,
    color: colors.bingo700,
  },
  errorText: { marginTop: spacing.xxs, ...typography.body, color: colors.red600 },
  checkoutBtn: { marginTop: spacing.sm },
});
