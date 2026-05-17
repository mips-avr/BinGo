import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { formatWaktuID } from '@bingo/shared-utils';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { useCancelPickup, usePickup } from '../../../src/features/pickups/hooks';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { colors } from '../../../src/theme/screen';
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

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title={t.pickup.detailTitle} subtitle={p.address} />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
      >
        <Card>
          <View style={s.row}>
            <Text style={s.addressTitle}>{p.address}</Text>
            <StatusBadge status={p.status} />
          </View>
          <Text style={s.coords}>
            📍 {p.location.lat.toFixed(5)}, {p.location.lng.toFixed(5)}
          </Text>
        </Card>

        <Card style={s.mt12}>
          <Text style={s.sectionLabel}>{t.pickup.material}</Text>
          <Text style={s.sectionValue}>
            {t.pickup.material_label[p.materialType]}
          </Text>
          <View style={s.metaRow}>
            <View style={s.metaCol}>
              <Text style={s.sectionLabel}>{t.pickup.weight}</Text>
              <Text style={s.sectionValue}>{p.estimatedWeightKg} kg</Text>
            </View>
            <View>
              <Text style={s.sectionLabel}>Dibuat</Text>
              <Text style={s.sectionValue}>{formatWaktuID(p.createdAt)}</Text>
            </View>
          </View>
          {p.notes ? (
            <View style={s.notesWrap}>
              <Text style={s.sectionLabel}>{t.pickup.notes}</Text>
              <Text style={s.sectionValue}>{p.notes}</Text>
            </View>
          ) : null}
        </Card>

        {p.status === 'PENDING' ? (
          <View style={s.btnWrap}>
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

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bingo50 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 32 },
  loadingText: { fontSize: 14, color: colors.neutral600 },
  errorText: { marginHorizontal: 20, marginTop: 16, fontSize: 14, color: colors.red600 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addressTitle: { fontSize: 16, fontWeight: '700', color: colors.neutral900, flex: 1, marginRight: 8 },
  coords: { marginTop: 8, fontSize: 14, color: colors.neutral700 },
  mt12: { marginTop: 12 },
  sectionLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', color: colors.neutral600, letterSpacing: 0.3 },
  sectionValue: { marginTop: 4, fontSize: 16, color: colors.neutral900 },
  metaRow: { marginTop: 12, flexDirection: 'row' },
  metaCol: { marginRight: 24 },
  notesWrap: { marginTop: 12 },
  btnWrap: { marginTop: 24 },
});
