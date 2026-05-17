import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ReportStatus } from '@bingo/shared-types';
import { useReportsFeed } from '../../../src/features/reports/hooks';
import { ReportCard } from '../../../src/components/reports/ReportCard';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { t } from '../../../src/i18n';

export default function AgentReportsList() {
  const router = useRouter();
  const query = useReportsFeed(ReportStatus.DIVERIFIKASI);

  if (query.isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bingo-50" edges={['top']}>
        <ActivityIndicator color="#15803D" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bingo-50" edges={['top']}>
      <View className="px-5 py-4">
        <Text className="text-xl font-bold text-neutral-900">{t.agent.reports.toResolveTitle}</Text>
        <Text className="mt-1 text-xs text-neutral-500">{t.agent.reports.filterVerified}</Text>
      </View>

      {query.isError ? (
        <Text className="mx-5 text-sm text-red-600">
          {extractApiErrorMessage(query.error, t.common.error)}
        </Text>
      ) : null}

      <FlatList
        data={query.data ?? []}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
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
            tintColor="#15803D"
          />
        }
      />
    </SafeAreaView>
  );
}
