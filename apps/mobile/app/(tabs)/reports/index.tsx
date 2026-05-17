import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReportsFeed } from '../../../src/features/reports/hooks';
import { ReportCard } from '../../../src/components/reports/ReportCard';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { colors } from '../../../src/theme/screen';
import { t } from '../../../src/i18n';

export default function ReportsList() {
  const router = useRouter();
  const query = useReportsFeed();

  if (query.isLoading) {
    return (
      <SafeAreaView style={s.center} edges={['top']}>
        <ActivityIndicator color={colors.bingo700} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>{t.report.feedTitle}</Text>
      </View>

      {query.isError ? (
        <View style={s.errorWrap}>
          <Text style={s.errorText}>
            {extractApiErrorMessage(query.error, t.common.error)}
          </Text>
        </View>
      ) : null}

      <FlatList
        data={query.data ?? []}
        keyExtractor={(r) => r.id}
        contentContainerStyle={s.listContent}
        renderItem={({ item }) => (
          <ReportCard
            report={item}
            onPress={() => router.push(`/(tabs)/reports/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="📷"
            title={t.report.emptyTitle}
            message={t.report.emptyMessage}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={query.isFetching && !query.isLoading}
            onRefresh={() => query.refetch()}
            tintColor={colors.bingo700}
          />
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bingo50 },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 20, fontWeight: '700', color: colors.neutral900 },
  errorWrap: { paddingHorizontal: 20 },
  errorText: { fontSize: 14, color: colors.red600 },
  listContent: { paddingHorizontal: 20, paddingBottom: 32 },
});
