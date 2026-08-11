import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMyReceipts } from '../../../src/features/weighing/hooks';
import { ReceiptCard } from '../../../src/components/weighing/ReceiptCard';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { SkeletonList } from '../../../src/components/ui/Skeleton';
import { useBottomInset } from '../../../src/hooks/useBottomInset';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { colors, spacing } from '../../../src/theme';
import { t } from '../../../src/i18n';

export default function CitizenReceiptList() {
  const router = useRouter();
  const query = useMyReceipts();
  const bottomInset = useBottomInset();

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title={t.weighing.receiptListTitle} />
      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: bottomInset }]}
        // Satu-satunya daftar di aplikasi yang dulu tidak bisa ditarik untuk
        // memuat ulang, padahal semua daftar lain bisa.
        refreshControl={
          <RefreshControl
            refreshing={query.isFetching && !query.isLoading}
            onRefresh={() => query.refetch()}
            tintColor={colors.bingo700}
          />
        }
      >
        {query.isLoading ? (
          <SkeletonList count={3} lines={3} />
        ) : query.isError ? (
          <ErrorState
            message={extractApiErrorMessage(query.error, t.common.errorMessage)}
            onRetry={() => query.refetch()}
            testID="receipts-error"
          />
        ) : !query.data || query.data.length === 0 ? (
          <EmptyState icon="🧾" title={t.weighing.emptyTitle} message={t.weighing.emptyMessage} />
        ) : (
          query.data.map((receipt) => (
            <ReceiptCard
              key={receipt.id}
              receipt={receipt}
              onPress={() => router.push(`/(tabs)/receipts/${receipt.id}`)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  content: { paddingHorizontal: spacing.lg, flexGrow: 1 },
});
