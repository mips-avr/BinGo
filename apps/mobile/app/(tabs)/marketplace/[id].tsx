import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { formatIDR } from '@bingo/shared-utils';
import { Card } from '../../../src/components/ui/Card';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { useMarketplaceItem } from '../../../src/features/marketplace/hooks';
import { useAuthStore } from '../../../src/store/authStore';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { useBottomInset } from '../../../src/hooks/useBottomInset';
import { colors, radius, spacing, typography } from '../../../src/theme';
import { t } from '../../../src/i18n';

const FALLBACK = 'https://placehold.co/800x500/16A34A/FFFFFF?text=BinGo';

export default function MarketplaceItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const role = useAuthStore((s) => s.user?.role);
  const query = useMarketplaceItem(id);
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
          testID="item-error"
        />
      </SafeAreaView>
    );
  }

  const item = query.data;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title={item.itemName} subtitle={item.supplierName} />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: bottomInset }]}
      >
        <Image source={{ uri: item.imageUrl ?? FALLBACK }} style={s.image} resizeMode="cover" />

        <Card style={s.mt12}>
          <Text style={s.supplierText}>{item.supplierName}</Text>
          <Text style={s.itemName}>{item.itemName}</Text>
          <Text style={s.priceText}>{formatIDR(item.price)}</Text>
          <View style={s.metaRow}>
            <View style={s.metaCol}>
              <Text style={s.sectionLabel}>{t.marketplace.minOrder}</Text>
              <Text style={s.sectionValue}>{item.minOrderQty}</Text>
            </View>
            <View style={s.metaCol}>
              <Text style={s.sectionLabel}>{t.marketplace.stock}</Text>
              <Text style={s.sectionValue}>{item.stock}</Text>
            </View>
          </View>
        </Card>

        <Card style={s.mt12}>
          <Text style={s.sectionLabel}>{t.common.description}</Text>
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
  supplierText: typography.overline,
  itemName: { marginTop: 2, ...typography.headerTitle },
  priceText: { marginTop: spacing.xs, ...typography.numeric, fontSize: 24, color: colors.bingo700 },
  metaRow: { marginTop: spacing.sm, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xl },
  metaCol: { minWidth: 96 },
  sectionLabel: typography.overline,
  sectionValue: { marginTop: spacing.xxs, ...typography.numeric, fontSize: 16, fontWeight: '600' },
  descText: { marginTop: spacing.xxs, fontSize: 16, lineHeight: 24, color: colors.neutral800 },
  noticeCard: { backgroundColor: colors.amber50 },
  noticeText: { fontSize: 14, color: colors.amber800 },
});
