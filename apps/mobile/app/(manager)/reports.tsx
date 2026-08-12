import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { DataCard } from '../../src/components/pivot/DataListView';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useManagerOperations, useResolveReport } from '../../src/features/pivot/hooks';
import { extractApiErrorMessage } from '../../src/lib/api/client';
import { colors, screenStyles, spacing } from '../../src/theme';

export default function ReportsScreen() {
  const query = useManagerOperations();
  const resolve = useResolveReport();
  const [notes, setNotes] = useState<Record<string, string>>({});
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={screenStyles.screenTitle}>Laporan</Text>
      <Text style={styles.subtitle}>
        Tindak lanjuti laporan warga dan simpan bukti penanganannya.
      </Text>
      {query.data?.reports?.map((report: any) => (
        <DataCard
          key={report.id}
          title={report.description}
          detail={report.address}
          meta={report.status.replaceAll('_', ' ')}
          trailing={
            report.status !== 'RESOLVED' ? (
              <Text style={styles.status}>Perlu tindakan</Text>
            ) : undefined
          }
        />
      ))}
      {query.data?.reports
        ?.filter((report: any) => report.status !== 'RESOLVED')
        .map((report: any) => (
          <Input
            key={report.id}
            label={`Catatan penyelesaian: ${report.address}`}
            value={notes[report.id] ?? ''}
            onChangeText={(value) => setNotes((current) => ({ ...current, [report.id]: value }))}
          />
        ))}
      {query.data?.reports?.some((report: any) => report.status !== 'RESOLVED') ? (
        <Button
          label="Selesaikan laporan pertama"
          loading={resolve.isPending}
          onPress={() => {
            const report = query.data.reports.find((item: any) => item.status !== 'RESOLVED');
            resolve.mutate(
              { id: report.id, note: notes[report.id] ?? '' },
              {
                onSuccess: () =>
                  Alert.alert('Laporan selesai', 'Status dan riwayat pembaruan sudah disimpan.'),
                onError: (error) => Alert.alert('Belum selesai', extractApiErrorMessage(error)),
              },
            );
          }}
        />
      ) : (
        <Text style={styles.done}>Semua laporan telah ditangani.</Text>
      )}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    paddingBottom: 100,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  subtitle: { color: colors.neutral600, marginTop: spacing.xs, marginBottom: spacing.xl },
  status: { color: colors.red500, fontWeight: '700' },
  done: { color: colors.bingo700, fontWeight: '700' },
});
