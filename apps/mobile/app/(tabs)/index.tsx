import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { useMe } from '../../src/features/auth/hooks';
import { useMyPickups } from '../../src/features/pickups/hooks';
import { useMyReports } from '../../src/features/reports/hooks';
import { PickupCard } from '../../src/components/pickups/PickupCard';
import { ReportCard } from '../../src/components/reports/ReportCard';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { Section } from '../../src/components/ui/Section';
import { SkeletonCard } from '../../src/components/ui/Skeleton';
import { extractApiErrorMessage } from '../../src/lib/api/client';
import { colors, radius, spacing, shadow, touch, typography } from '../../src/theme';
import { t } from '../../src/i18n';

// ─── Baris aksi cepat ────────────────────────────────────────

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

function ActionRow({
  icon,
  label,
  color,
  onPress,
  testID,
}: {
  icon: FeatherIconName;
  label: string;
  color: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [menuS.row, pressed ? menuS.rowPressed : null]}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
    >
      <View style={[menuS.iconCircle, { backgroundColor: color + '18' }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <Text style={menuS.label}>{label}</Text>
      <Feather name="chevron-right" size={18} color={colors.neutral400} />
    </Pressable>
  );
}

// ─── Beranda warga ───────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const storedUser = useAuthStore((s) => s.user);
  const pickups = useMyPickups();
  const reports = useMyReports();
  /**
   * Saldo poin di kartu bawah ini dulu hanya dibaca dari `authStore`, yang
   * diisi sekali saat login/hydrate. `useCompletePickup` dan `useVerifyReport`
   * meng-invalidate `queryKeys.me`, tetapi tidak ada satu pun kueri yang
   * melanggan kunci itu — jadi angkanya tidak berubah sampai aplikasi ditutup
   * dan dibuka lagi. `useMe()` adalah pelanggan yang hilang itu.
   */
  const me = useMe();
  const user = me.data ?? storedUser;

  if (!user) return null;

  const recentPickup = pickups.data?.[0];
  const recentReport = reports.data?.[0];
  const firstName = user.name.split(' ')[0] ?? user.name;
  const refreshing =
    (pickups.isFetching && !pickups.isLoading) ||
    (reports.isFetching && !reports.isLoading) ||
    (me.isFetching && !me.isLoading);

  return (
    <SafeAreaView style={homeS.safe} edges={['top']}>
      {/* ── Header statis ── */}
      <View style={homeS.headerRow}>
        <View style={homeS.headerLeft}>
          <Text style={homeS.greeting} numberOfLines={1}>
            {t.home.greeting.replace('{name}', firstName)} 👋
          </Text>
          <Text style={homeS.tagline} numberOfLines={1}>
            {t.common.tagline}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [homeS.avatarCircle, pressed ? homeS.pressed : null]}
          onPress={() => router.push('/(tabs)/profile')}
          accessibilityRole="button"
          accessibilityLabel={t.home.openProfile}
          testID="home-profile"
        >
          <Feather name="user" size={20} color={colors.neutral500} />
        </Pressable>
      </View>

      <ScrollView
        style={homeS.scroll}
        contentContainerStyle={homeS.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              pickups.refetch();
              reports.refetch();
              me.refetch();
            }}
            tintColor={colors.bingo700}
          />
        }
      >
        {/* ── Kartu poin ── */}
        <View style={homeS.walletCard}>
          {/* `flex: 1` di sisi kiri: tanpa itu saldo tujuh digit mendorong
              tombol tukar poin keluar dari kartu. */}
          <View style={homeS.walletLeft}>
            <Text style={homeS.walletLabel} numberOfLines={1}>
              {t.home.pointsTitle}
            </Text>
            <View style={homeS.walletValueRow}>
              <Text
                style={homeS.walletValue}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {user.pointsBalance.toLocaleString('id-ID')}
              </Text>
              <Text style={homeS.walletUnit}> {t.points.short}</Text>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [homeS.redeemBtn, pressed ? homeS.pressed : null]}
            onPress={() => router.push('/(tabs)/profile')}
            accessibilityRole="button"
            accessibilityLabel={t.common.redeemPoints}
            testID="home-redeem"
          >
            <Feather name="gift" size={18} color={colors.white} />
            <Text style={homeS.redeemText}>{t.common.redeemPoints}</Text>
          </Pressable>
        </View>

        {/* ── Aksi cepat ── */}
        <View style={menuS.container}>
          <ActionRow
            icon="truck"
            label={t.home.requestPickup}
            color={colors.bingo600}
            onPress={() => router.push('/(tabs)/pickups/new')}
            testID="home-action-pickup"
          />
          <ActionRow
            icon="camera"
            label={t.home.scanTrash}
            color={colors.blue600}
            onPress={() => router.push('/(tabs)/scanner')}
            testID="home-action-scan"
          />
          <ActionRow
            icon="map-pin"
            label={t.home.reportDump}
            color={colors.red600}
            onPress={() => router.push('/(tabs)/reports/new')}
            testID="home-action-report"
          />
          {/* Pintu masuk kedua ke papan harga, selain tabnya. Warga yang akan
              menyerahkan material perlu tahu rentang harganya SEBELUM tawar
              menawar, bukan sesudah menerima uang. */}
          <ActionRow
            icon="bar-chart-2"
            label={t.weighing.citizenEntryTitle}
            color={colors.bingo700}
            onPress={() => router.push('/(tabs)/prices')}
            testID="home-action-prices"
          />
          <ActionRow
            icon="shopping-bag"
            label={t.home.browseMart}
            color={colors.orange500}
            onPress={() => router.push('/(tabs)/marketplace')}
            testID="home-action-mart"
          />
        </View>

        {/* ── Penjemputan terbaru ── */}
        <Section
          title={t.pickup.listTitle}
          action={{
            label: t.common.viewAll,
            onPress: () => router.push('/(tabs)/pickups'),
            testID: 'home-see-pickups',
          }}
        >
          {/* Tiga cabang terpisah: memuat, gagal, kosong. Sebelumnya ketiganya
              tampil sebagai "Belum ada permintaan", sehingga cold start dan API
              mati terlihat persis sama dengan akun yang memang baru. */}
          {pickups.isLoading ? (
            <SkeletonCard lines={2} />
          ) : pickups.isError ? (
            <ErrorState
              message={extractApiErrorMessage(pickups.error, t.common.errorMessage)}
              onRetry={() => pickups.refetch()}
              testID="home-pickups-error"
            />
          ) : recentPickup ? (
            <PickupCard
              pickup={recentPickup}
              onPress={() => router.push(`/(tabs)/pickups/${recentPickup.id}`)}
            />
          ) : (
            <EmptyState
              icon="truck"
              title={t.pickup.emptyTitle}
              message={t.pickup.emptyMessage}
              action={{
                label: t.pickup.create,
                onPress: () => router.push('/(tabs)/pickups/new'),
                testID: 'home-empty-create-pickup',
              }}
            />
          )}
        </Section>

        {/* ── Laporan terbaru ── */}
        <Section
          title={t.report.feedTitle}
          action={{
            label: t.common.explore,
            onPress: () => router.push('/(tabs)/reports'),
            testID: 'home-see-reports',
          }}
        >
          {reports.isLoading ? (
            <SkeletonCard lines={2} />
          ) : reports.isError ? (
            <ErrorState
              message={extractApiErrorMessage(reports.error, t.common.errorMessage)}
              onRetry={() => reports.refetch()}
              testID="home-reports-error"
            />
          ) : recentReport ? (
            <ReportCard
              report={recentReport}
              onPress={() => router.push(`/(tabs)/reports/${recentReport.id}`)}
            />
          ) : (
            <EmptyState
              icon="camera"
              title={t.report.emptyTitle}
              message={t.report.emptyMessage}
              action={{
                label: t.report.create,
                onPress: () => router.push('/(tabs)/reports/new'),
                testID: 'home-empty-create-report',
              }}
            />
          )}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Gaya ────────────────────────────────────────────────────

