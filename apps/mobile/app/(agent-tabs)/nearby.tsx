import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialType, type RadarPickupDto } from '@bingo/shared-types';
import { useAcceptPickup, useRadarPickups } from '../../src/features/pickups/hooks';
import { RadarLegend, RadarView } from '../../src/components/radar/RadarView';
import { RadarPickupCard } from '../../src/components/radar/RadarPickupCard';
import {
  VerificationGate,
  type VerificationGateReason,
} from '../../src/components/agent/VerificationGate';
import { VerificationBadge } from '../../src/components/agent/VerificationBadge';
import { useAuthStore } from '../../src/store/authStore';
import { Chip } from '../../src/components/ui/Chip';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { Skeleton, SkeletonList } from '../../src/components/ui/Skeleton';
import { useSharedAgentLocation } from '../../src/hooks/useAgentLocation';
import { useBottomInset } from '../../src/hooks/useBottomInset';
import { extractApiErrorMessage } from '../../src/lib/api/client';
import { colors, radius, spacing, touch, typography } from '../../src/theme';
import { t } from '../../src/i18n';

const RADIUS_OPTIONS = [3, 5, 10, 15];
const WEIGHT_OPTIONS = [2, 5, 10];

/**
 * Jenis material yang muncul sebagai saringan cepat.
 *
 * Sengaja bukan kedua belas kelas: baris chip yang terlalu panjang justru
 * membuat pemulung berhenti memakainya. Empat ini yang paling sering
 * benar-benar dijemput di lapangan.
 */
const MATERIAL_FILTERS: MaterialType[] = [
  MaterialType.PET,
  MaterialType.PAPER,
  MaterialType.METAL,
  MaterialType.GLASS,
];

