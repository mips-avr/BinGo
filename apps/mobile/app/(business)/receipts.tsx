import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { DataCard } from '../../src/components/pivot/DataListView';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useBusinessCatalog, useReceiveOrder } from '../../src/features/pivot/hooks';
import { extractApiErrorMessage } from '../../src/lib/api/client';
import { colors, screenStyles, spacing } from '../../src/theme';

export default function ReceiptsScreen() {
  const query = useBusinessCatalog();
  const receive = useReceiveOrder();
  const [weights, setWeights] = useState<Record<string, string>>({});
  const pending = query.data?.orders?.filter((order: any) => !order.receipt) ?? [];
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={screenStyles.screenTitle}>Penerimaan</Text>
      <Text style={styles.subtitle}>
        Konfirmasi berat aktual agar pengalihan sampah tercatat terverifikasi.
      </Text>
      {pending.map((order: any) => (
        <DataCard
          key={order.id}
          title={order.orderNo}
          detail={`${Number(order.quantityKg).toLocaleString('id-ID')} kg ${order.lot.material}`}
          meta={order.seller.name}
        />
      ))}
      {pending.map((order: any) => (
        <Input
          key={order.id}
          label={`Berat diterima untuk ${order.orderNo} (kg)`}
          keyboardType="decimal-pad"
          value={weights[order.id] ?? String(Number(order.quantityKg))}
          onChangeText={(value) => setWeights((current) => ({ ...current, [order.id]: value }))}
        />
      ))}
      {pending[0] ? (
        <Button
          label="Konfirmasi penerimaan pertama"
          loading={receive.isPending}
          onPress={() => {
            const order = pending[0];
            receive.mutate(
              {
                id: order.id,
                receivedKg: Number(weights[order.id] ?? order.quantityKg),
                residueKg: 0,
                note: 'Diterima sesuai pemeriksaan Demo',
              },
              {
                onSuccess: () =>
                  Alert.alert('Penerimaan tercatat', 'Dashboard dampak telah diperbarui.'),
                onError: (error) =>
                  Alert.alert('Belum dikonfirmasi', extractApiErrorMessage(error)),
              },
            );
          }}
        />
      ) : (
        <Text style={styles.empty}>Tidak ada pesanan yang menunggu penerimaan.</Text>
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
  empty: { color: colors.neutral600, fontWeight: '600' },
});
