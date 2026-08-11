import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { formatWaktuID } from '@bingo/shared-utils';
import { useReport, useResolveReport } from '../../../src/features/reports/hooks';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { useBottomInset } from '../../../src/hooks/useBottomInset';
import { colors, radius, spacing, typography } from '../../../src/theme';
import { t } from '../../../src/i18n';

export default function AgentReportDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useReport(id);
  const resolve = useResolveReport();
  const bottomInset = useBottomInset();

  if (query.isLoading) {
    return (
      <SafeAreaView style={s.center} edges={['top']}>
        <Text style={s.loadingText}>{t.common.loading}</Text>
      </SafeAreaView>
    );
  }

  if (query.isError || !query.data) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <ScreenHeader title={t.report.detailTitle} />
        <ErrorState
          message={extractApiErrorMessage(query.error, t.common.errorMessage)}
          onRetry={() => query.refetch()}
          style={s.stateBlock}
          testID="agent-report-detail-error"
        />
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
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title={t.report.detailTitle} />
      <ScrollView contentContainerStyle={[s.scrollContent, { paddingBottom: bottomInset }]}>
        <Image source={{ uri: r.imageUrl }} style={s.image} resizeMode="cover" />
        <Card style={s.mt12}>
          <View style={s.row}>
            <Text style={s.sectionLabel}>{t.report.title}</Text>
            <StatusBadge status={r.status} />
          </View>
          {r.description ? <Text style={s.descText}>{r.description}</Text> : null}
          <Text style={s.coordsText}>
            📍 {r.location.lat.toFixed(5)}, {r.location.lng.toFixed(5)}
          </Text>
          <Text style={s.dateText}>{formatWaktuID(r.createdAt)}</Text>
        </Card>

        {canResolve ? (
          <View style={s.btnWrap}>
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

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bingo50,
  },
  scrollContent: { paddingHorizontal: spacing.lg },
  loadingText: typography.bodyMuted,
  stateBlock: { marginHorizontal: spacing.lg, marginTop: spacing.md },
  image: {
    height: 256,
    width: '100%',
    borderRadius: radius.md,
    backgroundColor: colors.neutral200,
  },
  mt12: { marginTop: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  sectionLabel: typography.overline,
  descText: { marginTop: spacing.xs, fontSize: 16, color: colors.neutral900 },
  coordsText: { marginTop: spacing.xs, ...typography.body, color: colors.neutral700 },
  dateText: { marginTop: spacing.xxs, ...typography.caption },
  btnWrap: { marginTop: spacing.xl },
});
