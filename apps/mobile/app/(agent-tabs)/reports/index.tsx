import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ReportStatus } from '@bingo/shared-types';
import { useReportsFeed } from '../../../src/features/reports/hooks';
import { ReportCard } from '../../../src/components/reports/ReportCard';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { colors } from '../../../src/theme/screen';
import { t } from '../../../src/i18n';

export default function AgentReportsList() {
  const router = useRouter();
  const query = useReportsFeed(ReportStatus.DIVERIFIKASI);

  if (query.isLoading) {
    return (
      <SafeAreaView style={s.center} edges={['top']}>
        <ActivityIndicator color={colors.bingo700} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>{t.agent.reports.toResolveTitle}</Text>
        <Text style={s.subtitle}>{t.agent.reports.filterVerified}</Text>
      </View>

      {query.isError ? (
        <Text style={s.errorText}>
          {extractApiErrorMessage(query.error, t.common.error)}
        </Text>
      ) : null}

      <FlatList
        data={query.data ?? []}
        keyExtractor={(r) => r.id}
        contentContainerStyle={s.listContent}
        renderItem={({ item }) => (
          <ReportCard
            report={item}
            onPress={() => router.push(`/(agent-tabs)/reports/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="✅"
            title={t.common.empty}
            message="Tidak ada laporan diverifikasi yang menunggu penanganan."
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
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bingo50 },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 20, fontWeight: '700', color: colors.neutral900 },
  subtitle: { marginTop: 4, fontSize: 12, color: colors.neutral600 },
  errorText: { marginHorizontal: 20, fontSize: 14, color: colors.red600 },
  listContent: { paddingHorizontal: 20, paddingBottom: 32 },
});
