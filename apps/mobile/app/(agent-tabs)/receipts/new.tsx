import { useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { formatIDR } from '@bingo/shared-utils';
import { useCreateReceipt } from '../../../src/features/weighing/hooks';
import {
  emptyLine,
  hasErrors,
  previewLine,
  previewTotals,
  toCreateRequest,
  validateDraft,
  type DraftLine,
  type DraftReceipt,
} from '../../../src/features/weighing/draft';
import { Feather } from '@expo/vector-icons';
import { GradePicker } from '../../../src/components/weighing/GradePicker';
import { RegionAutocomplete } from '../../../src/components/weighing/RegionAutocomplete';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { Input } from '../../../src/components/ui/Input';
import { KeyboardAvoider } from '../../../src/components/ui/KeyboardAvoider';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { useBottomInset } from '../../../src/hooks/useBottomInset';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { colors, radius, spacing, touch, typography } from '../../../src/theme';
import { t } from '../../../src/i18n';

export default function NewReceiptScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    sellerId?: string;
    pickupRequestId?: string;
    region?: string;
  }>();
  const create = useCreateReceipt();
  const bottomInset = useBottomInset();

  /**
   * Penghitung monotonik untuk kunci baris.
   *
   * Kunci sebelumnya diturunkan dari panjang array (`line-${n}-${n}`), sehingga
   * urutan tambah → hapus baris pertama → tambah menghasilkan kunci yang sudah
   * dipakai. `patchLine` mencocokkan berdasarkan kunci, jadi dua baris berbeda
   * ikut berubah bersamaan: mengetik berat di satu baris diam-diam menimpa
   * baris lain. Ini layar yang menghitung uang — kunci harus unik seumur layar.
   */
  const nextLineId = useRef(1);

  const [draft, setDraft] = useState<DraftReceipt>({
    partnerName: '',
    region: params.region ?? '',
    scaleTeraNo: '',
    notes: '',
    lines: [emptyLine('line-0')],
  });
  const [touched, setTouched] = useState(false);

  /**
   * Setoran langsung: pemulung membeli dari orang yang datang sendiri, tanpa
   * permintaan penjemputan di aplikasi.
   *
   * Layar ini dulu menuntut `params.sellerId` dan kalau tidak ada hanya
   * menampilkan "Buka dari detail pekerjaan" — sehingga alur yang paling umum
   * di lapangan tidak dapat menerbitkan bukti sama sekali, dan justru transaksi
   * yang paling rawan sengketa yang tidak pernah tercatat.
   */
  const fromPickup = Boolean(params.pickupRequestId && params.sellerId);
  const [walkInSellerId, setWalkInSellerId] = useState('');
  const sellerId = fromPickup ? (params.sellerId as string) : walkInSellerId.trim();
  const sellerMissing = !fromPickup && sellerId.length === 0;

  const errors = useMemo(() => validateDraft(draft), [draft]);
  const totals = useMemo(() => previewTotals(draft.lines), [draft.lines]);
  const invalid = hasErrors(errors);

  function patch(next: Partial<DraftReceipt>) {
    setDraft((prev) => ({ ...prev, ...next }));
  }

  function patchLine(key: string, next: Partial<DraftLine>) {
    setDraft((prev) => ({
      ...prev,
      lines: prev.lines.map((l) => (l.key === key ? { ...l, ...next } : l)),
    }));
  }

  function addLine() {
    const key = `line-${nextLineId.current}`;
    nextLineId.current += 1;
    setDraft((prev) => ({
      ...prev,
      lines: [...prev.lines, emptyLine(key)],
    }));
  }

  function removeLine(key: string) {
    setDraft((prev) => ({
      ...prev,
      lines: prev.lines.length === 1 ? prev.lines : prev.lines.filter((l) => l.key !== key),
    }));
  }

  async function submit() {
    setTouched(true);
    if (invalid) return;
    if (sellerMissing) {
      Alert.alert(t.common.error, t.weighing.walkInSellerRequired);
      return;
    }
    try {
      // `toCreateRequest` menandai `walkIn: true` sendiri ketika tidak ada
      // `pickupRequestId` — itulah yang diminta kontrak backend.
      const receipt = await create.mutateAsync(
        toCreateRequest(draft, sellerId, fromPickup ? params.pickupRequestId : undefined),
      );
      Alert.alert(t.common.success, t.weighing.issueSuccess, [
        {
          text: t.common.ok,
          onPress: () => router.replace(`/(agent-tabs)/receipts/${receipt.id}`),
        },
      ]);
    } catch (err) {
      Alert.alert(t.common.error, extractApiErrorMessage(err, t.common.error));
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title={t.weighing.newTitle} />
      {/* `behavior={undefined}` di Android membuat KeyboardAvoidingView tidak
          melakukan apa pun; `KeyboardAvoider` memakai 'height' di sana. */}
      <KeyboardAvoider>
        <ScrollView
          contentContainerStyle={[s.content, { paddingBottom: bottomInset + spacing.md }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Asal bukti diumumkan lebih dulu dan tidak bisa dilewatkan: ia
              menentukan apakah bukti ini ikut menyusun papan harga. */}
          {fromPickup ? (
            <Card style={s.originCard}>
              <View style={s.originHead}>
                <Feather name="truck" size={16} color={colors.bingo800} />
                <Text style={s.originTitle}>{t.weighing.fromPickupTitle}</Text>
              </View>
              <Text style={s.originBody}>{t.weighing.fromPickupBody}</Text>
            </Card>
          ) : (
            <Card style={s.walkInCard} testID="walk-in-banner">
              <View style={s.originHead}>
                <Feather name="alert-circle" size={16} color={colors.amber800} />
                <Text style={s.walkInTitle}>{t.weighing.walkInTitle}</Text>
              </View>
              <Text style={s.walkInToggle}>{t.weighing.walkInToggle}</Text>
              <Text style={s.originBody}>{t.weighing.walkInExplain}</Text>
              <View style={s.walkInSellerWrap}>
                <Input
                  label={t.weighing.walkInSellerLabel}
                  value={walkInSellerId}
                  onChangeText={setWalkInSellerId}
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={touched && sellerMissing ? t.weighing.walkInSellerRequired : null}
                  testID="walk-in-seller-id"
                />
                <Text style={s.hint}>{t.weighing.walkInSellerHint}</Text>
              </View>
            </Card>
          )}

          <Card style={s.mt12}>
            <Input
              label={t.weighing.partnerName}
              placeholder={t.weighing.partnerNamePlaceholder}
              value={draft.partnerName}
              onChangeText={(v) => patch({ partnerName: v })}
              error={touched ? errors.partnerName : null}
              testID="partner-name"
            />
            {/* Wilayah memakai autocomplete yang sama dengan papan harga, agar
                ejaan penerbit jatuh ke kunci wilayah yang sudah ada. Ejaan yang
                meleset berarti bukti ini membentuk wilayah sendiri dan tidak
                pernah mencapai ambang minimum papan harga. */}
            <RegionAutocomplete
              value={draft.region}
              onChange={(v) => patch({ region: v })}
              label={t.weighing.region}
              testID="region"
            />
            {touched && errors.region ? (
              <Text style={s.error} accessibilityLiveRegion="polite">
                {errors.region}
              </Text>
            ) : null}
            <Input
              label={t.weighing.scaleTeraNo}
              value={draft.scaleTeraNo}
              onChangeText={(v) => patch({ scaleTeraNo: v })}
              autoCapitalize="characters"
              testID="tera-no"
            />
            <Text style={s.hint}>{t.weighing.scaleTeraNoHint}</Text>
          </Card>

          <Text style={s.sectionTitle}>{t.weighing.lines}</Text>

          {draft.lines.map((line, index) => {
            const preview = previewLine(line);
            const lineError = touched ? errors.lines[line.key] : undefined;
            const showDeductionReason =
              Number(line.deductionKg || 0) > 0 || Number(line.deductionAmount || 0) > 0;
            return (
              <Card key={line.key} style={s.lineCard}>
                <View style={s.lineHead}>
                  <Text style={s.lineIndex}>#{index + 1}</Text>
                  {draft.lines.length > 1 ? (
                    <Pressable
                      onPress={() => removeLine(line.key)}
                      accessibilityRole="button"
                      accessibilityLabel={`${t.weighing.removeLine} #${index + 1}`}
                      hitSlop={spacing.xs}
                      style={s.removeBtn}
                      testID={`remove-${line.key}`}
                    >
                      <Text style={s.remove}>{t.weighing.removeLine}</Text>
                    </Pressable>
                  ) : null}
                </View>

                <GradePicker
                  value={line.grade}
                  onChange={(grade) => patchLine(line.key, { grade })}
                  testID={`grade-picker-${line.key}`}
                />

                <View style={s.row2}>
                  <View style={s.col}>
                    <Input
                      label={t.weighing.weightKg}
                      value={line.weightKg}
                      onChangeText={(v) => patchLine(line.key, { weightKg: v })}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      testID={`weight-${line.key}`}
                    />
                  </View>
                  <View style={s.col}>
                    <Input
                      label={t.weighing.pricePerKg}
                      value={line.pricePerKg}
                      onChangeText={(v) => patchLine(line.key, { pricePerKg: v })}
                      keyboardType="number-pad"
                      placeholder="0"
                      testID={`price-${line.key}`}
                    />
                  </View>
                </View>

                <View style={s.row2}>
                  <View style={s.col}>
                    <Input
                      label={t.weighing.deductionKg}
                      value={line.deductionKg}
                      onChangeText={(v) => patchLine(line.key, { deductionKg: v })}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      testID={`deduction-kg-${line.key}`}
                    />
                  </View>
                  <View style={s.col}>
                    <Input
                      label={t.weighing.deductionAmount}
                      value={line.deductionAmount}
                      onChangeText={(v) => patchLine(line.key, { deductionAmount: v })}
                      keyboardType="number-pad"
                      placeholder="0"
                      testID={`deduction-amount-${line.key}`}
                    />
                  </View>
                </View>

                {showDeductionReason ? (
                  <>
                    <Input
                      label={t.weighing.deductionReason}
                      value={line.deductionReason}
                      onChangeText={(v) => patchLine(line.key, { deductionReason: v })}
                      testID={`deduction-reason-${line.key}`}
                    />
                    <Text style={s.hint}>{t.weighing.deductionReasonRequired}</Text>
                  </>
                ) : null}

                <View style={s.previewBox}>
                  <View style={s.kv}>
                    <Text style={s.k}>{t.weighing.netWeight}</Text>
                    <Text style={s.v}>{preview.netWeightKg} kg</Text>
                  </View>
                  <View style={s.kv}>
                    <Text style={s.k}>{t.weighing.grossAmount}</Text>
                    <Text style={s.v}>{formatIDR(preview.grossAmount)}</Text>
                  </View>
                  <View style={s.kv}>
                    <Text style={s.kStrong}>{t.weighing.subtotal}</Text>
                    <Text style={s.vStrong}>{formatIDR(preview.subtotal)}</Text>
                  </View>
                </View>

                {lineError ? (
                  <Text style={s.error} accessibilityLiveRegion="polite">
                    {lineError}
                  </Text>
                ) : null}
              </Card>
            );
          })}

          <Button
            label={t.weighing.addLine}
            variant="secondary"
            onPress={addLine}
            testID="add-line"
            style={s.addLineBtn}
          />

          <Card style={s.totalCard}>
            <View style={s.kv}>
              <Text style={s.k}>{t.weighing.totalWeight}</Text>
              <Text style={s.v}>{totals.totalWeightKg} kg</Text>
            </View>
            <View style={s.kv}>
              <Text style={s.k}>{t.weighing.netWeight}</Text>
              <Text style={s.v}>{totals.totalNetWeightKg} kg</Text>
            </View>
            <View style={s.kv}>
              <Text style={s.k}>{t.weighing.totalDeduction}</Text>
              <Text style={s.v}>{formatIDR(totals.totalDeductionAmount)}</Text>
            </View>
            <View style={s.kv}>
              <Text style={s.totalLabel}>{t.weighing.totalNet}</Text>
              <Text style={s.totalValue}>{formatIDR(totals.totalNetAmount)}</Text>
            </View>
          </Card>

          <Input
            label={t.weighing.notes}
            value={draft.notes}
            onChangeText={(v) => patch({ notes: v })}
            multiline
            testID="notes"
          />

          {/* Pengingat terakhir tepat di atas tombol terbit: setelah ini
              angkanya menjadi catatan resmi dua pihak. */}
          {!fromPickup ? <Text style={s.walkInFooter}>{t.weighing.walkInBadge}</Text> : null}

          <Button
            label={t.weighing.issue}
            onPress={submit}
            loading={create.isPending}
            disabled={touched && (invalid || sellerMissing)}
            testID="issue-receipt"
            style={s.issueBtn}
          />
        </ScrollView>
      </KeyboardAvoider>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  content: { paddingHorizontal: spacing.lg },
  hint: { marginTop: -6, marginBottom: spacing.xs, ...typography.caption },
  mt12: { marginTop: spacing.sm },
  originCard: { backgroundColor: colors.bingo100, borderColor: colors.bingo200 },
  originHead: { flexDirection: 'row', alignItems: 'center' },
  originTitle: {
    marginLeft: spacing.xs,
    fontSize: 14,
    fontWeight: '800',
    color: colors.bingo800,
  },
  originBody: {
    marginTop: spacing.xxs + 2,
    fontSize: 12,
    color: colors.neutral700,
    lineHeight: 18,
  },
  walkInCard: { backgroundColor: colors.amber50, borderColor: colors.amber100 },
  walkInTitle: {
    marginLeft: spacing.xs,
    fontSize: 14,
    fontWeight: '800',
    color: colors.amber800,
  },
  walkInToggle: {
    marginTop: spacing.xxs,
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral800,
  },
  walkInSellerWrap: { marginTop: spacing.sm },
  walkInFooter: {
    marginTop: spacing.md,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: colors.amber800,
  },
  sectionTitle: {
    marginTop: spacing.lg,
    marginBottom: 10,
    ...typography.sectionTitle,
  },
  lineCard: { marginBottom: spacing.sm },
  removeBtn: { minHeight: touch.minTarget, justifyContent: 'center', paddingLeft: spacing.xs },
  addLineBtn: { marginTop: spacing.xs },
  issueBtn: { marginTop: spacing.md },
  lineHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  lineIndex: { fontSize: 13, fontWeight: '700', color: colors.neutral500 },
  remove: { fontSize: 13, fontWeight: '600', color: colors.red600 },
  row2: { flexDirection: 'row', marginHorizontal: -6 },
  col: { flex: 1, paddingHorizontal: 6 },
  previewBox: {
    marginTop: spacing.xxs,
    borderRadius: radius.sm,
    backgroundColor: colors.neutral50,
    borderWidth: 1,
    borderColor: colors.neutral200,
    padding: 12,
  },
  kv: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  k: { flex: 1, marginRight: spacing.sm, fontSize: 13, color: colors.neutral600 },
  kStrong: {
    flex: 1,
    marginRight: spacing.sm,
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral800,
  },
  v: { ...typography.numeric, fontSize: 13, fontWeight: '400' },
  vStrong: { ...typography.numeric, fontSize: 15, fontWeight: '800', color: colors.bingo700 },
  error: { marginTop: spacing.xs, fontSize: 13, color: colors.red600 },
  totalCard: { marginTop: spacing.md, marginBottom: spacing.xs },
  totalLabel: {
    flex: 1,
    marginRight: spacing.sm,
    fontSize: 16,
    fontWeight: '800',
    color: colors.neutral900,
  },
  totalValue: { ...typography.numeric, fontSize: 18, fontWeight: '800', color: colors.bingo700 },
});
