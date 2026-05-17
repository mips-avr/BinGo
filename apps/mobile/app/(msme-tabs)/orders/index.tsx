import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatIDR } from '@bingo/shared-utils';
import { Card } from '../../../src/components/ui/Card';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { useMyTransactions } from '../../../src/features/marketplace/hooks';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { colors } from '../../../src/theme/screen';
import { t } from '../../../src/i18n';

export default function MsmeOrdersScreen() {
  const query = useMyTransactions();

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>{t.msme.orders.title}</Text>
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
          keyExtractor={(tx) => tx.id}
          contentContainerStyle={s.listContent}
          renderItem={({ item }) => (
            <Card style={s.mb12}>
              <Text style={s.dateText}>
                {new Date(item.createdAt).toLocaleString('id-ID')}
              </Text>
              <Text style={s.orderLine}>
                {item.qty} unit · {formatIDR(item.totalPrice)}
              </Text>
              <Text style={s.statusText}>{item.status}</Text>
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
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 20, fontWeight: '700', color: colors.neutral900 },
  loader: { marginTop: 24 },
  errorText: { marginHorizontal: 20, fontSize: 14, color: colors.red600 },
  listContent: { paddingHorizontal: 20, paddingBottom: 32 },
  mb12: { marginBottom: 12 },
  dateText: { fontSize: 12, color: colors.neutral600 },
  orderLine: { marginTop: 4, fontSize: 16, fontWeight: '600', color: colors.neutral900 },
  statusText: { marginTop: 4, fontSize: 14, fontWeight: '600', color: colors.bingo700 },
});
