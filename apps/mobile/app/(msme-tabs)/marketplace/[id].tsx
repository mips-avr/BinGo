import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { formatIDR } from '@bingo/shared-utils';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { Input } from '../../../src/components/ui/Input';
import { KeyboardAvoider } from '../../../src/components/ui/KeyboardAvoider';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { useBottomInset } from '../../../src/hooks/useBottomInset';
import { useMarketplaceItem } from '../../../src/features/marketplace/hooks';
import { useCartStore } from '../../../src/store/cartStore';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { colors, radius, spacing, typography } from '../../../src/theme';
import { t } from '../../../src/i18n';

const FALLBACK = 'https://placehold.co/800x500/16A34A/FFFFFF?text=BinGo';

export default function MsmeMarketplaceItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const query = useMarketplaceItem(id);
  const addItem = useCartStore((s) => s.addItem);
  const [qty, setQty] = useState('');
  const bottomInset = useBottomInset();

  if (query.isLoading) {
    return (
      <SafeAreaView style={s.center} edges={['top']}>
        <Text style={s.loadingText}>{t.common.loading}</Text>
      </SafeAreaView>
    );
  }

  if (query.isError || !query.data) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <ScreenHeader title={t.marketplace.title} />
        <ErrorState
          message={extractApiErrorMessage(query.error, t.common.errorMessage)}
          onRetry={() => query.refetch()}
          style={s.stateBlock}
          testID="msme-item-error"
        />
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
      Alert.alert(t.common.error, t.msme.cart.stockWarning.replace('{stock}', String(item.stock)));
      return;
    }
    addItem(item, orderQty);
    Alert.alert(t.marketplace.addToCart, item.itemName, [
      { text: t.common.ok, style: 'cancel' },
      { text: t.msme.tabs.cart, onPress: () => router.push('/(msme-tabs)/cart') },
    ]);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title={item.itemName} subtitle={item.supplierName} />
      {/* Kolom jumlah berada persis di atas tombol tambah ke keranjang —
          keduanya tertutup papan ketik tanpa pembungkus ini. */}
      <KeyboardAvoider>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[s.scrollContent, { paddingBottom: bottomInset }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Image source={{ uri: item.imageUrl ?? FALLBACK }} style={s.image} resizeMode="cover" />

          <Card style={s.mt12}>
            <Text style={s.priceText} numberOfLines={1}>
              {formatIDR(item.price)}
            </Text>
            {/* Dulu satu baris tak terbatas; sekarang dua kolom yang boleh
              membungkus tanpa saling menabrak. */}
            <View style={s.metaRow}>
              <View style={s.metaCol}>
                <Text style={s.metaLabel}>{t.marketplace.minOrder}</Text>
                <Text style={s.metaValue}>{item.minOrderQty}</Text>
              </View>
              <View style={s.metaCol}>
                <Text style={s.metaLabel}>{t.marketplace.stock}</Text>
                <Text style={s.metaValue}>{item.stock}</Text>
              </View>
            </View>
            <Text style={s.descText}>{item.description}</Text>
          </Card>

          <View style={s.actionWrap}>
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
      </KeyboardAvoider>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bingo50,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg },
  loadingText: typography.bodyMuted,
  stateBlock: { marginHorizontal: spacing.lg, marginTop: spacing.md },
  image: {
    height: 224,
    width: '100%',
    borderRadius: radius.md,
    backgroundColor: colors.neutral200,
  },
  mt12: { marginTop: spacing.sm },
  priceText: { ...typography.numeric, fontSize: 24, color: colors.bingo700 },
  metaRow: { marginTop: spacing.sm, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xl },
  metaCol: { minWidth: 96 },
  metaLabel: typography.overline,
  metaValue: { marginTop: spacing.xxs, ...typography.numeric, fontSize: 16, fontWeight: '600' },
  descText: { marginTop: spacing.sm, fontSize: 16, lineHeight: 24, color: colors.neutral800 },
  actionWrap: { marginTop: spacing.md },
});
