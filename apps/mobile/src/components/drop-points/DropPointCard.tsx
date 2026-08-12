import { memo, useCallback } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { DROP_POINT_OPERATOR_LABEL, type DropPointDto } from '@bingo/shared-types';

import { t } from '../../i18n';
import { colors, radius, spacing, typography } from '../../theme';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

function formatDistance(meters: number | null): string | null {
  if (meters == null) return null;
  if (meters < 1000) return t.dropPoint.distanceM.replace('{value}', String(meters));
  return t.dropPoint.distanceKm.replace('{value}', (meters / 1000).toFixed(1).replace('.', ','));
}

function formatVerified(iso: string): string {
  const d = new Date(iso);
  return t.dropPoint.verifiedAt.replace(
    '{date}',
    d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
  );
}

const REWARD_LABEL = {
  TUNAI: () => t.dropPoint.rewardCash,
  POIN: () => t.dropPoint.rewardPoints,
  TIDAK_ADA: () => t.dropPoint.rewardNone,
} as const;

export interface DropPointCardProps {
  point: DropPointDto;
}

/**
 * Satu titik setor.
 *
 * Tiga hal ditampilkan yang biasanya disembunyikan aplikasi sejenis, dan
 * ketiganya justru yang menentukan apakah perjalanan ke sana sepadan:
 *
 *   - **Bentuk imbalan.** Tunai dan poin bukan hal yang sama. Poin dinilai
 *     sepihak oleh operator dan tidak selalu bisa dicairkan.
 *   - **Berat minimum.** Ambang inilah yang menyingkirkan setoran harian yang
 *     kecil dan campur. Menyembunyikannya berarti mengirim orang pulang dengan
 *     tangan kosong.
 *   - **Tanggal verifikasi dan sumbernya.** Data ini kurasi manual, bukan umpan
 *     langsung. Pengguna berhak tahu ia mungkin sudah basi.
 */
export const DropPointCard = memo(function DropPointCard({ point }: DropPointCardProps) {
  const distance = formatDistance(point.distanceMeters);
  const isBingo = point.operator === 'BINGO_MITRA';

  const openExternal = useCallback(() => {
    if (point.externalUrl) void Linking.openURL(point.externalUrl);
  }, [point.externalUrl]);

  return (
    <Card style={s.card}>
      <View style={s.headerRow}>
        <View style={s.headerText}>
          <Text style={s.name}>{point.name}</Text>
          <Text style={s.operator}>
            {isBingo
              ? DROP_POINT_OPERATOR_LABEL[point.operator]
              : t.dropPoint.operatorNotice.replace(
                  '{operator}',
                  point.operatorName ?? DROP_POINT_OPERATOR_LABEL[point.operator],
                )}
          </Text>
        </View>
        {distance ? (
          <View style={s.distancePill}>
            <Text style={s.distanceText}>{distance}</Text>
          </View>
        ) : null}
      </View>

      <Text style={s.address}>{point.address}</Text>

      <View style={s.factRow}>
        <Feather name="dollar-sign" size={14} color={colors.neutral600} />
        <Text style={s.fact}>{REWARD_LABEL[point.reward]()}</Text>
      </View>
      <View style={s.factRow}>
        <Feather name="package" size={14} color={colors.neutral600} />
        <Text style={s.fact}>
          {point.minWeightKg == null
            ? t.dropPoint.noMinWeight
            : t.dropPoint.minWeight.replace('{value}', String(point.minWeightKg))}
        </Text>
      </View>
      {point.openingNote ? (
        <View style={s.factRow}>
          <Feather name="clock" size={14} color={colors.neutral600} />
          <Text style={s.fact}>{point.openingNote}</Text>
        </View>
      ) : null}

      {point.acceptedMaterials.length > 0 ? (
        <>
          <Text style={s.sectionLabel}>{t.dropPoint.accepts}</Text>
          <View style={s.chipRow}>
            {point.acceptedMaterials.map((m) => (
              <View key={m} style={s.chip}>
                <Text style={s.chipText}>{t.pickup.material_label[m] ?? m}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {point.note ? <Text style={s.note}>{point.note}</Text> : null}

      {point.externalUrl ? (
        <Button
          label={t.dropPoint.openExternal}
          variant="secondary"
          onPress={openExternal}
          style={s.cta}
        />
      ) : null}

      <Text style={s.provenance}>
        {formatVerified(point.verifiedAt)} · {t.dropPoint.source}
      </Text>
    </Card>
  );
});

const s = StyleSheet.create({
  card: { marginTop: spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  headerText: { flex: 1 },
  name: { ...typography.cardTitle },
  operator: { ...typography.caption, color: colors.neutral600, marginTop: 2 },
  distancePill: {
    backgroundColor: colors.bingo50,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  distanceText: { ...typography.caption, color: colors.bingo700, fontWeight: '700' },
  address: { ...typography.bodyMuted, marginTop: spacing.xs },
  factRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xxs },
  fact: { ...typography.caption, color: colors.neutral700, flex: 1 },
  sectionLabel: {
    ...typography.overline,
    color: colors.neutral600,
    marginTop: spacing.sm,
    marginBottom: spacing.xxs,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xxs },
  chip: {
    backgroundColor: colors.neutral100,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
  },
  chipText: { ...typography.caption, color: colors.neutral800 },
  note: { ...typography.caption, color: colors.neutral600, marginTop: spacing.sm },
  cta: { marginTop: spacing.sm },
  provenance: { ...typography.caption, color: colors.neutral500, marginTop: spacing.xs },
});
