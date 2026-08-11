import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReportsFeed } from '../../../src/features/reports/hooks';
import { ReportCard } from '../../../src/components/reports/ReportCard';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { SkeletonList } from '../../../src/components/ui/Skeleton';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { colors, spacing, typography } from '../../../src/theme';
import { t } from '../../../src/i18n';

export default function ReportsList() {
  const router = useRouter();
  const query = useReportsFeed();

  const header = (
    <View style={s.header}>
      <Text style={s.title} accessibilityRole="header">
        {t.report.feedTitle}
      </Text>
    </View>
  );

  if (query.isLoading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        {header}
        <View style={s.listContent}>
          <SkeletonList count={3} lines={3} />
        </View>
      </SafeAreaView>
    );
  }

  if (query.isError) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        {header}
        <View style={s.listContent}>
          <ErrorState
            message={extractApiErrorMessage(query.error, t.common.errorMessage)}
            onRetry={() => query.refetch()}
            testID="reports-error"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {header}

      <FlatList
        data={query.data ?? []}
        keyExtractor={(r) => r.id}
        contentContainerStyle={s.listContent}
        renderItem={({ item }) => (
          <ReportCard report={item} onPress={() => router.push(`/(tabs)/reports/${item.id}`)} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="camera"
            title={t.report.emptyTitle}
            message={t.report.emptyMessage}
            action={{
              label: t.report.create,
              onPress: () => router.push('/(tabs)/reports/new'),
              testID: 'reports-empty-create',
            }}
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
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  title: typography.headerTitle,
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
});
