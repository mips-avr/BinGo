import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { MATERIAL_GRADES, MaterialGrade, MaterialType } from '@bingo/shared-types';
import type { ScanResult, ScanSource } from '../../../src/features/scanner';
import { selectMaterialManually } from '../../../src/features/scanner';
import { MaterialPicker } from '../../../src/components/pickups/MaterialPicker';
import { ScanNextSteps } from '../../../src/components/scanner/ScanNextSteps';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { useBottomInset } from '../../../src/hooks/useBottomInset';
import { colors, radius, spacing, typography } from '../../../src/theme';
import { t } from '../../../src/i18n';

const MATERIAL_VALUES = Object.values(MaterialType) as MaterialType[];
const GRADE_VALUES = Object.values(MaterialGrade) as MaterialGrade[];
const SOURCES: ScanSource[] = ['resin-code', 'visual-estimate', 'manual'];

function parseSource(raw: string | undefined): ScanSource {
  return SOURCES.includes(raw as ScanSource) ? (raw as ScanSource) : 'visual-estimate';
}

export default function ScanResultScreen() {
  const router = useRouter();
  const bottomInset = useBottomInset();
  const params = useLocalSearchParams<{
    materialType: string;
    materialGrade: string;
    source: string;
    confident: string;
    visualScore: string;
    resinCode: string;
    disposalTip: string;
    pointsHint: string;
  }>();

  /** Hasil awal dari layar pemindai, sebelum koreksi manual apa pun. */
  const initial = useMemo<ScanResult>(() => {
    const material = MATERIAL_VALUES.includes(params.materialType as MaterialType)
      ? (params.materialType as MaterialType)
      : MaterialType.MIXED;
    const score = params.visualScore ? Number(params.visualScore) : NaN;
    const grade = GRADE_VALUES.includes(params.materialGrade as MaterialGrade)
      ? (params.materialGrade as MaterialGrade)
      : null;
    return {
      materialType: material,
      materialGrade: grade,
      source: parseSource(params.source),
      confident: params.confident === '1',
      visualScore: Number.isFinite(score) ? score : null,
      resinCode: params.resinCode ? Number(params.resinCode) : null,
      disposalTip: params.disposalTip || null,
      pointsHint: Number(params.pointsHint ?? 0),
    };
  }, [
    params.materialType,
    params.materialGrade,
    params.source,
    params.confident,
    params.visualScore,
    params.resinCode,
    params.disposalTip,
    params.pointsHint,
  ]);

  const [corrected, setCorrected] = useState<ScanResult | null>(null);
  const [picking, setPicking] = useState(false);
  const result = corrected ?? initial;
  const materialLabel = result.materialGrade
    ? MATERIAL_GRADES[result.materialGrade].label
    : t.pickup.material_label[result.materialType];

  function applyCorrection(material: MaterialType) {
    setCorrected(selectMaterialManually(material));
    setPicking(false);
  }

  const sourceLabel =
    result.source === 'resin-code'
      ? t.scanner.sourceResin
      : result.source === 'manual'
        ? t.scanner.sourceManual
        : t.scanner.sourceVisual;

  const sourceDetail =
    result.source === 'resin-code'
      ? t.scanner.sourceResinDetail.replace('{code}', String(result.resinCode ?? '—'))
      : result.source === 'manual'
        ? t.scanner.sourceManualDetail
        : t.scanner.sourceVisualDetail;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title={t.scanner.resultTitle} />
      <ScrollView contentContainerStyle={[s.scrollContent, { paddingBottom: bottomInset }]}>
        {/* ── Jenis material ──
            Ketika sistem tidak yakin, jenis material TIDAK ditampilkan sebagai
            judul besar. Yang muncul adalah pernyataan bahwa BinGo belum yakin,
            dan dugaannya diturunkan menjadi satu baris kecil. */}
        {result.confident ? (
          <Card>
            <Text style={s.sectionLabel}>{t.scanner.result.material}</Text>
            <Text style={s.materialText}>{materialLabel}</Text>
          </Card>
        ) : (
          <Card style={s.unsureCard} testID="scan-not-confident">
            <View style={s.unsureHead}>
              <Feather name="help-circle" size={20} color={colors.amber800} />
              <Text style={s.unsureTitle}>{t.scanner.notConfidentTitle}</Text>
            </View>
            <Text style={s.unsureBody}>{t.scanner.notConfidentBody}</Text>
            <Text style={s.unsureGuess}>
              {t.scanner.notConfidentGuess.replace(
                '{material}',
                t.pickup.material_label[result.materialType],
              )}
            </Text>
          </Card>
        )}

        {/* ── Asal hasil ── */}
        <Card style={s.mt12}>
          <Text style={s.sectionLabel}>{t.scanner.sourceTitle}</Text>
          <Text style={s.sourceLabel}>{sourceLabel}</Text>
          <Text style={s.sourceDetail}>{sourceDetail}</Text>
          {/* Angka hanya muncul untuk tahap visual dan sudah dikalibrasi pada
              validation set sebelum threshold ditentukan. */}
          {result.source === 'visual-estimate' && result.visualScore != null ? (
            <Text style={s.scoreText}>
              {t.scanner.visualSeparation.replace(
                '{percent}',
                String(Math.round(result.visualScore * 100)),
              )}
            </Text>
          ) : null}
        </Card>

        {/* ── Cara pembuangan ── */}
        {result.disposalTip ? (
          <Card style={s.mt12}>
            <Text style={s.sectionLabel}>{t.scanner.result.disposal}</Text>
            <Text style={s.disposalText}>{result.disposalTip}</Text>
          </Card>
        ) : (
          <Card style={[s.mt12, s.heldCard]}>
            <Text style={s.sectionLabel}>{t.scanner.result.disposal}</Text>
            <Text style={s.heldText}>{t.scanner.disposalHeld}</Text>
          </Card>
        )}

        {/*
          ── Berapa nilainya, dan ke mana dibawa ──

          Hanya muncul ketika hasilnya meyakinkan. Menampilkan harga di bawah
          tebakan yang belum pasti akan membuat angkanya terbaca sebagai janji,
          dan orang berangkat membawa barangnya berdasarkan dugaan yang salah.
          Ini aturan yang sama seperti penahanan tip pembuangan di atas.
        */}
        {result.confident ? (
          <ScanNextSteps
            materialType={result.materialType}
            materialGrade={result.materialGrade}
          />
        ) : null}

        {/* ── Koreksi manual ── */}
        {picking ? (
          <Card style={s.mt12} testID="scan-material-picker">
            <Text style={s.sectionLabel}>{t.scanner.chooseManualTitle}</Text>
            <View style={s.pickerWrap}>
              <MaterialPicker value={result.materialType} onChange={applyCorrection} />
            </View>
            <Button
              label={t.common.cancel}
              variant="ghost"
              onPress={() => setPicking(false)}
              testID="scan-correct-cancel"
            />
          </Card>
        ) : (
          <Card style={s.mt12}>
            <Text style={s.correctPrompt}>{t.scanner.notThis}</Text>
            <Button
              label={t.scanner.chooseManual}
              variant="secondary"
              onPress={() => setPicking(true)}
              testID="scan-correct-open"
            />
            {corrected ? (
              <View style={s.correctedNote}>
                <Text style={s.correctedTitle}>{t.scanner.correctedTitle}</Text>
                <Text style={s.correctedBody}>{t.scanner.correctedBody}</Text>
              </View>
            ) : null}
          </Card>
        )}

        {/* Poin edukasi hanya ditampilkan bila jenis materialnya sudah pasti;
            memberi angka poin untuk tebakan yang belum tentu benar mengubah
            keraguan menjadi hadiah. */}
        {result.confident ? (
          <Card style={[s.mt12, s.pointsCard]}>
            <Text style={s.sectionLabel}>{t.scanner.result.points}</Text>
            <Text style={s.pointsText}>+{result.pointsHint}</Text>
          </Card>
        ) : null}

        <View style={s.btnGroup}>
          <Button
            label={t.scanner.useForPickup}
            // Permintaan penjemputan menuntut jenis material yang pasti, jadi
            // tombolnya baru hidup setelah materialnya dipastikan — lewat kode
            // resin, dugaan yang cukup kuat, atau pilihan pengguna sendiri.
            disabled={!result.confident}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/pickups/new',
                params: { materialType: result.materialType },
              })
            }
            testID="scan-use-for-pickup"
          />
          <Button
            label={t.scanner.scanAgain}
            variant="secondary"
            onPress={() => router.replace('/(tabs)/scanner')}
            testID="scan-again"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  scrollContent: { paddingHorizontal: spacing.lg },
  sectionLabel: typography.overline,
  materialText: { marginTop: spacing.xxs, ...typography.screenTitle, color: colors.bingo700 },
  unsureCard: { backgroundColor: colors.amber50, borderColor: colors.amber100 },
  unsureHead: { flexDirection: 'row', alignItems: 'center' },
  unsureTitle: {
    marginLeft: spacing.xs,
    fontSize: 17,
    fontWeight: '800',
    color: colors.amber800,
  },
  unsureBody: {
    marginTop: spacing.xs,
    fontSize: 14,
    color: colors.neutral800,
    lineHeight: 20,
  },
  unsureGuess: { marginTop: spacing.xs, ...typography.caption, fontStyle: 'italic' },
  sourceLabel: {
    marginTop: spacing.xxs,
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral900,
  },
  sourceDetail: { marginTop: spacing.xxs, ...typography.bodyMuted },
  scoreText: { marginTop: spacing.xs, ...typography.caption },
  mt12: { marginTop: spacing.sm },
  disposalText: { marginTop: spacing.xs, fontSize: 16, lineHeight: 24, color: colors.neutral800 },
  heldCard: { backgroundColor: colors.neutral50 },
  heldText: { marginTop: spacing.xs, ...typography.bodyMuted },
  pickerWrap: { marginTop: spacing.xs },
  correctPrompt: { marginBottom: spacing.xs, ...typography.cardTitle },
  correctedNote: {
    marginTop: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.bingo100,
    padding: spacing.sm,
  },
  correctedTitle: { fontSize: 13, fontWeight: '700', color: colors.bingo800 },
  correctedBody: { marginTop: 2, fontSize: 12, color: colors.neutral700, lineHeight: 18 },
  pointsCard: { backgroundColor: colors.bingo100 },
  pointsText: {
    marginTop: spacing.xxs,
    ...typography.numeric,
    fontSize: 20,
    color: colors.bingo700,
  },
  btnGroup: { marginTop: spacing.xl, gap: spacing.sm },
});
