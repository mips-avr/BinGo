import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { formatIDR } from '@bingo/shared-utils';
import { Card } from '../../../src/components/ui/Card';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { useMarketplaceItem } from '../../../src/features/marketplace/hooks';
import { useAuthStore } from '../../../src/store/authStore';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { colors } from '../../../src/theme/screen';
import { t } from '../../../src/i18n';

const FALLBACK = 'https://placehold.co/800x500/16A34A/FFFFFF?text=BinGo';

export default function MarketplaceItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const role = useAuthStore((s) => s.user?.role);
  const query = useMarketplaceItem(id);

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
          <Text style={s.supplierText}>{item.supplierName}</Text>
          <Text style={s.itemName}>{item.itemName}</Text>
          <Text style={s.priceText}>{formatIDR(item.price)}</Text>
          <View style={s.metaRow}>
            <View style={s.metaCol}>
              <Text style={s.sectionLabel}>{t.marketplace.minOrder}</Text>
              <Text style={s.sectionValue}>{item.minOrderQty}</Text>
            </View>
            <View>
              <Text style={s.sectionLabel}>{t.marketplace.stock}</Text>
              <Text style={s.sectionValue}>{item.stock}</Text>
            </View>
          </View>
        </Card>

        <Card style={s.mt12}>
          <Text style={s.sectionLabel}>Deskripsi</Text>
          <Text style={s.descText}>{item.description}</Text>
        </Card>

        {role === 'CITIZEN' ? (
          <Card style={[s.mt12, s.noticeCard]}>
            <Text style={s.noticeText}>{t.marketplace.citizenNotice}</Text>
          </Card>
        ) : null}
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
  supplierText: { fontSize: 12, textTransform: 'uppercase', color: colors.neutral600 },
  itemName: { marginTop: 2, fontSize: 20, fontWeight: '700', color: colors.neutral900 },
  priceText: { marginTop: 8, fontSize: 24, fontWeight: '700', color: colors.bingo700 },
  metaRow: { marginTop: 12, flexDirection: 'row' },
  metaCol: { marginRight: 24 },
  sectionLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', color: colors.neutral600 },
  sectionValue: { marginTop: 4, fontSize: 16, color: colors.neutral900 },
  descText: { marginTop: 4, fontSize: 16, lineHeight: 24, color: colors.neutral800 },
  noticeCard: { backgroundColor: colors.amber50 },
  noticeText: { fontSize: 14, color: colors.amber800 },
});
