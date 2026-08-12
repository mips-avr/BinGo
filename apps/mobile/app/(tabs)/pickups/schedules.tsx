import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CollectionScheduleCard } from '../../../src/components/pickups/CollectionScheduleCard';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { SkeletonList } from '../../../src/components/ui/Skeleton';
import { useCollectionSchedules } from '../../../src/features/collection-schedules/hooks';
import { t } from '../../../src/i18n';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { colors, spacing } from '../../../src/theme';

export default function CollectionSchedulesScreen() {
  const query = useCollectionSchedules();

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title={t.collectionSchedule.title} />

      {query.isLoading ? (
        <View style={s.content}>
          <SkeletonList count={3} />
        </View>
      ) : query.isError ? (
        <View style={s.content}>
          <ErrorState
            message={extractApiErrorMessage(query.error, t.common.errorMessage)}
            onRetry={() => query.refetch()}
          />
        </View>
      ) : (
        <FlatList
          data={query.data ?? []}
          keyExtractor={(schedule) => schedule.id}
          renderItem={({ item }) => <CollectionScheduleCard schedule={item} />}
          contentContainerStyle={s.content}
          ListEmptyComponent={
            <EmptyState
              icon="calendar"
              title={t.collectionSchedule.emptyTitle}
              message={t.collectionSchedule.emptyMessage}
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
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
});