export default function AgentRadarScreen() {
  const router = useRouter();
  const location = useSharedAgentLocation();
  const { width } = useWindowDimensions();
  const bottomInset = useBottomInset();

  const [radiusKm, setRadiusKm] = useState(5);
  const [materialType, setMaterialType] = useState<MaterialType | null>(null);
  const [minWeightKg, setMinWeightKg] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const radar = useRadarPickups(location.queryCoords?.lat, location.queryCoords?.lng, {
    radiusKm,
    materialType,
    minWeightKg,
  });
  const accept = useAcceptPickup();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  // Tingkat verifikasi dibaca dari profil yang sudah tersimpan. Ini hanya
  // pemeriksaan di sisi klien untuk memilih layar penjelasan yang tepat;
  // penegakan sebenarnya tetap di backend (PickupRequestsService.accept),
  // karena tingkat di perangkat bisa saja basi setelah penjaminan dicabut.
  const verificationLevel = useAuthStore((s) => s.user?.verificationLevel ?? 0);
  const [gateReason, setGateReason] = useState<VerificationGateReason | null>(null);

  // Untuk menggulirkan daftar ke kartu yang titiknya baru diketuk di radar.
  const scrollRef = useRef<ScrollView>(null);
  const cardOffsets = useRef<Record<string, number>>({});

  const pickups = radar.data ?? [];
  const radarSize = Math.min(width - spacing.lg * 2 - spacing.sm * 2, 320);

  const handleSelect = useCallback((pickup: RadarPickupDto) => {
    setSelectedId(pickup.id);
    const offset = cardOffsets.current[pickup.id];
    if (offset == null) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, offset - spacing.md), animated: true });
  }, []);

  async function handleAccept(pickup: RadarPickupDto) {
    // Dicegat sebelum permintaan jaringan supaya pemulung mendapat penjelasan
    // dan langkah berikutnya, bukan kotak galat 403 yang membuatnya menyimpulkan
    // aplikasinya rusak.
    if (verificationLevel < 1) {
      setGateReason({ kind: 'needsAttestation' });
      return;
    }
    if (pickup.highValue && verificationLevel < 2) {
      setGateReason({
        kind: 'highValue',
        weightKg: pickup.estimatedWeightKg,
        level: verificationLevel,
      });
      return;
    }

    setAcceptingId(pickup.id);
    try {
      await accept.mutateAsync(pickup.id);
      Alert.alert(t.common.success, t.agent.nearby.acceptSuccess, [
        { text: t.common.ok, onPress: () => router.push('/(agent-tabs)/jobs') },
      ]);
    } catch (err) {
      Alert.alert(t.common.error, extractApiErrorMessage(err, t.common.error));
    } finally {
      setAcceptingId(null);
    }
  }

  const loading = location.loading || (radar.isLoading && !radar.data);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[s.content, { paddingBottom: bottomInset }]}
        refreshControl={
          <RefreshControl
            refreshing={radar.isFetching && !radar.isLoading}
            onRefresh={() => {
              location.refresh();
              radar.refetch();
            }}
            tintColor={colors.bingo700}
          />
        }
      >
        <View style={s.headerRow}>
          <View style={s.titleWrap}>
            <Text style={s.title} accessibilityRole="header">
              {t.agent.nearby.title}
            </Text>
            {/* Radar terbuka untuk semua tingkat — lencana ini yang menjelaskan
                mengapa sebagian permintaan tetap tidak bisa diambil. */}
            <VerificationBadge level={verificationLevel} style={s.levelBadge} />
          </View>
          <Pressable
            onPress={location.refresh}
            accessibilityRole="button"
            accessibilityLabel={t.agent.nearby.refreshLocation}
            accessibilityState={{ busy: location.loading }}
            hitSlop={spacing.xs}
            testID="refresh-location"
            style={s.refreshBtn}
          >
            <Text style={s.refreshText}>{t.agent.nearby.refreshLocation}</Text>
          </Pressable>
        </View>

        {/* ── Saringan ── */}
        <Text style={s.filterLabel}>{t.agent.nearby.radiusLabel}</Text>
        <View style={s.chipRow} accessibilityRole="radiogroup">
          {RADIUS_OPTIONS.map((r) => (
            <Chip
              key={r}
              label={`${r} km`}
              selected={radiusKm === r}
              onPress={() => setRadiusKm(r)}
              style={s.chip}
              testID={`radius-${r}`}
            />
          ))}
        </View>

        <Text style={s.filterLabel}>{t.agent.nearby.filterMaterial}</Text>
        <View style={s.chipRow} accessibilityRole="radiogroup">
          <Chip
            label={t.agent.nearby.filterAll}
            selected={materialType === null}
            onPress={() => setMaterialType(null)}
            style={s.chip}
            testID="material-filter-all"
          />
          {MATERIAL_FILTERS.map((m) => (
            <Chip
              key={m}
              label={t.pickup.material_label[m]}
              selected={materialType === m}
              onPress={() => setMaterialType(materialType === m ? null : m)}
              style={s.chip}
              testID={`material-filter-${m}`}
            />
          ))}
        </View>

        <Text style={s.filterLabel}>{t.agent.nearby.filterMinWeight}</Text>
        <View style={s.chipRow} accessibilityRole="radiogroup">
          <Chip
            label={t.agent.nearby.filterAnyWeight}
            selected={minWeightKg === null}
            onPress={() => setMinWeightKg(null)}
            style={s.chip}
            testID="weight-filter-any"
          />
          {WEIGHT_OPTIONS.map((w) => (
            <Chip
              key={w}
              label={t.agent.nearby.filterWeightOption.replace('{weight}', String(w))}
              selected={minWeightKg === w}
              onPress={() => setMinWeightKg(minWeightKg === w ? null : w)}
              style={s.chip}
              testID={`weight-filter-${w}`}
            />
          ))}
        </View>

        {/* ── Radar ── */}
        {location.error ? (
          <ErrorState
            message={location.error}
            onRetry={location.refresh}
            style={s.stateBlock}
            testID="radar-location-error"
          />
        ) : loading ? (
          <View style={s.loadingBlock}>
            <Skeleton width={radarSize} height={radarSize} borderRadius={radarSize / 2} />
            <Text style={s.locating}>{t.agent.nearby.radarLocating}</Text>
            <View style={s.skeletonList}>
              <SkeletonList count={2} lines={2} />
            </View>
          </View>
        ) : radar.isError ? (
          <ErrorState
            message={extractApiErrorMessage(radar.error, t.common.errorMessage)}
            onRetry={() => radar.refetch()}
            style={s.stateBlock}
            testID="radar-error"
          />
        ) : (
          <>
            <View style={s.radarBlock}>
              <RadarView
                pickups={pickups}
                radiusKm={radiusKm}
                size={radarSize}
                selectedId={selectedId}
                onSelect={handleSelect}
              />
              <RadarLegend materials={pickups} />
            </View>

            {pickups.length === 0 ? (
              <EmptyState
                icon="map-pin"
                title={t.agent.nearby.emptyTitle}
                message={t.agent.nearby.emptyMessage}
              />
            ) : (
              <>
                <Text style={s.listTitle} accessibilityRole="header">
                  {t.agent.nearby.listTitle}
                </Text>
                {pickups.map((pickup) => (
                  <View
                    key={pickup.id}
                    onLayout={(event) => {
                      // Posisi kartu di dalam konten ScrollView, dipakai saat
                      // titik radar diketuk. Diukur lewat onLayout karena
                      // `measureLayout` pada ScrollView memerlukan simpul
                      // internal yang tidak diketik di React Native.
                      cardOffsets.current[pickup.id] = event.nativeEvent.layout.y;
                    }}
                  >
                    <RadarPickupCard
                      pickup={pickup}
                      selected={selectedId === pickup.id}
                      onPress={() => {
                        setSelectedId(pickup.id);
                        router.push(`/(agent-tabs)/jobs/${pickup.id}`);
                      }}
                      onAccept={() => handleAccept(pickup)}
                      accepting={acceptingId === pickup.id}
                    />
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      <VerificationGate reason={gateReason} onClose={() => setGateReason(null)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  titleWrap: { flexShrink: 1, marginRight: spacing.xs },
  title: { ...typography.headerTitle },
  levelBadge: { marginTop: spacing.xxs },
  refreshBtn: {
    justifyContent: 'center',
    minHeight: touch.minTarget,
    paddingHorizontal: spacing.xxs,
  },
  refreshText: { fontSize: 13, fontWeight: '600', color: colors.bingo700 },
  filterLabel: { marginTop: spacing.xs, ...typography.caption, fontWeight: '600' },
  chipRow: { marginTop: spacing.xxs, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  // Jarak diatur `gap` pada baris, jadi margin bawaan chip dinolkan.
  chip: { marginRight: 0 },
  stateBlock: { marginTop: spacing.md },
  loadingBlock: { marginTop: spacing.md, alignItems: 'center' },
  locating: { marginTop: spacing.sm, ...typography.caption },
  skeletonList: { alignSelf: 'stretch', marginTop: spacing.md },
  radarBlock: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral100,
  },
  listTitle: { marginBottom: spacing.sm, ...typography.sectionTitle },
});
