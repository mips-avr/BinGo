import { Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RoleDashboard } from '@bingo/shared-types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../ui/Card';
import { ErrorState } from '../ui/ErrorState';
import { SkeletonList } from '../ui/Skeleton';
import { colors, fonts, radius, screenStyles, spacing, typography } from '../../theme';
import { extractApiErrorMessage } from '../../lib/api/client';
import { statusLabel } from '../../lib/presentation/status';

export function RoleDashboardView({
  query,
}: {
  query: {
    data?: RoleDashboard;
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    isFetching: boolean;
    refetch: () => unknown;
  };
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={query.isFetching && !query.isLoading}
            onRefresh={() => query.refetch()}
            tintColor={colors.bingo700}
          />
        }
      >
        {Platform.OS !== 'web' ? (
          <View style={styles.brandRow}>
            <Text style={styles.brand}>BinGo</Text>
            <Text style={styles.demo}>DEMO</Text>
          </View>
        ) : null}
        {query.isLoading ? (
          <SkeletonList count={4} />
        ) : query.isError ? (
          <ErrorState
            message={extractApiErrorMessage(query.error)}
            onRetry={() => query.refetch()}
          />
        ) : query.data ? (
          <DashboardContent data={query.data} />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function DashboardContent({ data }: { data: RoleDashboard }) {
  return (
    <>
      <Text style={screenStyles.screenTitle}>{data.title}</Text>
      <Text style={styles.subtitle}>
        Pantau pekerjaan penting dan lanjutkan dari status terakhir.
      </Text>
      <View style={styles.metrics}>
        {data.metrics.map((metric) => (
          <Card key={metric.label} style={styles.metric}>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={styles.metricLabel}>{metric.label}</Text>
            {metric.hint ? <Text style={styles.hint}>{metric.hint}</Text> : null}
          </Card>
        ))}
      </View>
      <Text style={styles.section}>Perlu perhatian</Text>
      {data.tasks.length ? (
        data.tasks.map((task) => (
          <Card key={task.id} style={styles.task}>
            <View style={styles.taskRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskDetail}>{task.detail}</Text>
              </View>
              <View style={styles.status}>
                <Text style={styles.statusText}>{statusLabel(task.status)}</Text>
              </View>
            </View>
          </Card>
        ))
      ) : (
        <Card>
          <Text style={styles.taskTitle}>Semua tertangani</Text>
          <Text style={styles.taskDetail}>Tidak ada tindakan mendesak saat ini.</Text>
        </Card>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.neutral50 },
  content: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    padding: spacing.lg,
    paddingBottom: 80,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  brand: { fontSize: 24, fontFamily: fonts.extraBold, color: colors.bingo800 },
  demo: {
    marginLeft: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.amber100,
    color: colors.amber800,
    fontSize: 11,
    fontFamily: fonts.bold,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  subtitle: { ...typography.bodyMuted, marginTop: spacing.xs, marginBottom: spacing.xl },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xl },
  metric: { minWidth: 180, flexGrow: 1, flexBasis: 180 },
  metricValue: {
    fontSize: 26,
    fontFamily: fonts.extraBold,
    color: colors.neutral900,
    fontVariant: ['tabular-nums'],
  },
  metricLabel: {
    marginTop: spacing.xs,
    fontSize: 14,
    color: colors.neutral600,
    fontFamily: fonts.regular,
  },
  hint: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.neutral500,
    fontFamily: fonts.regular,
  },
  section: { ...typography.sectionTitle, marginBottom: spacing.sm },
  task: { marginBottom: spacing.sm },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  taskTitle: { fontSize: 16, fontFamily: fonts.bold, color: colors.neutral900 },
  taskDetail: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: colors.neutral600,
    fontFamily: fonts.regular,
  },
  status: {
    borderRadius: radius.sm,
    backgroundColor: colors.bingo100,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: { color: colors.bingo800, fontSize: 11, fontFamily: fonts.bold },
});
