import { useContext, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NavigationContext } from '@react-navigation/native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import type { RadarPickupDto } from '@bingo/shared-types';
import { formatBearing, formatDistanceMeters } from '../../lib/geo/format';
import { colors, radius, spacing, touch, typography } from '../../theme';
import { t } from '../../i18n';
import { markerRadiusForWeight, materialVisual } from './materialVisual';

/** Ambang ergonomi sentuh; titik kecil dilebarkan lewat `hitSlop` sampai ke sini. */
const touchTarget = touch.minTarget;

/**
 * Apakah layar yang memuat radar sedang tampil.
 *
 * Sengaja tidak memakai `useIsFocused()` dari React Navigation: hook itu
 * melempar bila komponennya dirender di luar sebuah navigator. Radar adalah
 * komponen presentasional dan harus bisa dirender di mana saja — di layar
 * pratinjau, di dalam modal, atau di harness pengujian — tanpa merusak
 * aplikasi. Tanpa navigator, radar dianggap tampil.
 */
function useScreenFocused(): boolean {
  const navigation = useContext(NavigationContext);
  const [focused, setFocused] = useState(true);

  useEffect(() => {
    if (!navigation) return;
    setFocused(navigation.isFocused());
    const unsubscribeFocus = navigation.addListener('focus', () => setFocused(true));
    const unsubscribeBlur = navigation.addListener('blur', () => setFocused(false));
    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation]);

  return focused;
}

export interface RadarViewProps {
  pickups: RadarPickupDto[];
  /** Radius yang sedang dipilih, dalam kilometer. Menentukan skala cincin. */
  radiusKm: number;
  /** Lebar tersedia dalam dp; radar selalu bujur sangkar. */
  size: number;
  selectedId: string | null;
  onSelect: (pickup: RadarPickupDto) => void;
}

/** Berapa cincin jarak yang digambar (tidak termasuk titik pusat). */
const RING_COUNT = 3;
/** Ruang di tepi untuk label jarak dan penanda mata angin. */
const EDGE_PADDING = 26;

interface PlottedMarker {
  pickup: RadarPickupDto;
  /** Koordinat layar relatif terhadap pusat radar. */
  x: number;
  y: number;
  r: number;
  letter: string;
  color: string;
  label: string;
}

/**
 * Radar geospasial permintaan penjemputan.
 *
 * Sengaja BUKAN peta. `react-native-maps` di Android menuntut kunci Google Maps
 * yang harus ditanam saat build; APK yang dipasang juri akan menampilkan petak
 * abu-abu kosong bila kuncinya tidak ada atau kuotanya habis. Plot polar dengan
 * `react-native-svg` — yang ikut terbundel di Expo Go dan tidak butuh kunci apa
 * pun — memberi informasi yang sebenarnya dibutuhkan pemulung di jalan: seberapa
 * jauh, ke arah mana, seberat apa, dan sudah berapa lama menunggu.
 *
 * Konversi sudut: `bearingDegrees` memakai konvensi kompas (0° = utara, searah
 * jarum jam), sedangkan sumbu layar SVG punya 0° di arah timur dan y menghadap
 * ke bawah. Karena itu sudut layar = bearing − 90°, dan komponen y tetap
 * ditambahkan (bukan dikurangi) karena y layar tumbuh ke bawah.
 */
