import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { DataCard } from '../../src/components/pivot/DataListView';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useBusinessCatalog, useCreateOrder } from '../../src/features/pivot/hooks';
import { extractApiErrorMessage } from '../../src/lib/api/client';
import { colors, screenStyles, spacing } from '../../src/theme';

export default function SupplyScreen() {
  const query = useBusinessCatalog();
  const order = useCreateOrder();
  const [lotId, setLotId] = useState('');
  const [quantityKg, setQuantity] = useState('50');
  const selected = query.data?.lots?.find((lot: any) => lot.id === lotId) ?? query.data?.lots?.[0];
  async function submit() {
    if (!selected) return Alert.alert('Pasokan kosong', 'Belum ada lot yang dapat dipesan.');
    const result = await order.mutateAsync({ lotId: selected.id, quantityKg: Number(quantityKg) });
    Alert.alert('Pesanan dibuat', `${result.orderNo} telah mereservasi material.`);
  }
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={screenStyles.screenTitle}>Pasokan Material</Text>
      <Text style={styles.subtitle}>Pilih lot tersedia dan tentukan jumlah pesanan.</Text>
      {query.data?.lots?.map((lot: any) => (
        <DataCard
          key={lot.id}
          title={`${lot.material} • ${lot.code}`}
          detail={`${Number(lot.availableKg).toLocaleString('id-ID')} kg • Rp${Number(lot.pricePerKg).toLocaleString('id-ID')}/kg`}
          meta={lot.organization.name}
          trailing={
            <Button
              size="sm"
              label={selected?.id === lot.id ? 'Dipilih' : 'Pilih'}
              variant={selected?.id === lot.id ? 'primary' : 'secondary'}
              onPress={() => setLotId(lot.id)}
            />
          }
        />
      ))}
      {selected ? (
        <>
          <Input
            label="Jumlah pesanan (kg)"
            keyboardType="decimal-pad"
            value={quantityKg}
            onChangeText={setQuantity}
          />
          <Button
            label="Pesan material"
            loading={order.isPending}
            onPress={() =>
              submit().catch((error) => Alert.alert('Belum dipesan', extractApiErrorMessage(error)))
            }
          />
        </>
      ) : (
        <Text style={styles.empty}>Belum ada pasokan aktif.</Text>
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
  empty: { color: colors.neutral600 },
});
