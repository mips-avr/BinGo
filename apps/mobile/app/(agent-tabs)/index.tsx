import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ReportStatus } from '@bingo/shared-types';
import { useAuthStore } from '../../src/store/authStore';
import { useAssignedPickups, useRadarPickups } from '../../src/features/pickups/hooks';
import { useReportsFeed } from '../../src/features/reports/hooks';
import { useSharedAgentLocation } from '../../src/hooks/useAgentLocation';
import { Card } from '../../src/components/ui/Card';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { Section } from '../../src/components/ui/Section';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { extractApiErrorMessage } from '../../src/lib/api/client';
import { colors, radius, spacing, shadow, touch, typography } from '../../src/theme';
import { t } from '../../src/i18n';

// ─── Kartu statistik lebar penuh ─────────────────────────────

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

function StatCard({
  icon,
  iconColor,
  label,
  value,
  loading,
  onPress,
  testID,
}: {
  icon: FeatherIconName;
  iconColor: string;
  label: string;
  value: number;
  loading?: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Card
      onPress={onPress}
      style={agS.statCard}
      accessibilityLabel={loading ? `${label}, ${t.common.loadingLabel}` : `${label}: ${value}`}
      testID={testID}
    >
      <View style={agS.statRow}>
        <View style={[agS.statIcon, { backgroundColor: iconColor + '18' }]}>
          <Feather name={icon} size={20} color={iconColor} />
        </View>
        <View style={agS.statInfo}>
          <Text style={agS.statLabel} numberOfLines={1}>
            {label}
          </Text>
          {/* Angka baru muncul setelah datanya ada. Menampilkan "0" saat masih
              memuat membuat pemulung mengira tidak ada pekerjaan sama sekali. */}
          {loading ? (
            <Skeleton width={48} height={22} style={agS.statSkeleton} />
          ) : (
            <Text style={agS.statValue} numberOfLines={1}>
              {value}
            </Text>
          )}
        </View>
        <Feather name="chevron-right" size={18} color={colors.neutral400} />
      </View>
    </Card>
  );
}

// ─── Tombol aksi ─────────────────────────────────────────────

function ActionButton({
  icon,
  label,
  onPress,
  testID,
}: {
  icon: FeatherIconName;
  label: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [agS.actionBtn, pressed ? agS.actionBtnPressed : null]}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
    >
      <Feather name={icon} size={18} color={colors.white} style={agS.actionBtnIcon} />
      <Text style={agS.actionBtnText}>{label}</Text>
    </Pressable>
  );
}

// ─── Dashboard pemulung ──────────────────────────────────────

