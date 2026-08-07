import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatIDR } from '@bingo/shared-utils';
import { Card } from '../../../src/components/ui/Card';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { SkeletonList } from '../../../src/components/ui/Skeleton';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';
import { useMyTransactions } from '../../../src/features/marketplace/hooks';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { colors, spacing, typography } from '../../../src/theme';
import { t } from '../../../src/i18n';

export default function MsmeOrdersScreen() {
  const query = useMyTransactions();

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title} accessibilityRole="header">
          {t.msme.orders.title}
        </Text>
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
          testID="orders-error"
        />
      ) : (
        <FlatList
          data={query.data ?? []}
          keyExtractor={(tx) => tx.id}
          contentContainerStyle={s.listContent}
          renderItem={({ item }) => (
            <Card style={s.mb12}>
              <Text style={s.dateText}>{new Date(item.createdAt).toLocaleString('id-ID')}</Text>
              <Text style={s.orderLine}>
                {item.qty} {t.common.unit} · {formatIDR(item.totalPrice)}
              </Text>
              {/* Dulu enum mentah (`PENDING`/`PAID`/`SHIPPED`) tampil apa
                  adanya ke pelaku UMKM. */}
              <View style={s.statusWrap}>
                <StatusBadge status={item.status} domain="transaction" />
              </View>
            </Card>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="package"
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
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  title: typography.headerTitle,
  stateBlock: { marginHorizontal: spacing.lg, marginTop: spacing.xs },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  mb12: { marginBottom: spacing.sm },
  dateText: typography.caption,
  orderLine: {
    marginTop: spacing.xxs,
    ...typography.numeric,
    fontWeight: '600',
  },
  statusWrap: { marginTop: spacing.xs },
});
