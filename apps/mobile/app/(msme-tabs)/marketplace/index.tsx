import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMarketplaceItems } from '../../../src/features/marketplace/hooks';
import { ItemCard } from '../../../src/components/marketplace/ItemCard';
import { Input } from '../../../src/components/ui/Input';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { t } from '../../../src/i18n';

export default function MsmeMarketplaceList() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const query = useMarketplaceItems(search);

  return (
    <SafeAreaView className="flex-1 bg-bingo-50" edges={['top']}>
      <View className="px-5 py-4">
        <Text className="text-xl font-bold text-neutral-900">{t.marketplace.title}</Text>
        <Text className="mt-1 text-xs text-neutral-500">{t.msme.tabs.shop}</Text>
      </View>
      <View className="px-5">
        <Input
          label={t.common.search}
          placeholder={t.marketplace.searchPlaceholder}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
      </View>

      {query.isLoading ? (
        <ActivityIndicator className="mt-6" color="#15803D" />
      ) : query.isError ? (
        <Text className="mx-5 mt-3 text-sm text-red-600">
          {extractApiErrorMessage(query.error, t.common.error)}
        </Text>
      ) : (
        <FlatList
          data={query.data ?? []}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
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
              tintColor="#15803D"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
