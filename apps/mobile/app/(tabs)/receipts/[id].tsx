import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useReceipt } from '../../../src/features/weighing/hooks';
import { useAuthStore } from '../../../src/store/authStore';
import { ReceiptView } from '../../../src/components/weighing/ReceiptView';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { SkeletonList } from '../../../src/components/ui/Skeleton';
import { useBottomInset } from '../../../src/hooks/useBottomInset';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { colors, spacing } from '../../../src/theme';
import { t } from '../../../src/i18n';

export default function CitizenReceiptDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useReceipt(id);
  const user = useAuthStore((s) => s.user);
  const bottomInset = useBottomInset(spacing.xxl + spacing.xs);
  // Warga selalu berada di sisi penyetor pada bukti yang bisa dibukanya, jadi
  // namanya bisa diisi tanpa memanggil endpoint pengguna tambahan.
  const sellerName = user && query.data && query.data.sellerId === user.id ? user.name : undefined;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title={t.weighing.receiptTitle} />
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: bottomInset }]}>
        {query.isLoading ? (
          <SkeletonList count={3} lines={4} />
        ) : query.isError || !query.data ? (
          <ErrorState
            message={extractApiErrorMessage(query.error, t.common.errorMessage)}
            onRetry={() => query.refetch()}
            testID="citizen-receipt-error"
          />
        ) : (
          <ReceiptView receipt={query.data} sellerName={sellerName} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  content: { paddingHorizontal: spacing.lg, flexGrow: 1 },
});
