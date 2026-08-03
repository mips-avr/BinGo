import { ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMyReceipts } from '../../../src/features/weighing/hooks';
import { ReceiptCard } from '../../../src/components/weighing/ReceiptCard';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { colors } from '../../../src/theme/screen';
import { t } from '../../../src/i18n';

export default function AgentReceiptList() {
  const router = useRouter();
  const query = useMyReceipts();

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title={t.weighing.receiptListTitle} />
      <ScrollView contentContainerStyle={s.content}>
        {query.isLoading ? (
          <ActivityIndicator style={s.loader} color={colors.bingo600} />
        ) : query.isError ? (
          <Text style={s.error}>{extractApiErrorMessage(query.error, t.common.error)}</Text>
        ) : !query.data || query.data.length === 0 ? (
          <EmptyState
            icon="🧾"
            title={t.weighing.emptyTitle}
            message={t.weighing.emptyMessage}
          />
        ) : (
          query.data.map((receipt) => (
            <ReceiptCard
              key={receipt.id}
              receipt={receipt}
              onPress={() => router.push(`/(agent-tabs)/receipts/${receipt.id}`)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  loader: { marginTop: 32 },
  error: { marginTop: 16, fontSize: 14, color: colors.red600 },
});
