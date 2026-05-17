import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ReportStatus } from '@bingo/shared-types';
import { useAuthStore } from '../../src/store/authStore';
import { useAssignedPickups, useNearbyPickups } from '../../src/features/pickups/hooks';
import { useReportsFeed } from '../../src/features/reports/hooks';
import { useAgentLocation } from '../../src/hooks/useAgentLocation';
import { Card } from '../../src/components/ui/Card';
import { Section } from '../../src/components/ui/Section';
import { t } from '../../src/i18n';

function StatCard({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string | number;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="mr-3 w-40 active:opacity-80">
      <Card>
        <Text className="text-2xl font-bold text-bingo-700">{value}</Text>
        <Text className="mt-1 text-sm text-neutral-600">{label}</Text>
      </Card>
    </Pressable>
  );
}

export default function AgentDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user)!;
  const location = useAgentLocation();
  const nearby = useNearbyPickups(location.coords?.lat, location.coords?.lng, 5);
  const assigned = useAssignedPickups();
  const verifiedReports = useReportsFeed(ReportStatus.DIVERIFIKASI);

  const activeJobs =
    assigned.data?.filter((p) => p.status === 'ACCEPTED' || p.status === 'IN_PROGRESS').length ??
    0;

  return (
    <SafeAreaView className="flex-1 bg-bingo-50" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-2 mb-5">
          <Text className="text-2xl font-bold text-neutral-900">
            {t.agent.home.greeting.replace('{name}', user.name.split(' ')[0] ?? user.name)}
          </Text>
          <Text className="mt-1 text-sm text-neutral-500">{t.agent.home.subtitle}</Text>
        </View>

        {location.loading ? (
          <ActivityIndicator color="#15803D" className="mb-4" />
        ) : location.error ? (
          <Pressable onPress={location.refresh} className="mb-4">
            <Text className="text-sm text-red-600">{location.error}</Text>
            <Text className="text-sm font-semibold text-bingo-700">{t.common.retry}</Text>
          </Pressable>
        ) : null}

        <Section title={t.agent.tabs.home}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <StatCard
              label={t.agent.tabs.nearby}
              value={nearby.data?.length ?? 0}
              onPress={() => router.push('/(agent-tabs)/nearby')}
            />
            <StatCard
              label={t.agent.tabs.jobs}
              value={activeJobs}
              onPress={() => router.push('/(agent-tabs)/jobs')}
            />
            <StatCard
              label={t.agent.tabs.reports}
              value={verifiedReports.data?.length ?? 0}
              onPress={() => router.push('/(agent-tabs)/reports')}
            />
          </ScrollView>
        </Section>

        <Card onPress={() => router.push('/(agent-tabs)/nearby')}>
          <Text className="font-semibold text-bingo-700">{t.agent.home.viewNearby}</Text>
        </Card>
        <Card className="mt-3" onPress={() => router.push('/(agent-tabs)/jobs')}>
          <Text className="font-semibold text-bingo-700">{t.agent.home.viewJobs}</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