export default function AgentDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  // Sumber posisi bersama dari `(agent-tabs)/_layout.tsx`. Layar ini dulu
  // memanggil `useAgentLocation()` sendiri, menggandakan langganan GPS dan
  // kueri permintaan terdekat dengan koordinat yang berbeda beberapa meter.
  const location = useSharedAgentLocation();
  // Radar dipakai juga di sini agar dashboard dan tab radar berbagi satu entri
  // cache yang sama persis, bukan dua kueri berbeda untuk data yang sama.
  const nearby = useRadarPickups(location.queryCoords?.lat, location.queryCoords?.lng, {
    radiusKm: 5,
  });
  const assigned = useAssignedPickups();
  const verifiedReports = useReportsFeed(ReportStatus.DIVERIFIKASI);

  if (!user) return null;

  const activeJobs =
    assigned.data?.filter((p) => p.status === 'ACCEPTED' || p.status === 'IN_PROGRESS').length ?? 0;

  const statsError = nearby.isError || assigned.isError || verifiedReports.isError;
  const statsErrorMessage = extractApiErrorMessage(
    nearby.error ?? assigned.error ?? verifiedReports.error,
    t.common.errorMessage,
  );
  const refreshing =
    (nearby.isFetching && !nearby.isLoading) ||
    (assigned.isFetching && !assigned.isLoading) ||
    (verifiedReports.isFetching && !verifiedReports.isLoading);

  function refetchAll() {
    nearby.refetch();
    assigned.refetch();
    verifiedReports.refetch();
  }

  return (
    <SafeAreaView style={agS.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={agS.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refetchAll}
            tintColor={colors.bingo700}
          />
        }
      >
        <View style={agS.headerBlock}>
          <Text style={agS.greeting} numberOfLines={1}>
            {t.agent.home.greeting.replace('{name}', user.name.split(' ')[0] ?? user.name)}
          </Text>
          <Text style={agS.subtitle}>{t.agent.home.subtitle}</Text>
        </View>

        {location.loading ? (
          <ActivityIndicator
            color={colors.bingo700}
            style={agS.locLoader}
            accessibilityLabel={t.common.loadingLabel}
          />
        ) : location.error ? (
          <ErrorState
            title={t.common.errorTitle}
            message={location.error}
            onRetry={location.refresh}
            style={agS.locError}
            testID="agent-location-error"
          />
        ) : null}

        {/* ── Kartu ringkasan ── */}
        <Section title={t.agent.home.statsTitle}>
          {statsError ? (
            <ErrorState
              message={statsErrorMessage}
              onRetry={refetchAll}
              testID="agent-stats-error"
            />
          ) : (
            <View style={agS.statsCol}>
              <StatCard
                icon="map-pin"
                iconColor={colors.bingo600}
                label={t.agent.tabs.nearby}
                value={nearby.data?.length ?? 0}
                loading={nearby.isLoading || location.loading}
                onPress={() => router.push('/(agent-tabs)/nearby')}
                testID="agent-stat-nearby"
              />
              <StatCard
                icon="briefcase"
                iconColor={colors.blue600}
                label={t.agent.tabs.jobs}
                value={activeJobs}
                loading={assigned.isLoading}
                onPress={() => router.push('/(agent-tabs)/jobs')}
                testID="agent-stat-jobs"
              />
              <StatCard
                icon="flag"
                iconColor={colors.red600}
                label={t.agent.tabs.reports}
                value={verifiedReports.data?.length ?? 0}
                loading={verifiedReports.isLoading}
                onPress={() => router.push('/(agent-tabs)/reports')}
                testID="agent-stat-reports"
              />
            </View>
          )}
        </Section>

        {/* ── Tombol aksi ── */}
        <View style={agS.actionsCol}>
          <ActionButton
            icon="map-pin"
            label={t.agent.home.viewNearby}
            onPress={() => router.push('/(agent-tabs)/nearby')}
            testID="agent-view-nearby"
          />
          <ActionButton
            icon="briefcase"
            label={t.agent.home.viewJobs}
            onPress={() => router.push('/(agent-tabs)/jobs')}
            testID="agent-view-jobs"
          />
          {/* Setoran langsung: pemulung membeli dari orang yang datang sendiri.
              Sebelumnya layar penerbitan bukti hanya bisa dibuka dari detail
              pekerjaan, sehingga alur ini tidak dapat menerbitkan bukti apa pun. */}
          <ActionButton
            icon="file-plus"
            label={t.weighing.walkInTitle}
            onPress={() => router.push('/(agent-tabs)/receipts/new')}
            testID="agent-new-walkin-receipt"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Gaya ────────────────────────────────────────────────────

const agS = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  headerBlock: { marginTop: spacing.xs, marginBottom: spacing.lg },
  greeting: { fontSize: 22, fontWeight: '700', color: colors.neutral900 },
  subtitle: { marginTop: spacing.xxs, fontSize: 13, color: colors.neutral500 },
  locLoader: { marginBottom: spacing.md },
  locError: { marginBottom: spacing.md },

  /* Kartu statistik */
  statsCol: { gap: 10 },
  statCard: { marginBottom: 0 },
  statRow: { flexDirection: 'row', alignItems: 'center' },
  statIcon: {
    width: touch.minTarget,
    height: touch.minTarget,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  statInfo: { flex: 1 },
  statLabel: { fontSize: 13, fontWeight: '500', color: colors.neutral500 },
  statValue: {
    ...typography.numeric,
    fontSize: 22,
    color: colors.bingo700,
    marginTop: 2,
  },
  statSkeleton: { marginTop: spacing.xxs + 2 },

  /* Tombol aksi */
  actionsCol: { gap: spacing.sm },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bingo600,
    paddingVertical: 14,
    minHeight: touch.minTarget,
    borderRadius: radius.md,
    ...shadow(2),
  },
  actionBtnIcon: { marginRight: spacing.xs },
  actionBtnPressed: { opacity: 0.85 },
  actionBtnText: {
    ...typography.cardTitle,
    color: colors.white,
  },
});
