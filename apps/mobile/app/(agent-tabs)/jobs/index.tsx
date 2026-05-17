import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAssignedPickups } from '../../../src/features/pickups/hooks';
import { PickupCard } from '../../../src/components/pickups/PickupCard';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
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
      <SafeAreaView className="flex-1 items-center justify-center bg-bingo-50" edges={['top']}>
        <ActivityIndicator color="#15803D" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bingo-50" edges={['top']}>
      <View className="px-5 py-4">
        <Text className="text-xl font-bold text-neutral-900">{t.agent.jobs.title}</Text>
      </View>

      {query.isError ? (
        <Text className="mx-5 text-sm text-red-600">
          {extractApiErrorMessage(query.error, t.common.error)}
        </Text>
      ) : null}

      <FlatList
        data={[...active, ...history]}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
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
            tintColor="#15803D"
          />
        }
      />
    </SafeAreaView>
  );
}
