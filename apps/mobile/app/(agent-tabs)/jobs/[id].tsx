import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { formatWaktuID } from '@bingo/shared-utils';
import {
  useCompletePickup,
  usePickup,
  useReleasePickup,
  useStartPickup,
} from '../../../src/features/pickups/hooks';
import { useReceiptForPickup } from '../../../src/features/weighing/hooks';
import {
  VerificationGate,
  type VerificationGateReason,
} from '../../../src/components/agent/VerificationGate';
import { useAuthStore } from '../../../src/store/authStore';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { useBottomInset } from '../../../src/hooks/useBottomInset';
import { openInMaps } from '../../../src/lib/maps';
import { colors, spacing, typography } from '../../../src/theme';
import { t } from '../../../src/i18n';

export default function AgentJobDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const query = usePickup(id);
  const complete = useCompletePickup();
  const start = useStartPickup();
  const release = useReleasePickup();
  const { receipt, loading: receiptLoading } = useReceiptForPickup(id);
  const bottomInset = useBottomInset();
  const [openingMap, setOpeningMap] = useState(false);

  // Penerbitan bukti timbang juga menuntut Tingkat 1. Biasanya pemulung di sini
  // sudah Tingkat 1 — ia tidak akan bisa menerima pekerjaan ini kalau belum —
  // tetapi penjaminan dapat dicabut mitra selagi pekerjaan berjalan, dan pada
  // saat itulah penjelasan lebih berguna daripada galat 403.
  const verificationLevel = useAuthStore((s) => s.user?.verificationLevel ?? 0);
  const [gateReason, setGateReason] = useState<VerificationGateReason | null>(null);

  function confirmComplete() {
    Alert.alert(t.agent.jobs.completeConfirm, undefined, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.pickup.complete,
        onPress: async () => {
          try {
            await complete.mutateAsync(id);
            Alert.alert(t.common.success, t.agent.jobs.completeSuccess, [
              { text: t.common.ok, onPress: () => router.back() },
            ]);
          } catch (err) {
            Alert.alert(t.common.error, extractApiErrorMessage(err, t.common.error));
          }
        },
      },
    ]);
  }

  async function handleStart() {
    try {
      await start.mutateAsync(id);
      Alert.alert(t.common.success, t.agent.jobs.startSuccess);
    } catch (err) {
      Alert.alert(t.common.error, extractApiErrorMessage(err, t.common.error));
    }
  }

  /**
   * Melepas pekerjaan mengembalikan permintaan warga ke antrean umum, jadi ia
   * selalu lewat konfirmasi: menekannya tidak sengaja berarti kehilangan
   * pekerjaan yang sudah diamankan.
   */
  function confirmRelease() {
    Alert.alert(t.agent.jobs.releaseConfirmTitle, t.agent.jobs.releaseConfirmMessage, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.agent.jobs.release,
        style: 'destructive',
        onPress: async () => {
          try {
            await release.mutateAsync(id);
            Alert.alert(t.common.success, t.agent.jobs.releaseSuccess, [
              { text: t.common.ok, onPress: () => router.back() },
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
        <ErrorState
          message={extractApiErrorMessage(query.error, t.common.errorMessage)}
          onRetry={() => query.refetch()}
          style={s.stateBlock}
          testID="job-detail-error"
        />
      </SafeAreaView>
    );
  }

  const p = query.data;
  const canStart = p.status === 'ACCEPTED';
  const canRelease = p.status === 'ACCEPTED' || p.status === 'IN_PROGRESS';
  const canComplete = p.status === 'ACCEPTED' || p.status === 'IN_PROGRESS';

  async function handleOpenMap() {
    setOpeningMap(true);
    const ok = await openInMaps(p.location, p.address);
    setOpeningMap(false);
    if (!ok) Alert.alert(t.common.error, t.agent.jobs.openMapFailed);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title={t.pickup.detailTitle} subtitle={p.address} />
      <ScrollView contentContainerStyle={[s.scrollContent, { paddingBottom: bottomInset }]}>
        <Card>
          <View style={s.row}>
            <Text style={s.addressTitle}>{p.address}</Text>
            <StatusBadge status={p.status} domain="pickup" />
          </View>
          <Text style={s.coordsText}>
            📍 {p.location.lat.toFixed(5)}, {p.location.lng.toFixed(5)}
          </Text>
          {/* Koordinat mentah tidak menolong siapa pun yang sedang di jalan.
              Tombol ini menyerahkannya ke aplikasi peta bawaan perangkat. */}
          <Button
            label={t.agent.jobs.openMap}
            variant="secondary"
            size="sm"
            loading={openingMap}
            onPress={handleOpenMap}
            testID="open-in-maps"
            style={s.mapBtn}
          />
        </Card>

        <Card style={s.mt12}>
          <Text style={s.sectionLabel}>{t.pickup.material}</Text>
          <Text style={s.sectionValue}>{t.pickup.material_label[p.materialType]}</Text>
          <Text style={s.weightText}>{p.estimatedWeightKg} kg</Text>
          {p.notes ? <Text style={s.notesText}>{p.notes}</Text> : null}
          <Text style={s.dateText}>{formatWaktuID(p.createdAt)}</Text>
        </Card>

        {/* ── Transisi status ── */}
        {canStart ? (
          <View style={s.btnWrap}>
            <Button
              label={t.agent.jobs.start}
              onPress={handleStart}
              loading={start.isPending}
              testID="start-pickup"
            />
          </View>
        ) : null}

        {canComplete ? (
          <View style={s.btnWrap}>
            <Button
              label={t.pickup.complete}
              variant={canStart ? 'secondary' : 'primary'}
              onPress={confirmComplete}
              loading={complete.isPending}
              testID="complete-pickup"
            />
          </View>
        ) : null}

        {/* ── Bukti timbang ──
            Sebelumnya tombol "Timbang & terbitkan bukti" muncul pada setiap
            pekerjaan non-batal, berkali-kali, tanpa pengaman ganda: satu
            penjemputan bisa melahirkan beberapa bukti timbang. */}
        {p.status !== 'CANCELLED' ? (
          <View style={s.btnWrap}>
            {receiptLoading ? (
              <Button label={t.common.loading} variant="secondary" disabled onPress={() => {}} />
            ) : receipt ? (
              <>
                <Button
                  label={t.weighing.viewReceipt}
                  variant="secondary"
                  onPress={() => router.push(`/(agent-tabs)/receipts/${receipt.id}`)}
                  testID="view-receipt-from-job"
                />
                <Text style={s.issuedNote}>{t.weighing.alreadyIssued}</Text>
              </>
            ) : (
              <Button
                label={t.weighing.createFromJob}
                variant="secondary"
                onPress={() => {
                  if (verificationLevel < 1) {
                    setGateReason({ kind: 'needsAttestation' });
                    return;
                  }
                  router.push({
                    pathname: '/(agent-tabs)/receipts/new',
                    params: {
                      sellerId: p.citizenId,
                      pickupRequestId: p.id,
                      region: p.address,
                    },
                  });
                }}
                testID="issue-receipt-from-job"
              />
            )}
          </View>
        ) : null}

        {canRelease ? (
          <View style={s.btnWrap}>
            <Button
              label={t.agent.jobs.release}
              variant="ghost"
              onPress={confirmRelease}
              loading={release.isPending}
              testID="release-pickup"
            />
          </View>
        ) : null}
      </ScrollView>

      <VerificationGate reason={gateReason} onClose={() => setGateReason(null)} />
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
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addressTitle: {
    flex: 1,
    marginRight: spacing.xs,
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral900,
  },
  coordsText: { marginTop: spacing.xs, ...typography.body, color: colors.neutral700 },
  mapBtn: { marginTop: spacing.sm, alignSelf: 'flex-start', minWidth: 160 },
  mt12: { marginTop: spacing.sm },
  sectionLabel: typography.overline,
  sectionValue: { marginTop: spacing.xxs, fontSize: 16, color: colors.neutral900 },
  weightText: { marginTop: spacing.xs, ...typography.numeric, fontSize: 16, fontWeight: '600' },
  notesText: { marginTop: spacing.xs, ...typography.body, color: colors.neutral700 },
  dateText: { marginTop: spacing.sm, ...typography.caption },
  btnWrap: { marginTop: spacing.md },
  issuedNote: { marginTop: spacing.xs, ...typography.caption, textAlign: 'center' },
});
