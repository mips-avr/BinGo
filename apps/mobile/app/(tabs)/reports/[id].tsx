import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { colors } from '../../../src/theme/screen';
import { t } from '../../../src/i18n';

export default function ReportDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useAuthStore((s) => s.user);
  const query = useReport(id);
  const verify = useVerifyReport();

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
        <Text style={s.errorText}>
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
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title={t.report.detailTitle} />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
      >
        <Image
          source={{ uri: r.imageUrl }}
          style={s.image}
          resizeMode="cover"
        />

        <Card style={s.mt12}>
          <View style={s.row}>
            <Text style={s.sectionLabel}>{t.report.title}</Text>
            <StatusBadge status={r.status} />
          </View>
          {r.description ? (
            <Text style={s.descText}>{r.description}</Text>
          ) : (
            <Text style={s.noDescText}>(Tanpa deskripsi)</Text>
          )}
          <Text style={s.coordsText}>
            📍 {r.location.lat.toFixed(5)}, {r.location.lng.toFixed(5)}
          </Text>
          <Text style={s.metaText}>
            {t.report.verifyCount.replace('{count}', String(r.verificationCount))}
            {' · '}
            {formatWaktuID(r.createdAt)}
          </Text>
        </Card>

        <View style={s.btnWrap}>
          {canVerify ? (
            <Button
              label={t.report.verify}
              onPress={onVerify}
              loading={verify.isPending}
              testID="verify-report"
            />
          ) : isOwner ? (
            <Text style={s.ownText}>{t.report.verifyOwn}</Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bingo50 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 32 },
  loadingText: { fontSize: 14, color: colors.neutral600 },
  errorText: { marginHorizontal: 20, marginTop: 16, fontSize: 14, color: colors.red600 },
  image: { height: 256, width: '100%', borderRadius: 16, backgroundColor: colors.neutral200 },
  mt12: { marginTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', color: colors.neutral600 },
  descText: { marginTop: 8, fontSize: 16, color: colors.neutral900 },
  noDescText: { marginTop: 8, fontSize: 16, color: colors.neutral400 },
  coordsText: { marginTop: 12, fontSize: 14, color: colors.neutral700 },
  metaText: { marginTop: 4, fontSize: 12, color: colors.neutral600 },
  btnWrap: { marginTop: 24 },
  ownText: { textAlign: 'center', fontSize: 14, color: colors.neutral600 },
});
