import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../src/components/ui/Card';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { SkeletonList } from '../../src/components/ui/Skeleton';
import { useCollectorToday } from '../../src/features/pivot/hooks';
import { colors, fonts, screenStyles, spacing } from '../../src/theme';

export default function Screen() {
  const query = useCollectorToday();
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={screenStyles.screenTitle}>Kontribusi Timbang</Text>
        <Text style={styles.body}>
          Tempelkan Kartu Petugas pada pembaca NFC di stasiun timbang. Berat akan otomatis terhubung
          ke akun Anda setelah dikonfirmasi operator.
        </Text>
        {query.isLoading ? (
          <SkeletonList count={3} />
        ) : query.isError ? (
          <ErrorState
            message="Riwayat timbang belum dapat dimuat"
            onRetry={() => query.refetch()}
          />
        ) : (
          <>
            <Card>
              <Text style={styles.label}>TOTAL KONTRIBUSI TERBARU</Text>
              <Text style={styles.total}>
                {Number(query.data?.totalWeightKg ?? 0).toFixed(1)} kg
              </Text>
            </Card>
            <Text style={styles.sectionTitle}>Riwayat Terakhir</Text>
            {(query.data?.recentWeights ?? []).map((event: any) => (
              <Card key={event.id} style={styles.eventCard}>
                <View style={styles.row}>
                  <View style={styles.eventCopy}>
                    <Text style={styles.eventTitle}>{event.material}</Text>
                    <Text style={styles.meta}>{event.intakeBatch.station.name}</Text>
                    <Text style={styles.meta}>
                      {new Date(event.occurredAt).toLocaleString('id-ID')}
                    </Text>
                  </View>
                  <Text style={styles.weight}>{Number(event.weightKg).toFixed(1)} kg</Text>
                </View>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.neutral50 },
  content: { padding: spacing.lg, paddingBottom: 100 },
  body: { marginVertical: spacing.md, fontSize: 15, lineHeight: 22, color: colors.neutral700 },
  label: { fontSize: 11, fontFamily: fonts.bold, color: colors.bingo700 },
  total: {
    marginTop: spacing.xs,
    fontSize: 32,
    fontFamily: fonts.extraBold,
    color: colors.neutral900,
  },
  sectionTitle: {
    marginVertical: spacing.md,
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.neutral900,
  },
  eventCard: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  eventCopy: { flex: 1, gap: 2 },
  eventTitle: { fontSize: 15, fontFamily: fonts.bold, color: colors.neutral900 },
  meta: { fontSize: 12, fontFamily: fonts.regular, color: colors.neutral600 },
  weight: { fontSize: 17, fontFamily: fonts.bold, color: colors.bingo700 },
});
