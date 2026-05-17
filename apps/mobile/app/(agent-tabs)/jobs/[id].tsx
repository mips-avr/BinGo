import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { formatWaktuID } from '@bingo/shared-utils';
import { useCompletePickup, usePickup } from '../../../src/features/pickups/hooks';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { t } from '../../../src/i18n';

export default function AgentJobDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const query = usePickup(id);
  const complete = useCompletePickup();

  function confirmComplete() {
    Alert.alert(t.agent.jobs.completeConfirm, undefined, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.pickup.complete,
        onPress: async () => {
          try {
            await complete.mutateAsync(id);
            Alert.alert(t.common.success, t.agent.jobs.completeSuccess, [
              { text: 'OK', onPress: () => router.back() },
            ]);
          } catch (err) {
            Alert.alert(t.common.error, extractApiErrorMessage(err, t.common.error));
          }
        },
      },
    ]);
  }

  if (query.isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bingo-50" edges={['top']}>
        <Text className="text-sm text-neutral-500">{t.common.loading}</Text>
      </SafeAreaView>
    );
  }

  if (query.isError || !query.data) {
    return (
      <SafeAreaView className="flex-1 bg-bingo-50" edges={['top']}>
        <ScreenHeader title={t.pickup.detailTitle} />
        <Text className="mx-5 mt-4 text-sm text-red-600">
          {extractApiErrorMessage(query.error, t.common.error)}
        </Text>
      </SafeAreaView>
    );
  }

  const p = query.data;
  const canComplete = p.status === 'ACCEPTED' || p.status === 'IN_PROGRESS';

  return (
    <SafeAreaView className="flex-1 bg-bingo-50" edges={['top']}>
      <ScreenHeader title={t.pickup.detailTitle} subtitle={p.address} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        <Card>
          <View className="flex-row items-center justify-between">
            <Text className="flex-1 text-base font-bold text-neutral-900">{p.address}</Text>
            <StatusBadge status={p.status} />
          </View>
          <Text className="mt-2 text-sm text-neutral-600">
            📍 {p.location.lat.toFixed(5)}, {p.location.lng.toFixed(5)}
          </Text>
        </Card>

        <Card className="mt-3">
          <Text className="text-xs font-semibold uppercase text-neutral-500">
            {t.pickup.material}
          </Text>
          <Text className="mt-1 text-base text-neutral-900">
            {t.pickup.material_label[p.materialType]}
          </Text>
          <Text className="mt-2 text-base text-neutral-900">{p.estimatedWeightKg} kg</Text>
          {p.notes ? (
            <Text className="mt-2 text-sm text-neutral-600">{p.notes}</Text>
          ) : null}
          <Text className="mt-3 text-xs text-neutral-500">{formatWaktuID(p.createdAt)}</Text>
        </Card>

        {canComplete ? (
          <View className="mt-6">
            <Button
              label={t.pickup.complete}
              onPress={confirmComplete}
              loading={complete.isPending}
              testID="complete-pickup"
            />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
