import { StyleSheet, Text, View } from 'react-native';
import type { RadarPickupDto } from '@bingo/shared-types';
import { formatBearing, formatDistanceMeters } from '../../lib/geo/format';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { colors, radius, spacing, typography } from '../../theme';
import { t } from '../../i18n';
import { materialVisual } from './materialVisual';

export interface RadarPickupCardProps {
  pickup: RadarPickupDto;
  selected: boolean;
  onPress: () => void;
  onAccept: () => void;
  accepting: boolean;
}

/**
 * Kartu permintaan pada daftar di bawah radar.
 *
 * Penanda material di kartu memakai huruf dan warna yang PERSIS sama dengan
 * titiknya di radar; itulah yang menghubungkan keduanya di mata pengguna.
 * Status terpilih ditandai border tebal dan teks "Dipilih di radar", bukan
 * hanya rona latar — layar murah di bawah matahari menelan perbedaan rona.
 */
export function RadarPickupCard({
  pickup,
  selected,
  onPress,
  onAccept,
  accepting,
}: RadarPickupCardProps) {
  const visual = materialVisual(pickup.materialType);
  const distance = formatDistanceMeters(pickup.distanceMeters);
  const direction = formatBearing(pickup.bearingDegrees);

  return (
    <View>
      <Card
        onPress={onPress}
        style={[rpS.card, selected ? rpS.cardSelected : null]}
        accessibilityState={{ selected }}
        accessibilityLabel={t.agent.nearby.markerLabel
          .replace('{material}', t.pickup.material_label[pickup.materialType])
          .replace('{weight}', String(pickup.estimatedWeightKg))
          .replace('{distance}', distance)
          .replace('{direction}', direction)}
        testID={`radar-card-${pickup.id}`}
      >
        <View style={rpS.headRow}>
          <View style={[rpS.badge, { backgroundColor: visual.color }]}>
            <Text style={rpS.badgeText} allowFontScaling={false}>
              {visual.letter}
            </Text>
          </View>
          <View style={rpS.headText}>
            <Text style={rpS.address} numberOfLines={2}>
              {pickup.address}
            </Text>
            <Text style={rpS.meta} numberOfLines={1}>
              {t.agent.nearby.ageAndCitizen
                .replace('{name}', pickup.citizenName)
                .replace('{age}', pickup.ageLabel)}
            </Text>
          </View>
        </View>

        <View style={rpS.statsRow}>
          <Text style={rpS.distance}>
            {distance} · {direction}
          </Text>
          <Text style={rpS.material} numberOfLines={1}>
            {t.pickup.material_label[pickup.materialType]} · {pickup.estimatedWeightKg} kg
          </Text>
        </View>

        {/* Permintaan bernilai tinggi ditandai, bukan disembunyikan, dari
            pemulung yang belum Tingkat 2: naik tingkat harus terlihat membuka
            pekerjaan yang nyata, bukan sekadar mengganti lencana. */}
        {pickup.highValue ? (
          <View style={rpS.highValuePill} testID={`radar-high-value-${pickup.id}`}>
            <Text style={rpS.highValueText}>{t.agent.verification.highValueBadge}</Text>
          </View>
        ) : null}

        {selected ? (
          <View style={rpS.selectedPill}>
            <Text style={rpS.selectedText}>{t.agent.nearby.selectedBadge}</Text>
          </View>
        ) : null}

        <View style={rpS.btnWrap}>
          <Button
            label={t.pickup.accept}
            onPress={onAccept}
            loading={accepting}
            testID={`accept-pickup-${pickup.id}`}
          />
        </View>
      </Card>
    </View>
  );
}

const rpS = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  cardSelected: {
    borderWidth: 2,
    borderColor: colors.bingo600,
    backgroundColor: colors.bingo100,
  },
  headRow: { flexDirection: 'row', alignItems: 'flex-start' },
  badge: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  badgeText: { fontSize: 13, fontWeight: '800', color: colors.white },
  headText: { flex: 1 },
  address: { ...typography.cardTitle, fontSize: 16 },
  meta: { marginTop: 2, ...typography.caption },
  statsRow: { marginTop: spacing.xs },
  distance: { ...typography.body, fontWeight: '700', color: colors.bingo700 },
  material: { marginTop: 2, ...typography.body, color: colors.neutral700 },
  selectedPill: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    backgroundColor: colors.bingo600,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  selectedText: { fontSize: 11, fontWeight: '700', color: colors.white },
  highValuePill: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    backgroundColor: colors.amber50,
    borderWidth: 1,
    borderColor: colors.amber100,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  highValueText: { fontSize: 11, fontWeight: '700', color: colors.amber800 },
  btnWrap: { marginTop: spacing.sm },
});
