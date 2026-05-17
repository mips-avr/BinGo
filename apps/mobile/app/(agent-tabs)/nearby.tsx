import { useState } from 'react';
import { Alert, ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAcceptPickup, useNearbyPickups } from '../../src/features/pickups/hooks';
import { NearbyPickupCard } from '../../src/components/pickups/NearbyPickupCard';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { useAgentLocation } from '../../src/hooks/useAgentLocation';
import { extractApiErrorMessage } from '../../src/lib/api/client';
import { colors } from '../../src/theme/screen';
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
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.headerWrap}>
        <Text style={s.title}>{t.agent.nearby.title}</Text>
        <Pressable onPress={location.refresh} style={s.refreshBtn}>
          <Text style={s.refreshText}>{t.agent.nearby.refreshLocation}</Text>
        </Pressable>
        <View style={s.radiusRow}>
          {RADIUS_OPTIONS.map((r) => (
            <Pressable
              key={r}
              onPress={() => setRadiusKm(r)}
              style={[s.radiusBtn, radiusKm === r ? s.radiusBtnActive : s.radiusBtnInactive]}
            >
              <Text
                style={[s.radiusText, radiusKm === r ? s.radiusTextActive : s.radiusTextInactive]}
              >
                {r} km
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {location.loading || (nearby.isLoading && !nearby.data) ? (
        <ActivityIndicator style={s.loader} color={colors.bingo700} />
      ) : (
        <FlatList
          data={nearby.data ?? []}
          keyExtractor={(p) => p.id}
          contentContainerStyle={s.listContent}
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
  headerWrap: { paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 20, fontWeight: '700', color: colors.neutral900 },
  refreshBtn: { marginTop: 8, alignSelf: 'flex-start' },
  refreshText: { fontSize: 14, fontWeight: '600', color: colors.bingo700 },
  radiusRow: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  radiusBtn: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  radiusBtnActive: { backgroundColor: colors.bingo600 },
  radiusBtnInactive: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.neutral300 },
  radiusText: { fontSize: 14, fontWeight: '600' },
  radiusTextActive: { color: colors.white },
  radiusTextInactive: { color: colors.neutral700 },
  loader: { marginTop: 32 },
  listContent: { paddingHorizontal: 20, paddingBottom: 32 },
});
