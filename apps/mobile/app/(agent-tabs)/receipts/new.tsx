import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
import { GradePicker } from '../../../src/components/weighing/GradePicker';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { Input } from '../../../src/components/ui/Input';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { colors } from '../../../src/theme/screen';
import { t } from '../../../src/i18n';

export default function NewReceiptScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    sellerId?: string;
    pickupRequestId?: string;
    region?: string;
  }>();
  const create = useCreateReceipt();

  const [draft, setDraft] = useState<DraftReceipt>({
    partnerName: '',
    region: params.region ?? '',
    scaleTeraNo: '',
    notes: '',
    lines: [emptyLine('line-0')],
  });
  const [touched, setTouched] = useState(false);

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
    setDraft((prev) => ({
      ...prev,
      lines: [...prev.lines, emptyLine(`line-${prev.lines.length}-${prev.lines.length}`)],
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
    if (!params.sellerId) {
      Alert.alert(t.common.error, 'Penyetor tidak diketahui. Buka dari detail pekerjaan.');
      return;
    }
    try {
      const receipt = await create.mutateAsync(
        toCreateRequest(draft, params.sellerId, params.pickupRequestId),
      );
      Alert.alert(t.common.success, t.weighing.issueSuccess, [
        {
          text: 'OK',
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
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <Card>
            <Input
              label={t.weighing.partnerName}
              placeholder={t.weighing.partnerNamePlaceholder}
              value={draft.partnerName}
              onChangeText={(v) => patch({ partnerName: v })}
              error={touched ? errors.partnerName : null}
              testID="partner-name"
            />
            <Input
              label={t.weighing.region}
              placeholder={t.weighing.regionPlaceholder}
              value={draft.region}
              onChangeText={(v) => patch({ region: v })}
              error={touched ? errors.region : null}
              testID="region"
            />
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

                {lineError ? <Text style={s.error}>{lineError}</Text> : null}
              </Card>
            );
          })}

          <Button
            label={t.weighing.addLine}
            variant="secondary"
            onPress={addLine}
            testID="add-line"
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

          <Button
            label={t.weighing.issue}
            onPress={submit}
            loading={create.isPending}
            disabled={touched && invalid}
            testID="issue-receipt"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 48 },
  hint: { marginTop: -6, marginBottom: 8, fontSize: 12, color: colors.neutral600, lineHeight: 17 },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral900,
  },
  lineCard: { marginBottom: 12 },
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
    marginTop: 4,
    borderRadius: 12,
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
  k: { fontSize: 13, color: colors.neutral600 },
  kStrong: { fontSize: 14, fontWeight: '700', color: colors.neutral800 },
  v: { fontSize: 13, color: colors.neutral900 },
  vStrong: { fontSize: 15, fontWeight: '800', color: colors.bingo700 },
  error: { marginTop: 8, fontSize: 13, color: colors.red600 },
  totalCard: { marginTop: 16, marginBottom: 8 },
  totalLabel: { fontSize: 16, fontWeight: '800', color: colors.neutral900 },
  totalValue: { fontSize: 18, fontWeight: '800', color: colors.bingo700 },
});
