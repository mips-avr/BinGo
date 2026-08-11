import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAssignedPickups } from '../../../src/features/pickups/hooks';
import { PickupCard } from '../../../src/components/pickups/PickupCard';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { SkeletonList } from '../../../src/components/ui/Skeleton';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { colors, spacing, typography } from '../../../src/theme';
import { t } from '../../../src/i18n';

export default function AgentJobsList() {
  const router = useRouter();
  const query = useAssignedPickups();

  const active = (query.data ?? []).filter(
    (p) => p.status === 'ACCEPTED' || p.status === 'IN_PROGRESS',
  );
  const history = (query.data ?? []).filter(
    (p) => p.status === 'COMPLETED' || p.status === 'CANCELLED',
  );

  const header = (
    <View style={s.header}>
      <Text style={s.title} accessibilityRole="header">
        {t.agent.jobs.title}
      </Text>
    </View>
  );

  if (query.isLoading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        {header}
        <View style={s.listContent}>
          <SkeletonList count={4} />
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
            testID="jobs-error"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {header}

      <FlatList
        data={[...active, ...history]}
        keyExtractor={(p) => p.id}
        contentContainerStyle={s.listContent}
        renderItem={({ item }) => (
          <PickupCard pickup={item} onPress={() => router.push(`/(agent-tabs)/jobs/${item.id}`)} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="truck"
            title={t.agent.jobs.emptyTitle}
            message={t.agent.jobs.emptyMessage}
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
