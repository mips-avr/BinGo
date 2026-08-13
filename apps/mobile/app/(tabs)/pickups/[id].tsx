import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { formatWaktuID } from '@bingo/shared-utils';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { useCancelPickup, usePickup } from '../../../src/features/pickups/hooks';
import { useReceiptForPickup } from '../../../src/features/weighing/hooks';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { useBottomInset } from '../../../src/hooks/useBottomInset';
import { colors, spacing, typography } from '../../../src/theme';
import { t } from '../../../src/i18n';

export default function PickupDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const query = usePickup(id);
  const cancel = useCancelPickup();
  // Bukti timbang yang lahir dari penjemputan ini. Sebelumnya warga sama sekali
  // tidak punya jalan membukanya dari sini — bukti yang tidak bisa dibuka
  // penyetornya tidak menyelesaikan apa pun.
  const { receipt } = useReceiptForPickup(id);
  const bottomInset = useBottomInset();
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  async function cancelPickup() {
    try {
      await cancel.mutateAsync(id);
      setConfirmingCancel(false);
      router.back();
    } catch (err) {
      setConfirmingCancel(false);
      Alert.alert(t.common.error, extractApiErrorMessage(err, t.common.error));
    }
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
        <ErrorState
          message={extractApiErrorMessage(query.error, t.common.errorMessage)}
          onRetry={() => query.refetch()}
          style={s.stateBlock}
          testID="pickup-detail-error"
        />
      </SafeAreaView>
    );
  }

  const p = query.data;

  return (
    <>
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title={t.pickup.detailTitle} subtitle={p.address} />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: bottomInset }]}
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
          <Text style={s.sectionValue}>{t.pickup.material_label[p.materialType]}</Text>
          <View style={s.metaRow}>
            <View style={s.metaCol}>
              <Text style={s.sectionLabel}>{t.pickup.weight}</Text>
              <Text style={s.sectionValue}>{p.estimatedWeightKg} kg</Text>
            </View>
            <View style={s.metaCol}>
              <Text style={s.sectionLabel}>{t.common.createdAt}</Text>
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

        {receipt ? (
          <View style={s.btnWrap}>
            <Button
              label={t.weighing.viewReceipt}
              onPress={() => router.push(`/(tabs)/receipts/${receipt.id}`)}
              testID="view-receipt-from-pickup"
            />
            <Text style={s.receiptNote}>{t.weighing.alreadyIssued}</Text>
          </View>
        ) : null}

        {p.status === 'PENDING' ? (
          <View style={s.btnWrap}>
            <Button
              label={t.pickup.cancel}
              variant="secondary"
              onPress={() => setConfirmingCancel(true)}
              loading={cancel.isPending}
            />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
    <ConfirmDialog
      visible={confirmingCancel}
      title={t.pickup.cancelConfirm}
      confirmLabel={t.pickup.cancel}
      destructive
      loading={cancel.isPending}
      onCancel={() => setConfirmingCancel(false)}
      onConfirm={cancelPickup}
    />
    </>
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
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg },
  loadingText: typography.bodyMuted,
  stateBlock: { marginHorizontal: spacing.lg, marginTop: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addressTitle: {
    flex: 1,
    marginRight: spacing.xs,
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral900,
  },
  coords: { marginTop: spacing.xs, ...typography.body, color: colors.neutral700 },
  mt12: { marginTop: spacing.sm },
  sectionLabel: typography.overline,
  sectionValue: { marginTop: spacing.xxs, fontSize: 16, color: colors.neutral900 },
  metaRow: { marginTop: spacing.sm, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xl },
  metaCol: { minWidth: 120 },
  notesWrap: { marginTop: spacing.sm },
  btnWrap: { marginTop: spacing.xl },
  receiptNote: { marginTop: spacing.xs, ...typography.caption, textAlign: 'center' },
});
