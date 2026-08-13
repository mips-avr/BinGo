import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import {
  useApproveBatch,
  useCreateIntakeBatch,
  useCreateWeight,
  useManagerOperations,
} from '../../src/features/pivot/hooks';
import { DemoScale, ManualScale } from '../../src/features/weighing/ScaleAdapter';
import { colors, screenStyles, spacing } from '../../src/theme';

const directions = ['IN', 'SORTED_OUTPUT', 'RESIDUE'] as const;

export default function WeighingScreen() {
  const query = useManagerOperations();
  const createBatch = useCreateIntakeBatch();
  const createWeight = useCreateWeight();
  const approve = useApproveBatch();
  const [selectedId, setSelectedId] = useState('');
  const [weight, setWeight] = useState('10');
  const [direction, setDirection] = useState<(typeof directions)[number]>('IN');
  const [material, setMaterial] = useState('MIXED');
  const batches = useMemo(() => query.data?.batches ?? [], [query.data?.batches]);
  const selected = useMemo(
    () => batches.find((item: any) => item.id === selectedId),
    [batches, selectedId],
  );

  async function newBatch() {
    const batch = await createBatch.mutateAsync({});
    setSelectedId(batch.id);
    Alert.alert('Batch dibuat', `${batch.batchNo} siap menerima catatan timbang.`);
  }

  async function record(source: 'MANUAL' | 'SIMULATOR') {
    if (!selected) return Alert.alert('Pilih batch', 'Buat batch timbang terlebih dahulu.');
    const adapter =
      source === 'SIMULATOR' ? new DemoScale(Number(weight)) : new ManualScale(Number(weight));
    const reading = await adapter.read();
    await createWeight.mutateAsync({
      intakeBatchId: selected.id,
      deviceEventId: `weight-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      direction,
      material,
      weightKg: reading.weightKg,
      source: reading.source,
    });
    Alert.alert('Berat tercatat', `${reading.weightKg} kg dicatat sebagai ${reading.source}.`);
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={screenStyles.screenTitle}>Timbang dan Pemilahan</Text>
      <Text style={styles.subtitle}>
        Catat input, material terpilah, dan residu. Sahkan hanya ketika neraca massa seimbang.
      </Text>
      <Button
        label="Buat batch baru"
        onPress={() => newBatch().catch((error) => Alert.alert('Belum berhasil', String(error)))}
        loading={createBatch.isPending}
      />
      <View style={styles.list}>
        {batches.map((batch: any) => (
          <Button
            key={batch.id}
            label={`${batch.batchNo} • ${batch.status}`}
            variant={selected?.id === batch.id ? 'primary' : 'secondary'}
            onPress={() => setSelectedId(batch.id)}
          />
        ))}
      </View>
      {selected ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>{selected.batchNo}</Text>
          <Text style={styles.balance}>
            {Number(selected.inputKg).toFixed(1)} kg masuk • {Number(selected.outputKg).toFixed(1)}{' '}
            kg keluar
          </Text>
          <View style={styles.row}>
            {directions.map((item) => (
              <Button
                key={item}
                size="sm"
                label={item.replace('_', ' ')}
                variant={direction === item ? 'primary' : 'secondary'}
                onPress={() => setDirection(item)}
              />
            ))}
          </View>
          <Input
            label="Kategori material"
            value={material}
            onChangeText={(value) => setMaterial(value.toUpperCase())}
          />
          <Input
            label="Berat (kg)"
            value={weight}
            keyboardType="decimal-pad"
            onChangeText={setWeight}
          />
          <Button
            label="Catat manual"
            onPress={() =>
              record('MANUAL').catch((error) => Alert.alert('Belum tercatat', String(error)))
            }
            loading={createWeight.isPending}
          />
          <Button
            label="Gunakan simulator Demo"
            variant="secondary"
            style={{ marginTop: spacing.sm }}
            onPress={() =>
              record('SIMULATOR').catch((error) => Alert.alert('Belum tercatat', String(error)))
            }
          />
          <Button
            label="Sahkan neraca massa"
            style={{ marginTop: spacing.xl }}
            disabled={selected.status === 'APPROVED'}
            loading={approve.isPending}
            onPress={() =>
              approve.mutate(selected.id, {
                onSuccess: () => Alert.alert('Batch disahkan', 'Inventory telah diperbarui.'),
                onError: (error) => Alert.alert('Belum seimbang', String(error)),
              })
            }
          />
        </View>
      ) : null}
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
  subtitle: {
    color: colors.neutral600,
    fontSize: 15,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  list: { gap: spacing.sm, marginVertical: spacing.xl },
  panel: {
    borderWidth: 1,
    borderColor: colors.neutral200,
    borderRadius: 16,
    padding: spacing.xl,
    backgroundColor: colors.white,
  },
  panelTitle: { fontSize: 20, fontWeight: '800', color: colors.neutral900 },
  balance: { fontSize: 14, color: colors.neutral600, marginTop: 4, marginBottom: spacing.lg },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
});
