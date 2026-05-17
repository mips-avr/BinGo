import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMyPickups } from '../../../src/features/pickups/hooks';
import { PickupCard } from '../../../src/components/pickups/PickupCard';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { colors, shadow } from '../../../src/theme/screen';
import { t } from '../../../src/i18n';

export default function PickupsList() {
  const router = useRouter();
  const query = useMyPickups();

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
        <Text style={s.title}>{t.pickup.listTitle}</Text>
        <Pressable
          onPress={() => router.push('/(tabs)/pickups/new')}
          accessibilityRole="button"
          style={({ pressed }) => [s.addBtn, pressed ? s.addBtnPressed : null]}
        >
          <Text style={s.addBtnText}>+ {t.pickup.create}</Text>
        </Pressable>
      </View>

      {query.isError ? (
        <View style={s.errorWrap}>
          <Text style={s.errorText}>
            {extractApiErrorMessage(query.error, t.common.error)}
          </Text>
        </View>
      ) : null}

      <FlatList
        data={query.data ?? []}
        keyExtractor={(p) => p.id}
        contentContainerStyle={s.listContent}
        renderItem={({ item }) => (
          <PickupCard
            pickup={item}
            onPress={() => router.push(`/(tabs)/pickups/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="🚚"
            title={t.pickup.emptyTitle}
            message={t.pickup.emptyMessage}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.neutral900 },
  addBtn: {
    borderRadius: 20,
    backgroundColor: colors.bingo600,
    paddingHorizontal: 14,
    paddingVertical: 8,
    ...shadow(2),
  },
  addBtnPressed: { opacity: 0.85 },
  addBtnText: { fontSize: 14, fontWeight: '600', color: colors.white },
  errorWrap: { paddingHorizontal: 20 },
  errorText: { fontSize: 14, color: colors.red600 },
  listContent: { paddingHorizontal: 20, paddingBottom: 32 },
});
