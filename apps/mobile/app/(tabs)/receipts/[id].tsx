import { ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useReceipt } from '../../../src/features/weighing/hooks';
import { ReceiptView } from '../../../src/components/weighing/ReceiptView';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { colors } from '../../../src/theme/screen';
import { t } from '../../../src/i18n';

export default function CitizenReceiptDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useReceipt(id);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title={t.weighing.receiptTitle} />
      <ScrollView contentContainerStyle={s.content}>
        {query.isLoading ? (
          <ActivityIndicator style={s.loader} color={colors.bingo600} />
        ) : query.isError || !query.data ? (
          <Text style={s.error}>{extractApiErrorMessage(query.error, t.common.error)}</Text>
        ) : (
          <ReceiptView receipt={query.data} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  loader: { marginTop: 32 },
  error: { marginTop: 16, fontSize: 14, color: colors.red600 },
});
