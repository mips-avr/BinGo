import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatIDR } from '@bingo/shared-utils';
import { Card } from '../../../src/components/ui/Card';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { useMyTransactions } from '../../../src/features/marketplace/hooks';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { t } from '../../../src/i18n';

export default function MsmeOrdersScreen() {
  const query = useMyTransactions();

  return (
    <SafeAreaView className="flex-1 bg-bingo-50" edges={['top']}>
      <View className="px-5 py-4">
        <Text className="text-xl font-bold text-neutral-900">{t.msme.orders.title}</Text>
      </View>

      {query.isLoading ? (
        <ActivityIndicator className="mt-6" color="#15803D" />
      ) : query.isError ? (
        <Text className="mx-5 text-sm text-red-600">
          {extractApiErrorMessage(query.error, t.common.error)}
        </Text>
      ) : (
        <FlatList
          data={query.data ?? []}
          keyExtractor={(tx) => tx.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <Card className="mb-3">
              <Text className="text-xs text-neutral-500">
                {new Date(item.createdAt).toLocaleString('id-ID')}
              </Text>
              <Text className="mt-1 font-semibold text-neutral-900">
                {item.qty} unit · {formatIDR(item.totalPrice)}
              </Text>
              <Text className="mt-1 text-sm text-bingo-700">{item.status}</Text>
            </Card>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="📦"
              title={t.msme.orders.emptyTitle}
              message={t.msme.orders.emptyMessage}
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
