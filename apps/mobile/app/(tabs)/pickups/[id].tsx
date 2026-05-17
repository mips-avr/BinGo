import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { formatWaktuID } from '@bingo/shared-utils';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { useCancelPickup, usePickup } from '../../../src/features/pickups/hooks';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { t } from '../../../src/i18n';

export default function PickupDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const query = usePickup(id);
  const cancel = useCancelPickup();

  function confirmCancel() {
    Alert.alert(t.pickup.cancelConfirm, undefined, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.pickup.cancel,
        style: 'destructive',
        onPress: async () => {
          try {
            await cancel.mutateAsync(id);
            router.back();
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

  return (
    <SafeAreaView className="flex-1 bg-bingo-50" edges={['top']}>
      <ScreenHeader title={t.pickup.detailTitle} subtitle={p.address} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
      >
        <Card>
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-bold text-neutral-900">{p.address}</Text>
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
          <View className="mt-3 flex-row">
            <View className="mr-6">
              <Text className="text-xs font-semibold uppercase text-neutral-500">
                {t.pickup.weight}
              </Text>
              <Text className="mt-1 text-base text-neutral-900">{p.estimatedWeightKg} kg</Text>
            </View>
            <View>
              <Text className="text-xs font-semibold uppercase text-neutral-500">Dibuat</Text>
              <Text className="mt-1 text-base text-neutral-900">
                {formatWaktuID(p.createdAt)}
              </Text>
            </View>
          </View>
          {p.notes ? (
            <View className="mt-3">
              <Text className="text-xs font-semibold uppercase text-neutral-500">
                {t.pickup.notes}
              </Text>
              <Text className="mt-1 text-base text-neutral-900">{p.notes}</Text>
            </View>
          ) : null}
        </Card>

        {p.status === 'PENDING' ? (
          <View className="mt-6">
            <Button
              label={t.pickup.cancel}
              variant="secondary"
              onPress={confirmCancel}
              loading={cancel.isPending}
            />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
