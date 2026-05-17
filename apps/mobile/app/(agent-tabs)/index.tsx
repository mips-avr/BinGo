import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ReportStatus } from '@bingo/shared-types';
import { useAuthStore } from '../../src/store/authStore';
import { useAssignedPickups, useNearbyPickups } from '../../src/features/pickups/hooks';
import { useReportsFeed } from '../../src/features/reports/hooks';
import { useAgentLocation } from '../../src/hooks/useAgentLocation';
import { Card } from '../../src/components/ui/Card';
import { colors, shadow } from '../../src/theme/screen';
import { t } from '../../src/i18n';

// ─── Full-width Stat Card ────────────────────────────────────

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

function StatCard({
  icon,
  iconColor,
  label,
  value,
  onPress,
}: {
  icon: FeatherIconName;
  iconColor: string;
  label: string;
  value: string | number;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress} style={agS.statCard}>
      <View style={agS.statRow}>
        <View style={[agS.statIcon, { backgroundColor: iconColor + '18' }]}>
          <Feather name={icon} size={20} color={iconColor} />
        </View>
        <View style={agS.statInfo}>
          <Text style={agS.statLabel}>{label}</Text>
          <Text style={agS.statValue}>{value}</Text>
        </View>
        <Feather name="chevron-right" size={18} color={colors.neutral400} />
      </View>
    </Card>
  );
}

// ─── Action Button ───────────────────────────────────────────

function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: FeatherIconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [agS.actionBtn, pressed ? agS.actionBtnPressed : null]}
      accessibilityRole="button"
    >
      <Feather name={icon} size={18} color="#fff" style={{ marginRight: 8 }} />
      <Text style={agS.actionBtnText}>{label}</Text>
    </Pressable>
  );
}

// ─── Agent Dashboard ─────────────────────────────────────────

export default function AgentDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const location = useAgentLocation();
  const nearby = useNearbyPickups(location.coords?.lat, location.coords?.lng, 5);
  const assigned = useAssignedPickups();
  const verifiedReports = useReportsFeed(ReportStatus.DIVERIFIKASI);

  if (!user) return null;

  const activeJobs =
    assigned.data?.filter((p) => p.status === 'ACCEPTED' || p.status === 'IN_PROGRESS').length ??
    0;

  return (
    <SafeAreaView style={agS.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={agS.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={agS.headerBlock}>
          <Text style={agS.greeting}>
            {t.agent.home.greeting.replace('{name}', user.name.split(' ')[0] ?? user.name)}
          </Text>
          <Text style={agS.subtitle}>{t.agent.home.subtitle}</Text>
        </View>

        {location.loading ? (
          <ActivityIndicator color={colors.bingo700} style={agS.locLoader} />
        ) : location.error ? (
          <Pressable onPress={location.refresh} style={agS.locError}>
            <Text style={agS.locErrorText}>{location.error}</Text>
            <Text style={agS.retryText}>{t.common.retry}</Text>
          </Pressable>
        ) : null}

        {/* ── Analytics Cards (full width) ── */}
        <Text style={agS.sectionTitle}>{t.agent.tabs.home}</Text>
        <View style={agS.statsCol}>
          <StatCard
            icon="map-pin"
            iconColor={colors.bingo600}
            label={t.agent.tabs.nearby}
            value={nearby.data?.length ?? 0}
            onPress={() => router.push('/(agent-tabs)/nearby')}
          />
          <StatCard
            icon="briefcase"
            iconColor={colors.blue600}
            label={t.agent.tabs.jobs}
            value={activeJobs}
            onPress={() => router.push('/(agent-tabs)/jobs')}
          />
          <StatCard
            icon="flag"
            iconColor={colors.red600}
            label={t.agent.tabs.reports}
            value={verifiedReports.data?.length ?? 0}
            onPress={() => router.push('/(agent-tabs)/reports')}
          />
        </View>

        {/* ── Action Buttons ── */}
        <View style={agS.actionsCol}>
          <ActionButton
            icon="map-pin"
            label={t.agent.home.viewNearby}
            onPress={() => router.push('/(agent-tabs)/nearby')}
          />
          <ActionButton
            icon="briefcase"
            label={t.agent.home.viewJobs}
            onPress={() => router.push('/(agent-tabs)/jobs')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────

const agS = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 32 },
  headerBlock: { marginTop: 8, marginBottom: 20 },
  greeting: { fontSize: 22, fontWeight: '700', color: colors.neutral900 },
  subtitle: { marginTop: 4, fontSize: 13, color: colors.neutral500 },
  locLoader: { marginBottom: 16 },
  locError: { marginBottom: 16 },
  locErrorText: { fontSize: 14, color: colors.red600 },
  retryText: { fontSize: 14, fontWeight: '600', color: colors.bingo700 },

  /* Section title */
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.neutral900,
    marginBottom: 14,
  },

  /* Stat cards — full width, stacked */
  statsCol: { gap: 10, marginBottom: 28 },
  statCard: { marginBottom: 0 },
  statRow: { flexDirection: 'row', alignItems: 'center' },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  statInfo: { flex: 1 },
  statLabel: { fontSize: 13, fontWeight: '500', color: colors.neutral500 },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.bingo700, marginTop: 2 },

  /* Action buttons */
  actionsCol: { gap: 12 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bingo600,
    paddingVertical: 14,
    borderRadius: 14,
    ...shadow(2),
  },
  actionBtnPressed: { opacity: 0.85 },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
