import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMyPickups } from '../../../src/features/pickups/hooks';
import { PickupCard } from '../../../src/components/pickups/PickupCard';
import { Button } from '../../../src/components/ui/Button';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { SkeletonList } from '../../../src/components/ui/Skeleton';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { colors, spacing, typography } from '../../../src/theme';
import { t } from '../../../src/i18n';

export default function PickupsList() {
  const router = useRouter();
  const query = useMyPickups();

  const header = (
    <View>
      <View style={s.header}>
        <Text style={s.title} accessibilityRole="header">
          {t.pickup.listTitle}
        </Text>
      </View>
      <View style={s.actionRow}>
        <Button
          label={t.collectionSchedule.open}
          size="sm"
          variant="secondary"
          style={s.action}
          onPress={() => router.push('/(tabs)/pickups/schedules')}
          testID="open-collection-schedules"
        />
        <Button
          label={t.pickup.create}
          size="sm"
          style={s.action}
          onPress={() => router.push('/(tabs)/pickups/new')}
          testID="create-pickup"
        />
      </View>
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
            testID="pickups-error"
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
        keyExtractor={(p) => p.id}
        contentContainerStyle={s.listContent}
        renderItem={({ item }) => (
          <PickupCard pickup={item} onPress={() => router.push(`/(tabs)/pickups/${item.id}`)} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="truck"
            title={t.pickup.emptyTitle}
            message={t.pickup.emptyMessage}
            action={{
              label: t.pickup.create,
              onPress: () => router.push('/(tabs)/pickups/new'),
              testID: 'pickups-empty-create',
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: { ...typography.headerTitle, flexShrink: 1 },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  action: { flex: 1 },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
});
