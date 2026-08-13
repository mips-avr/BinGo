import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { SkeletonList } from '../../src/components/ui/Skeleton';
import { useHouseholdService, usePayInvoice } from '../../src/features/pivot/hooks';
import { colors, screenStyles, spacing } from '../../src/theme';

export default function ServicesScreen() {
  const query = useHouseholdService();
  const payment = usePayInvoice();
  if (query.isLoading)
    return (
      <SafeAreaView style={styles.safe}>
        <SkeletonList />
      </SafeAreaView>
    );
  if (query.isError)
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message="Layanan belum dapat dimuat" onRetry={() => query.refetch()} />
      </SafeAreaView>
    );
  const data = query.data;
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={screenStyles.screenTitle}>Layanan Saya</Text>
        <Text style={styles.lead}>Jadwal dan iuran rumah tangga dalam satu tempat.</Text>
        <Card style={styles.card}>
          <Text style={styles.eyebrow}>PAKET AKTIF</Text>
          <Text style={styles.title}>{data.household.subscriptions[0]?.servicePlan.name}</Text>
          <Text style={styles.body}>{data.household.serviceArea.name}</Text>
        </Card>
        <Card style={styles.card}>
          <Text style={styles.eyebrow}>JADWAL BERIKUTNYA</Text>
          <Text style={styles.title}>{data.nextCalendar?.title ?? 'Belum dijadwalkan'}</Text>
          <Text style={styles.body}>
            {data.nextCalendar
              ? `${data.nextCalendar.startTime} sampai ${data.nextCalendar.endTime}`
              : 'Pengelola akan memperbarui jadwal.'}
          </Text>
        </Card>
        <Card style={styles.card}>
          <Text style={styles.eyebrow}>IURAN BULANAN</Text>
          {data.invoice ? (
            <>
              <Text style={styles.amount}>
                Rp{Number(data.invoice.amount).toLocaleString('id-ID')}
              </Text>
              <Text style={styles.body}>
                Jatuh tempo {new Date(data.invoice.dueAt).toLocaleDateString('id-ID')}
              </Text>
              <Button
                label="Bayar"
                loading={payment.isPending}
                onPress={() =>
                  payment.mutate(data.invoice.id, {
                    onSuccess: () =>
                      Alert.alert('Pembayaran berhasil', 'Iuran bulan ini telah tercatat lunas.'),
                  })
                }
                style={{ marginTop: spacing.md }}
              />
            </>
          ) : (
            <>
              <Text style={styles.title}>Lunas</Text>
              <Text style={styles.body}>Tidak ada tagihan tertunda.</Text>
            </>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.neutral50 },
  content: { padding: spacing.lg, paddingBottom: 80 },
  lead: { color: colors.neutral600, fontSize: 15, marginTop: spacing.xs, marginBottom: spacing.lg },
  card: { marginBottom: spacing.md },
  eyebrow: { fontSize: 11, fontWeight: '800', color: colors.bingo700, marginBottom: spacing.xs },
  title: { fontSize: 18, fontWeight: '800', color: colors.neutral900 },
  amount: { fontSize: 28, fontWeight: '900', color: colors.neutral900 },
  body: { fontSize: 14, color: colors.neutral600, marginTop: spacing.xs },
});
