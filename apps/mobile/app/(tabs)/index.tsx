import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { useMyPickups } from '../../src/features/pickups/hooks';
import { useMyReports } from '../../src/features/reports/hooks';
import { PickupCard } from '../../src/components/pickups/PickupCard';
import { ReportCard } from '../../src/components/reports/ReportCard';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { colors, shadow } from '../../src/theme/screen';
import { t } from '../../src/i18n';

// ─── Grid Menu Item ──────────────────────────────────────────

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

function ActionRow({
  icon,
  label,
  color,
  onPress,
}: {
  icon: FeatherIconName;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        menuS.row,
        pressed ? menuS.rowPressed : null,
      ]}
      accessibilityRole="button"
    >
      <View style={[menuS.iconCircle, { backgroundColor: color + '18' }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <Text style={menuS.label}>{label}</Text>
      <Feather name="chevron-right" size={18} color={colors.neutral400} />
    </Pressable>
  );
}

// ─── Section Header ──────────────────────────────────────────

function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={sectionS.row}>
      <Text style={sectionS.title}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button">
          <Text style={sectionS.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ─── Home Screen ─────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const pickups = useMyPickups();
  const reports = useMyReports();

  if (!user) return null;

  const recentPickup = pickups.data?.[0];
  const recentReport = reports.data?.[0];
  const firstName = user.name.split(' ')[0] ?? user.name;

  return (
    <SafeAreaView style={homeS.safe} edges={['top']}>
      {/* ── Static Header ── */}
      <View style={homeS.headerRow}>
        <View style={homeS.headerLeft}>
          <Text style={homeS.greeting}>
            {t.home.greeting.replace('{name}', firstName)} 👋
          </Text>
          <Text style={homeS.tagline}>{t.common.tagline}</Text>
        </View>
        <Pressable
          style={homeS.avatarCircle}
          onPress={() => router.push('/(tabs)/profile')}
          accessibilityRole="button"
          accessibilityLabel="Profile"
        >
          <Feather name="user" size={20} color={colors.neutral500} />
        </Pressable>
      </View>

      <ScrollView
        style={homeS.scroll}
        contentContainerStyle={homeS.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Wallet / Points Card (Gopay-style) ── */}
        <View style={homeS.walletCard}>
          <View>
            <Text style={homeS.walletLabel}>Total Poin Kamu</Text>
            <View style={homeS.walletValueRow}>
              <Text style={homeS.walletValue}>
                {user.pointsBalance.toLocaleString('id-ID')}
              </Text>
              <Text style={homeS.walletUnit}> Pts</Text>
            </View>
          </View>
          <Pressable
            style={homeS.redeemBtn}
            onPress={() => router.push('/(tabs)/profile')}
            accessibilityRole="button"
          >
            <Feather name="gift" size={18} color="#fff" />
            <Text style={homeS.redeemText}>{t.common.redeemPoints}</Text>
          </Pressable>
        </View>

        {/* ── Quick Actions (vertical list) ── */}
        <View style={menuS.container}>
          <ActionRow
            icon="truck"
            label={t.home.requestPickup}
            color={colors.bingo600}
            onPress={() => router.push('/(tabs)/pickups/new')}
          />
          <ActionRow
            icon="camera"
            label={t.home.scanTrash}
            color={colors.blue600}
            onPress={() => router.push('/(tabs)/scanner')}
          />
          <ActionRow
            icon="map-pin"
            label={t.home.reportDump}
            color={colors.red600}
            onPress={() => router.push('/(tabs)/reports/new')}
          />
          <ActionRow
            icon="shopping-bag"
            label={t.home.browseMart}
            color={colors.orange500}
            onPress={() => router.push('/(tabs)/marketplace')}
          />
        </View>

        {/* ── Recent Pickup ── */}
        <View style={homeS.sectionBlock}>
          <SectionHeader
            title={t.pickup.listTitle}
            actionLabel={t.common.viewAll}
            onAction={() => router.push('/(tabs)/pickups')}
          />
          {recentPickup ? (
            <PickupCard
              pickup={recentPickup}
              onPress={() => router.push(`/(tabs)/pickups/${recentPickup.id}`)}
            />
          ) : (
            <EmptyState
              icon="truck"
              title={t.pickup.emptyTitle}
              message={t.pickup.emptyMessage}
            />
          )}
        </View>

        {/* ── Recent Report ── */}
        <View style={homeS.sectionBlock}>
          <SectionHeader
            title={t.report.feedTitle}
            actionLabel={t.common.explore}
            onAction={() => router.push('/(tabs)/reports')}
          />
          {recentReport ? (
            <ReportCard
              report={recentReport}
              onPress={() => router.push(`/(tabs)/reports/${recentReport.id}`)}
            />
          ) : (
            <EmptyState
              icon="camera"
              title={t.report.emptyTitle}
              message={t.report.emptyMessage}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────

const homeS = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },

  /* Header */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.bingo50,
  },
  headerLeft: { flex: 1 },
  greeting: { fontSize: 22, fontWeight: '700', color: colors.neutral900 },
  tagline: { marginTop: 2, fontSize: 13, color: colors.neutral500 },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral200,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  /* Wallet Card */
  walletCard: {
    marginTop: 4,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bingo600,
    borderRadius: 20,
    padding: 20,
    ...shadow(4),
  },
  walletLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  walletValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  walletValue: { fontSize: 32, fontWeight: '800', color: '#fff' },
  walletUnit: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  redeemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
  },
  redeemText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  /* Sections */
  sectionBlock: { marginBottom: 28 },
});

const menuS = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginBottom: 28,
    ...shadow(3),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  rowPressed: { backgroundColor: colors.neutral50 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.neutral800,
  },
});

const sectionS = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: { fontSize: 17, fontWeight: '700', color: colors.neutral900 },
  action: { fontSize: 14, fontWeight: '600', color: colors.bingo600 },
});