const homeS = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  pressed: { opacity: 0.85 },

  /* Header */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bingo50,
  },
  headerLeft: { flex: 1, marginRight: spacing.sm },
  greeting: { fontSize: 22, fontWeight: '700', color: colors.neutral900 },
  tagline: { marginTop: 2, fontSize: 13, color: colors.neutral500 },
  avatarCircle: {
    width: touch.minTarget,
    height: touch.minTarget,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral200,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Kartu poin */
  walletCard: {
    marginTop: spacing.xxs,
    marginBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bingo600,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow(4),
  },
  walletLeft: { flex: 1, marginRight: spacing.sm },
  walletLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.whiteAlpha80,
    marginBottom: spacing.xxs,
  },
  walletValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  walletValue: {
    ...typography.numeric,
    flexShrink: 1,
    fontSize: 32,
    fontWeight: '800',
    color: colors.white,
  },
  walletUnit: { fontSize: 14, fontWeight: '700', color: colors.whiteAlpha85 },
  redeemBtn: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.whiteAlpha20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: touch.minTarget,
    borderRadius: radius.xl,
    gap: spacing.xxs + 2,
  },
  redeemText: { fontSize: 14, fontWeight: '700', color: colors.white },
});

const menuS = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.xxs,
    marginBottom: spacing.xl,
    ...shadow(3),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    minHeight: touch.minTarget + spacing.md,
    borderRadius: radius.md,
  },
  rowPressed: { backgroundColor: colors.neutral50 },
  iconCircle: {
    width: touch.minTarget,
    height: touch.minTarget,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  label: {
    flex: 1,
    ...typography.cardTitle,
    fontWeight: '600',
    color: colors.neutral800,
  },
});
