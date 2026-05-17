import { Alert, Image, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { formatWaktuID } from '@bingo/shared-utils';
import { useReport, useResolveReport } from '../../../src/features/reports/hooks';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { t } from '../../../src/i18n';

export default function AgentReportDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useReport(id);
  const resolve = useResolveReport();

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
  const canResolve = r.status === 'DIVERIFIKASI';

  async function onResolve() {
    try {
      await resolve.mutateAsync(id);
      Alert.alert(t.common.success, t.agent.reports.resolveSuccess);
    } catch (err) {
      Alert.alert(t.common.error, extractApiErrorMessage(err, t.common.error));
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bingo-50" edges={['top']}>
      <ScreenHeader title={t.report.detailTitle} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
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
          ) : null}
          <Text className="mt-2 text-sm text-neutral-600">
            📍 {r.location.lat.toFixed(5)}, {r.location.lng.toFixed(5)}
          </Text>
          <Text className="mt-1 text-xs text-neutral-500">{formatWaktuID(r.createdAt)}</Text>
        </Card>

        {canResolve ? (
          <View className="mt-6">
            <Button
              label={t.agent.reports.resolve}
              onPress={onResolve}
              loading={resolve.isPending}
              testID="resolve-report"
            />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
