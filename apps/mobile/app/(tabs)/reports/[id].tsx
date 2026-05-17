import { Alert, Image, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { formatWaktuID } from '@bingo/shared-utils';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { useReport, useVerifyReport } from '../../../src/features/reports/hooks';
import { useAuthStore } from '../../../src/store/authStore';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { t } from '../../../src/i18n';

export default function ReportDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useAuthStore((s) => s.user);
  const query = useReport(id);
  const verify = useVerifyReport();

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
        <ScreenHeader title={t.report.detailTitle} />
        <Text className="mx-5 mt-4 text-sm text-red-600">
          {extractApiErrorMessage(query.error, t.common.error)}
        </Text>
      </SafeAreaView>
    );
  }

  const r = query.data;
  const isOwner = me?.id === r.citizenId;
  const canVerify = !isOwner && r.status !== 'SELESAI';

  async function onVerify() {
    try {
      await verify.mutateAsync(id);
    } catch (err) {
      Alert.alert(t.common.error, extractApiErrorMessage(err, t.common.error));
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bingo-50" edges={['top']}>
      <ScreenHeader title={t.report.detailTitle} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
      >
        <Image
          source={{ uri: r.imageUrl }}
          className="h-64 w-full rounded-2xl bg-neutral-200"
          resizeMode="cover"
        />

        <Card className="mt-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold uppercase text-neutral-500">
              {t.report.title}
            </Text>
            <StatusBadge status={r.status} />
          </View>
          {r.description ? (
            <Text className="mt-2 text-base text-neutral-900">{r.description}</Text>
          ) : (
            <Text className="mt-2 text-base text-neutral-400">(Tanpa deskripsi)</Text>
          )}
          <Text className="mt-3 text-sm text-neutral-600">
            📍 {r.location.lat.toFixed(5)}, {r.location.lng.toFixed(5)}
          </Text>
          <Text className="mt-1 text-xs text-neutral-500">
            {t.report.verifyCount.replace('{count}', String(r.verificationCount))}
            {' · '}
            {formatWaktuID(r.createdAt)}
          </Text>
        </Card>

        <View className="mt-6">
          {canVerify ? (
            <Button
              label={t.report.verify}
              onPress={onVerify}
              loading={verify.isPending}
              testID="verify-report"
            />
          ) : isOwner ? (
            <Text className="text-center text-sm text-neutral-500">{t.report.verifyOwn}</Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