export function RadarView({ pickups, radiusKm, size, selectedId, onSelect }: RadarViewProps) {
  const isFocused = useScreenFocused();
  const center = size / 2;
  const outerRadius = Math.max(40, center - EDGE_PADDING);
  const rangeMeters = radiusKm * 1000;

  // ── Sapuan lembut ──
  // Reanimated menjalankan animasi ini di thread UI, jadi tidak ada satu pun
  // render React per frame — bandingkan dengan `setInterval` yang memaksa
  // rekonsiliasi seluruh pohon puluhan kali per detik. Ia berhenti total saat
  // layar kehilangan fokus; radar yang berputar di latar belakang hanya
  // membakar baterai pemulung tanpa memberi informasi apa pun.
  //
  // Yang diputar adalah View pembungkus, bukan elemen <G> di dalam SVG.
  // `transform` pada View adalah jalur animasi yang paling matang di
  // Reanimated dan tidak bergantung pada dukungan animated-props react-native-svg.
  const sweep = useSharedValue(0);
  useEffect(() => {
    if (!isFocused) {
      cancelAnimation(sweep);
      return;
    }
    sweep.value = 0;
    sweep.value = withRepeat(withTiming(360, { duration: 4000, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(sweep);
  }, [isFocused, sweep]);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sweep.value}deg` }],
  }));

  const maxWeightKg = useMemo(
    () => pickups.reduce((max, p) => Math.max(max, p.estimatedWeightKg), 0),
    [pickups],
  );

  const markers = useMemo<PlottedMarker[]>(() => {
    return pickups.map((pickup) => {
      // Titik di luar radius tetap digambar, dijepit ke cincin terluar, supaya
      // pemulung tahu ada permintaan "di luar sana" alih-alih titik itu hilang
      // begitu saja saat radius dikecilkan.
      const ratio = Math.min(1, pickup.distanceMeters / (rangeMeters || 1));
      const angle = ((pickup.bearingDegrees - 90) * Math.PI) / 180;
      const r = markerRadiusForWeight(pickup.estimatedWeightKg, maxWeightKg);
      // Jaga agar titik tidak keluar batas gambar walau jaraknya maksimum.
      const plotRadius = ratio * (outerRadius - r);
      const visual = materialVisual(pickup.materialType);

      return {
        pickup,
        x: center + plotRadius * Math.cos(angle),
        y: center + plotRadius * Math.sin(angle),
        r,
        letter: visual.letter,
        color: visual.color,
        label: t.agent.nearby.markerLabel
          .replace('{material}', t.pickup.material_label[pickup.materialType])
          .replace('{weight}', String(pickup.estimatedWeightKg))
          .replace('{distance}', formatDistanceMeters(pickup.distanceMeters))
          .replace('{direction}', formatBearing(pickup.bearingDegrees)),
      };
    });
  }, [pickups, rangeMeters, outerRadius, center, maxWeightKg]);

  const summary =
    pickups.length === 0
      ? t.agent.nearby.radarEmptySummary.replace('{radius}', String(radiusKm))
      : t.agent.nearby.radarSummary
          .replace('{count}', String(pickups.length))
          .replace('{radius}', String(radiusKm));

  const rings = Array.from({ length: RING_COUNT }, (_, index) => {
    const step = (index + 1) / RING_COUNT;
    return {
      radius: outerRadius * step,
      meters: rangeMeters * step,
    };
  });

  return (
    <View style={rvS.wrap}>
      {/*
        Wadah radar SENGAJA tidak diberi `accessible`. Satu View yang accessible
        akan melebur seluruh anaknya menjadi satu elemen tunggal, dan setiap
        titik permintaan berhenti bisa difokus pembaca layar — justru kebalikan
        dari yang dibutuhkan pengguna low-vision.
      */}
      <View style={[rvS.canvas, { width: size, height: size }]}>
        {/* Lapisan statis: cincin, sumbu, dan mata angin. Inilah satu-satunya
            simpul yang membawa ringkasan "N permintaan dalam radius X km",
            sehingga pengguna mendapat gambaran besar sebelum menelusuri titik
            satu per satu. `pointerEvents="none"` menjaga agar ia tidak
            menghalangi sentuhan ke titik-titik di atasnya. */}
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={`${t.agent.nearby.radarLabel}. ${summary}`}
          pointerEvents="none"
          style={rvS.baseLayer}
        >
          <Svg width={size} height={size}>
            {/* Cincin jarak */}
            {rings.map((ring, index) => (
              <Circle
                key={`ring-${index}`}
                cx={center}
                cy={center}
                r={ring.radius}
                fill="none"
                stroke={index === rings.length - 1 ? colors.bingo200 : colors.neutral200}
                strokeWidth={1}
              />
            ))}

            {/* Sumbu utara–selatan dan barat–timur */}
            <Line
              x1={center}
              y1={center - outerRadius}
              x2={center}
              y2={center + outerRadius}
              stroke={colors.neutral200}
              strokeWidth={1}
            />
            <Line
              x1={center - outerRadius}
              y1={center}
              x2={center + outerRadius}
              y2={center}
              stroke={colors.neutral200}
              strokeWidth={1}
            />

            {/* Label jarak tiap cincin */}
            {rings.map((ring, index) => (
              <SvgText
                key={`ring-label-${index}`}
                x={center + 4}
                y={center - ring.radius + 12}
                fontSize={10}
                fill={colors.neutral500}
              >
                {formatDistanceMeters(ring.meters)}
              </SvgText>
            ))}

            {/* Penanda mata angin */}
            <SvgText
              x={center}
              y={center - outerRadius - 8}
              fontSize={12}
              fontWeight="700"
              fill={colors.neutral600}
              textAnchor="middle"
            >
              {t.agent.nearby.compass.N}
            </SvgText>
            <SvgText
              x={center + outerRadius + 12}
              y={center + 4}
              fontSize={12}
              fontWeight="700"
              fill={colors.neutral600}
              textAnchor="middle"
            >
              {t.agent.nearby.compass.E}
            </SvgText>
            <SvgText
              x={center}
              y={center + outerRadius + 16}
              fontSize={12}
              fontWeight="700"
              fill={colors.neutral600}
              textAnchor="middle"
            >
              {t.agent.nearby.compass.S}
            </SvgText>
            <SvgText
              x={center - outerRadius - 12}
              y={center + 4}
              fontSize={12}
              fontWeight="700"
              fill={colors.neutral600}
              textAnchor="middle"
            >
              {t.agent.nearby.compass.W}
            </SvgText>

            {/* Posisi pemulung */}
            <Circle cx={center} cy={center} r={5} fill={colors.bingo700} />
            <Circle
              cx={center}
              cy={center}
              r={10}
              fill="none"
              stroke={colors.bingo500}
              strokeWidth={1.5}
              opacity={0.5}
            />
          </Svg>
        </View>

        {/* Sapuan lembut: satu juring transparan yang berputar pelan.
            Ditumpuk di atas SVG statis, di bawah titik-titik permintaan, dan
            tidak pernah menangkap sentuhan. */}
        <Animated.View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[rvS.sweepLayer, { width: size, height: size }, sweepStyle]}
        >
          <Svg width={size} height={size}>
            <Path
              d={`M ${center} ${center} L ${center} ${center - outerRadius} A ${outerRadius} ${outerRadius} 0 0 1 ${
                center + outerRadius * Math.sin((50 * Math.PI) / 180)
              } ${center - outerRadius * Math.cos((50 * Math.PI) / 180)} Z`}
              fill={colors.bingo500}
              opacity={0.1}
            />
          </Svg>
        </Animated.View>

        {/* Titik permintaan dirender sebagai Pressable, bukan sebagai elemen
            SVG. Elemen SVG di React Native tidak bisa menerima fokus
            aksesibilitas sendiri-sendiri, sedangkan setiap permintaan HARUS
            dapat dijangkau dan diucapkan pembaca layar satu per satu — itulah
            syaratnya agar radar ini berguna bagi pengguna low-vision. */}
        {markers.map((marker) => {
          const selected = marker.pickup.id === selectedId;
          return (
            <Pressable
              key={marker.pickup.id}
              accessible
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={marker.label}
              accessibilityHint={t.agent.nearby.radarHint}
              testID={`radar-marker-${marker.pickup.id}`}
              onPress={() => onSelect(marker.pickup)}
              // `hitSlop` memberi target sentuh ≥44dp bahkan untuk titik
              // terkecil, tanpa mengubah ukuran yang mengkodekan beratnya.
              hitSlop={Math.max(0, (touchTarget - marker.r * 2) / 2)}
              style={({ pressed }) => [
                rvS.marker,
                {
                  left: marker.x - marker.r,
                  top: marker.y - marker.r,
                  width: marker.r * 2,
                  height: marker.r * 2,
                  borderRadius: marker.r,
                  backgroundColor: marker.color,
                },
                selected ? rvS.markerSelected : null,
                pressed ? rvS.markerPressed : null,
              ]}
            >
              <Text style={rvS.markerLetter} allowFontScaling={false}>
                {marker.letter}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Teks yang sama sudah diucapkan sebagai label radar di atas; di sini ia
          disembunyikan dari pembaca layar agar tidak terdengar dua kali, tetapi
          tetap tampil untuk pengguna awas. */}
      <Text style={rvS.summary} accessibilityElementsHidden importantForAccessibility="no">
        {summary}
      </Text>
      <Text style={rvS.hint} accessibilityElementsHidden importantForAccessibility="no">
        {t.agent.nearby.radarHint}
      </Text>
    </View>
  );
}

/** Keterangan cara membaca radar. Dipisah agar bisa dilipat/dipindah. */
export function RadarLegend({ materials }: { materials: RadarPickupDto[] }) {
  const seen = useMemo(() => {
    const unique = new Map<string, { letter: string; color: string; label: string }>();
    for (const pickup of materials) {
      if (unique.has(pickup.materialType)) continue;
      const visual = materialVisual(pickup.materialType);
      unique.set(pickup.materialType, {
        letter: visual.letter,
        color: visual.color,
        label: t.pickup.material_label[pickup.materialType],
      });
    }
    return [...unique.values()];
  }, [materials]);

  return (
    <View style={rvS.legend}>
      <Text style={rvS.legendTitle}>{t.agent.nearby.legendTitle}</Text>
      <Text style={rvS.legendLine}>• {t.agent.nearby.legendShape}</Text>
      <Text style={rvS.legendLine}>• {t.agent.nearby.legendSize}</Text>
      <Text style={rvS.legendLine}>• {t.agent.nearby.legendPosition}</Text>
      {seen.length > 0 ? (
        <View style={rvS.legendChips}>
          {seen.map((item) => (
            <View key={item.label} style={rvS.legendChip} accessibilityRole="text">
              <View style={[rvS.legendDot, { backgroundColor: item.color }]}>
                <Text style={rvS.legendDotText} allowFontScaling={false}>
                  {item.letter}
                </Text>
              </View>
              <Text style={rvS.legendChipText} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const rvS = StyleSheet.create({
  wrap: { alignItems: 'center' },
  canvas: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseLayer: { position: 'absolute', left: 0, top: 0 },
  sweepLayer: { position: 'absolute', left: 0, top: 0 },
  marker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  markerSelected: {
    borderWidth: 3,
    borderColor: colors.neutral900,
  },
  markerPressed: { opacity: 0.75 },
  markerLetter: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.white,
  },
  summary: {
    marginTop: spacing.xs,
    ...typography.cardTitle,
    textAlign: 'center',
  },
  hint: {
    marginTop: 2,
    ...typography.caption,
    textAlign: 'center',
  },
  legend: {
    marginTop: spacing.sm,
    alignSelf: 'stretch',
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral200,
    padding: spacing.sm,
  },
  legendTitle: {
    marginBottom: spacing.xxs,
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutral900,
  },
  legendLine: { fontSize: 12, color: colors.neutral700, lineHeight: 18 },
  legendChips: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.neutral50,
    borderWidth: 1,
    borderColor: colors.neutral200,
    paddingRight: spacing.xs,
    paddingLeft: 3,
    paddingVertical: 3,
  },
  legendDot: {
    width: 18,
    height: 18,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xxs,
  },
  legendDotText: { fontSize: 9, fontWeight: '800', color: colors.white },
  legendChipText: { fontSize: 11, color: colors.neutral700, maxWidth: 130 },
});
