import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { colors } from '../../../src/theme/screen';
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
      <SafeAreaView style={s.center} edges={['top']}>
        <Text style={s.loadingText}>{t.common.loading}</Text>
      </SafeAreaView>
    );
  }

  if (query.isError || !query.data) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <ScreenHeader title={t.marketplace.title} />
        <Text style={s.errorText}>
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
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title={item.itemName} subtitle={item.supplierName} />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
      >
        <Image
          source={{ uri: item.imageUrl ?? FALLBACK }}
          style={s.image}
          resizeMode="cover"
        />

        <Card style={s.mt12}>
          <Text style={s.priceText}>{formatIDR(item.price)}</Text>
          <Text style={s.metaText}>
            {t.marketplace.minOrder}: {item.minOrderQty} · {t.marketplace.stock}: {item.stock}
          </Text>
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
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bingo50 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 32 },
  loadingText: { fontSize: 14, color: colors.neutral600 },
  errorText: { marginHorizontal: 20, marginTop: 16, fontSize: 14, color: colors.red600 },
  image: { height: 224, width: '100%', borderRadius: 16, backgroundColor: colors.neutral200 },
  mt12: { marginTop: 12 },
  priceText: { fontSize: 24, fontWeight: '700', color: colors.bingo700 },
  metaText: { marginTop: 8, fontSize: 14, color: colors.neutral700 },
  descText: { marginTop: 12, fontSize: 16, lineHeight: 24, color: colors.neutral800 },
  actionWrap: { marginTop: 16 },
});
