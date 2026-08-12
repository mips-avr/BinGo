import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DataCard } from '../../src/components/pivot/DataListView';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import { useCreateLot, useManagerOperations } from '../../src/features/pivot/hooks';
import { extractApiErrorMessage } from '../../src/lib/api/client';
import { colors, screenStyles, spacing } from '../../src/theme';

const materials = ['ORGANIC', 'PAPER', 'PET', 'HDPE', 'METAL', 'GLASS'] as const;
export default function MaterialsScreen() {
  const query = useManagerOperations();
  const create = useCreateLot();
  const [material, setMaterial] = useState('ORGANIC');
  const [quantityKg, setQuantity] = useState('50');
  const [pricePerKg, setPrice] = useState('1000');
  async function submit() {
    await create.mutateAsync({
      material,
      quantityKg: Number(quantityKg),
      pricePerKg: Number(pricePerKg),
    });
    Alert.alert('Lot diterbitkan', 'Business aktif dapat melihat dan memesan material ini.');
  }
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={screenStyles.screenTitle}>Material</Text>
      <Text style={styles.subtitle}>
        Inventory tercatat: {Number(query.data?.inventoryKg ?? 0).toLocaleString('id-ID')} kg
      </Text>
      <Card style={styles.panel}>
        <Text style={styles.heading}>Terbitkan lot</Text>
        <View style={styles.choices}>
          {materials.map((item) => (
            <Button
              key={item}
              size="sm"
              label={item}
              variant={material === item ? 'primary' : 'secondary'}
              onPress={() => setMaterial(item)}
            />
          ))}
        </View>
        <Input
          label="Jumlah (kg)"
          keyboardType="decimal-pad"
          value={quantityKg}
          onChangeText={setQuantity}
        />
        <Input
          label="Harga per kg"
          keyboardType="number-pad"
          value={pricePerKg}
          onChangeText={setPrice}
        />
        <Button
          label="Terbitkan ke pasokan"
          loading={create.isPending}
          onPress={() =>
            submit().catch((error) =>
              Alert.alert('Belum diterbitkan', extractApiErrorMessage(error)),
            )
          }
        />
      </Card>
      <Text style={styles.heading}>Lot organisasi</Text>
      {query.data?.lots?.map((lot: any) => (
        <DataCard
          key={lot.id}
          title={`${lot.material} • ${lot.code}`}
          detail={`${Number(lot.availableKg).toLocaleString('id-ID')} kg tersedia`}
          meta={`${lot.status} • Rp${Number(lot.pricePerKg).toLocaleString('id-ID')}/kg`}
        />
      ))}
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
  subtitle: { color: colors.neutral600, marginVertical: spacing.sm, marginBottom: spacing.xl },
  panel: { marginBottom: spacing.xl },
  heading: { fontSize: 18, fontWeight: '800', color: colors.neutral900, marginBottom: spacing.md },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
});
