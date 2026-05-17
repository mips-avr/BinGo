import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMarketplaceItems } from '../../../src/features/marketplace/hooks';
import { ItemCard } from '../../../src/components/marketplace/ItemCard';
import { Input } from '../../../src/components/ui/Input';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { colors } from '../../../src/theme/screen';
import { t } from '../../../src/i18n';

export default function MsmeMarketplaceList() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const query = useMarketplaceItems(search);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>{t.marketplace.title}</Text>
        <Text style={s.subtitle}>{t.msme.tabs.shop}</Text>
      </View>
      <View style={s.searchWrap}>
        <Input
          label={t.common.search}
          placeholder={t.marketplace.searchPlaceholder}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
      </View>

      {query.isLoading ? (
        <ActivityIndicator style={s.loader} color={colors.bingo700} />
      ) : query.isError ? (
        <Text style={s.errorText}>
          {extractApiErrorMessage(query.error, t.common.error)}
        </Text>
      ) : (
        <FlatList
          data={query.data ?? []}
          keyExtractor={(i) => i.id}
          contentContainerStyle={s.listContent}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              onPress={() => router.push(`/(msme-tabs)/marketplace/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="🛒"
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
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  title: { fontSize: 20, fontWeight: '700', color: colors.neutral900 },
  subtitle: { marginTop: 4, fontSize: 12, color: colors.neutral600 },
  searchWrap: { paddingHorizontal: 20 },
  loader: { marginTop: 24 },
  errorText: { marginHorizontal: 20, marginTop: 12, fontSize: 14, color: colors.red600 },
  listContent: { paddingHorizontal: 20, paddingBottom: 32 },
});
