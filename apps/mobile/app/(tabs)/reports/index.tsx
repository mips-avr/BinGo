import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReportsFeed } from '../../../src/features/reports/hooks';
import { ReportCard } from '../../../src/components/reports/ReportCard';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { t } from '../../../src/i18n';

export default function ReportsFeed() {
  const router = useRouter();
  const query = useReportsFeed();

  if (query.isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bingo-50" edges={['top']}>
        <ActivityIndicator color="#15803D" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bingo-50" edges={['top']}>
      <View className="flex-row items-center justify-between px-5 py-4">
        <Text className="text-xl font-bold text-neutral-900">{t.report.feedTitle}</Text>
        <Pressable
          onPress={() => router.push('/(tabs)/reports/new')}
          accessibilityRole="button"
          className="rounded-full bg-bingo-600 px-3 py-2 active:opacity-80"
        >
          <Text className="text-sm font-semibold text-white">+ {t.report.create}</Text>
        </Pressable>
      </View>

      {query.isError ? (
        <View className="px-5">
          <Text className="text-sm text-red-600">
            {extractApiErrorMessage(query.error, t.common.error)}
          </Text>
        </View>
      ) : null}

      <FlatList
        data={query.data ?? []}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        renderItem={({ item }) => (
          <ReportCard
            report={item}
            onPress={() => router.push(`/(tabs)/reports/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="📷"
            title={t.report.emptyTitle}
            message={t.report.emptyMessage}
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
