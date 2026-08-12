import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DataCard } from '../../src/components/pivot/DataListView';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import { useBusinessCatalog, useCreateRequirement } from '../../src/features/pivot/hooks';
import { extractApiErrorMessage } from '../../src/lib/api/client';
import { colors, screenStyles, spacing } from '../../src/theme';

const materials = ['ORGANIC', 'PAPER', 'PET', 'HDPE', 'METAL', 'GLASS'] as const;
export default function RequirementsScreen() {
  const query = useBusinessCatalog();
  const create = useCreateRequirement();
  const [title, setTitle] = useState('Bahan baku kompos Demo');
  const [material, setMaterial] = useState('ORGANIC');
  const [quantityKg, setQuantity] = useState('50');
  const [pricePerKg, setPrice] = useState('1000');
  const [region, setRegion] = useState('Jakarta Timur');
  async function submit() {
    await create.mutateAsync({
      title,
      material,
      quantityKg: Number(quantityKg),
      pricePerKg: Number(pricePerKg),
      region,
    });
    Alert.alert('Kebutuhan diterbitkan', 'Pengelola dapat melihat kebutuhan material ini.');
  }
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={screenStyles.screenTitle}>Kebutuhan Material</Text>
      <Text style={styles.subtitle}>
        Nyatakan material, volume, wilayah, dan nilai yang dibutuhkan.
      </Text>
      <Card style={styles.panel}>
        <Text style={styles.heading}>Buat kebutuhan</Text>
        <Input label="Judul" value={title} onChangeText={setTitle} />
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
          label="Target harga per kg"
          keyboardType="number-pad"
          value={pricePerKg}
          onChangeText={setPrice}
        />
        <Input label="Wilayah" value={region} onChangeText={setRegion} />
        <Button
          label="Terbitkan kebutuhan"
          loading={create.isPending}
          onPress={() =>
            submit().catch((error) =>
              Alert.alert('Belum diterbitkan', extractApiErrorMessage(error)),
            )
          }
        />
      </Card>
      <Text style={styles.heading}>Publikasi saya</Text>
      {query.data?.requirements?.map((item: any) => (
        <DataCard
          key={item.id}
          title={item.title}
          detail={`${Number(item.quantityKg).toLocaleString('id-ID')} kg ${item.material}`}
          meta={`${item.status} • ${item.region}`}
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
  subtitle: { color: colors.neutral600, marginTop: spacing.xs, marginBottom: spacing.xl },
  panel: { marginBottom: spacing.xl },
  heading: { fontSize: 18, fontWeight: '800', color: colors.neutral900, marginBottom: spacing.md },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
});
