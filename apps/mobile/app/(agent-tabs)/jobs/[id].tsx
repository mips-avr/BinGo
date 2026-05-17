import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { formatWaktuID } from '@bingo/shared-utils';
import { useCompletePickup, usePickup } from '../../../src/features/pickups/hooks';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { colors } from '../../../src/theme/screen';
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
      <SafeAreaView style={s.center} edges={['top']}>
        <Text style={s.loadingText}>{t.common.loading}</Text>
      </SafeAreaView>
    );
  }

  if (query.isError || !query.data) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <ScreenHeader title={t.pickup.detailTitle} />
        <Text style={s.errorText}>
          {extractApiErrorMessage(query.error, t.common.error)}
        </Text>
      </SafeAreaView>
    );
  }

  const p = query.data;
  const canComplete = p.status === 'ACCEPTED' || p.status === 'IN_PROGRESS';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title={t.pickup.detailTitle} subtitle={p.address} />
      <ScrollView contentContainerStyle={s.scrollContent}>
        <Card>
          <View style={s.row}>
            <Text style={s.addressTitle}>{p.address}</Text>
            <StatusBadge status={p.status} />
          </View>
          <Text style={s.coordsText}>
            📍 {p.location.lat.toFixed(5)}, {p.location.lng.toFixed(5)}
          </Text>
        </Card>

        <Card style={s.mt12}>
          <Text style={s.sectionLabel}>{t.pickup.material}</Text>
          <Text style={s.sectionValue}>
            {t.pickup.material_label[p.materialType]}
          </Text>
          <Text style={s.weightText}>{p.estimatedWeightKg} kg</Text>
          {p.notes ? (
            <Text style={s.notesText}>{p.notes}</Text>
          ) : null}
          <Text style={s.dateText}>{formatWaktuID(p.createdAt)}</Text>
        </Card>

        {canComplete ? (
          <View style={s.btnWrap}>
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

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bingo50 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 32 },
  loadingText: { fontSize: 14, color: colors.neutral600 },
  errorText: { marginHorizontal: 20, marginTop: 16, fontSize: 14, color: colors.red600 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addressTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.neutral900, marginRight: 8 },
  coordsText: { marginTop: 8, fontSize: 14, color: colors.neutral700 },
  mt12: { marginTop: 12 },
  sectionLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', color: colors.neutral600 },
  sectionValue: { marginTop: 4, fontSize: 16, color: colors.neutral900 },
  weightText: { marginTop: 8, fontSize: 16, color: colors.neutral900 },
  notesText: { marginTop: 8, fontSize: 14, color: colors.neutral700 },
  dateText: { marginTop: 12, fontSize: 12, color: colors.neutral600 },
  btnWrap: { marginTop: 24 },
});
