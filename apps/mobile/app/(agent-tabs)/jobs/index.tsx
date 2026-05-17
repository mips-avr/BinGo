import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAssignedPickups } from '../../../src/features/pickups/hooks';
import { PickupCard } from '../../../src/components/pickups/PickupCard';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { colors } from '../../../src/theme/screen';
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
        <Text style={s.title}>{t.agent.jobs.title}</Text>
      </View>

      {query.isError ? (
        <Text style={s.errorText}>
          {extractApiErrorMessage(query.error, t.common.error)}
        </Text>
      ) : null}

      <FlatList
        data={[...active, ...history]}
        keyExtractor={(p) => p.id}
        contentContainerStyle={s.listContent}
        renderItem={({ item }) => (
          <PickupCard
            pickup={item}
            onPress={() => router.push(`/(agent-tabs)/jobs/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="🚚"
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bingo50 },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 20, fontWeight: '700', color: colors.neutral900 },
  errorText: { marginHorizontal: 20, fontSize: 14, color: colors.red600 },
  listContent: { paddingHorizontal: 20, paddingBottom: 32 },
});
