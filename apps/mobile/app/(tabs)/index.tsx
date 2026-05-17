import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatRelativeId } from '@bingo/shared-utils';
import { useAuthStore } from '../../src/store/authStore';
import { useMyPickups } from '../../src/features/pickups/hooks';
import { useMyReports } from '../../src/features/reports/hooks';
import { Card } from '../../src/components/ui/Card';
import { PointsBadge } from '../../src/components/ui/PointsBadge';
import { Section } from '../../src/components/ui/Section';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { t } from '../../src/i18n';

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress} className="mr-3 w-40">
      <Text className="text-2xl">{icon}</Text>
      <Text className="mt-2 text-sm font-semibold text-neutral-900">{label}</Text>
    </Card>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user)!;
  const pickups = useMyPickups();
  const reports = useMyReports();

  const recentPickup = pickups.data?.[0];
  const recentReport = reports.data?.[0];

  return (
    <SafeAreaView className="flex-1 bg-bingo-50" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
      >
        <View className="mt-2 mb-5">
          <Text className="text-2xl font-bold text-neutral-900">
            {t.home.greeting.replace('{name}', user.name.split(' ')[0] ?? user.name)}
          </Text>
          <Text className="mt-1 text-sm text-neutral-500">{t.common.tagline}</Text>
          <View className="mt-3">
            <PointsBadge points={user.pointsBalance} />
          </View>
        </View>

        <Section title={t.home.quickActions}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <QuickAction
              icon="🚚"
              label={t.home.requestPickup}
              onPress={() => router.push('/(tabs)/pickups/new')}
            />
            <QuickAction
              icon="♻️"
              label={t.home.scanTrash}
              onPress={() => router.push('/(tabs)/scanner')}
            />
            <QuickAction
              icon="📷"
              label={t.home.reportDump}
              onPress={() => router.push('/(tabs)/reports/new')}
            />
            <QuickAction
              icon="🛒"
              label={t.home.browseMart}
              onPress={() => router.push('/(tabs)/marketplace')}
            />
          </ScrollView>
        </Section>

        <Section
          title={t.pickup.listTitle}
          action={{ label: t.common.search, onPress: () => router.push('/(tabs)/pickups') }}
        >
          {recentPickup ? (
            <Card onPress={() => router.push(`/(tabs)/pickups/${recentPickup.id}`)}>
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 text-base font-semibold text-neutral-900" numberOfLines={1}>
                  {recentPickup.address}
                </Text>
                <StatusBadge status={recentPickup.status} />
              </View>
              <Text className="mt-1 text-xs text-neutral-500">
                {t.pickup.material_label[recentPickup.materialType]} ·{' '}
                {recentPickup.estimatedWeightKg} kg · {formatRelativeId(recentPickup.createdAt)}
              </Text>
            </Card>
          ) : (
            <EmptyState
              icon="🚚"
              title={t.pickup.emptyTitle}
              message={t.pickup.emptyMessage}
            />
          )}
        </Section>

        <Section
          title={t.report.feedTitle}
          action={{ label: t.common.search, onPress: () => router.push('/(tabs)/reports') }}
        >
          {recentReport ? (
            <Card onPress={() => router.push(`/(tabs)/reports/${recentReport.id}`)}>
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 text-base font-semibold text-neutral-900" numberOfLines={1}>
                  {recentReport.description ?? 'Laporan tanpa deskripsi'}
                </Text>
                <StatusBadge status={recentReport.status} />
              </View>
              <Text className="mt-1 text-xs text-neutral-500">
                {t.report.verifyCount.replace('{count}', String(recentReport.verificationCount))}
                {' · '}
                {formatRelativeId(recentReport.createdAt)}
              </Text>
            </Card>
          ) : (
            <EmptyState icon="📷" title={t.report.emptyTitle} message={t.report.emptyMessage} />
          )}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
