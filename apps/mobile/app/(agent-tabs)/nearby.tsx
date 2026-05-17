import { useState } from 'react';
import { Alert, ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAcceptPickup, useNearbyPickups } from '../../src/features/pickups/hooks';
import { NearbyPickupCard } from '../../src/components/pickups/NearbyPickupCard';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { useAgentLocation } from '../../src/hooks/useAgentLocation';
import { extractApiErrorMessage } from '../../src/lib/api/client';
import { t } from '../../src/i18n';

const RADIUS_OPTIONS = [3, 5, 10, 15];

export default function AgentNearbyScreen() {
  const router = useRouter();
  const location = useAgentLocation();
  const [radiusKm, setRadiusKm] = useState(5);
  const nearby = useNearbyPickups(location.coords?.lat, location.coords?.lng, radiusKm);
  const accept = useAcceptPickup();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  async function handleAccept(id: string) {
    setAcceptingId(id);
    try {
      await accept.mutateAsync(id);
      Alert.alert(t.common.success, t.agent.nearby.acceptSuccess, [
        { text: 'OK', onPress: () => router.push('/(agent-tabs)/jobs') },
      ]);
    } catch (err) {
      Alert.alert(t.common.error, extractApiErrorMessage(err, t.common.error));
    } finally {
      setAcceptingId(null);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bingo-50" edges={['top']}>
      <View className="px-5 py-4">
        <Text className="text-xl font-bold text-neutral-900">{t.agent.nearby.title}</Text>
        <Pressable onPress={location.refresh} className="mt-2 self-start">
          <Text className="text-sm font-semibold text-bingo-700">
            {t.agent.nearby.refreshLocation}
          </Text>
        </Pressable>
        <View className="mt-3 flex-row flex-wrap gap-2">
          {RADIUS_OPTIONS.map((r) => (
            <Pressable
              key={r}
              onPress={() => setRadiusKm(r)}
              className={`rounded-full px-3 py-1.5 ${
                radiusKm === r ? 'bg-bingo-600' : 'border border-neutral-300 bg-white'
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  radiusKm === r ? 'text-white' : 'text-neutral-700'
                }`}
              >
                {r} km
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {location.loading || (nearby.isLoading && !nearby.data) ? (
        <ActivityIndicator className="mt-8" color="#15803D" />
      ) : (
        <FlatList
          data={nearby.data ?? []}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <NearbyPickupCard
              pickup={item}
              onPress={() => router.push(`/(agent-tabs)/jobs/${item.id}`)}
              onAccept={() => handleAccept(item.id)}
              accepting={acceptingId === item.id}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="📍"
              title={t.agent.nearby.emptyTitle}
              message={t.agent.nearby.emptyMessage}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={nearby.isFetching || location.loading}
              onRefresh={() => {
                location.refresh();
                nearby.refetch();
              }}
              tintColor="#15803D"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
