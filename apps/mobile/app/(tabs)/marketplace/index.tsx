import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../src/store/authStore';
import { useMarketplaceItems } from '../../../src/features/marketplace/hooks';
import { ItemCard } from '../../../src/components/marketplace/ItemCard';
import { Input } from '../../../src/components/ui/Input';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { KeyboardAvoider } from '../../../src/components/ui/KeyboardAvoider';
import { SkeletonList } from '../../../src/components/ui/Skeleton';
import { useDebouncedValue } from '../../../src/hooks/useDebouncedValue';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { colors, spacing, typography } from '../../../src/theme';
import { t } from '../../../src/i18n';

export default function MarketplaceList() {
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role);
  const [search, setSearch] = useState('');
  // Satu permintaan per ketukan tombol sebelumnya; sekarang menunggu jeda ketik.
  const debouncedSearch = useDebouncedValue(search);
  const query = useMarketplaceItems(debouncedSearch);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.headerWrap}>
        <Text style={s.title} accessibilityRole="header">
          {t.marketplace.title}
        </Text>
        {role === 'CITIZEN' ? <Text style={s.notice}>{t.marketplace.citizenNotice}</Text> : null}
      </View>
      <KeyboardAvoider>
        <View style={s.searchWrap}>
          <Input
            label={t.common.search}
            placeholder={t.marketplace.searchPlaceholder}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            returnKeyType="search"
            testID="marketplace-search"
          />
        </View>

        {query.isLoading ? (
          <View style={s.stateBlock}>
            <SkeletonList count={3} lines={2} />
          </View>
        ) : query.isError ? (
          <ErrorState
            message={extractApiErrorMessage(query.error, t.common.errorMessage)}
            onRetry={() => query.refetch()}
            style={s.stateBlock}
            testID="marketplace-error"
          />
        ) : (
          <FlatList
            data={query.data ?? []}
            keyExtractor={(i) => i.id}
            contentContainerStyle={s.listContent}
            renderItem={({ item }) => (
              <ItemCard item={item} onPress={() => router.push(`/(tabs)/marketplace/${item.id}`)} />
            )}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <EmptyState
                icon="shopping-bag"
                title={t.marketplace.emptyTitle}
                message={t.marketplace.emptyMessage}
              />
            }
            refreshControl={
              <RefreshControl
                refreshing={query.isFetching && !query.isLoading}
                onRefresh={() => query.refetch()}
                tintColor={colors.bingo700}
              />
            }
          />
        )}
      </KeyboardAvoider>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  headerWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxs },
  title: typography.headerTitle,
  notice: { marginTop: spacing.xxs, ...typography.caption },
  searchWrap: { paddingHorizontal: spacing.lg },
  stateBlock: { marginHorizontal: spacing.lg, marginTop: spacing.sm },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
});
