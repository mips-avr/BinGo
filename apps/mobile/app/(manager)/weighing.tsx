import { useMemo, useState } from 'react';
import { Alert, Text } from 'react-native';
import { FormDrawer } from '../../src/components/pivot/FormDrawer';
import { ManagementPage } from '../../src/components/pivot/ManagementPage';
import { masterText } from '../../src/components/pivot/ManagerMasterScreen';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import {
  useApproveBatch,
  useCreateIntakeBatch,
  useCreateWeight,
  useCreateStationWeight,
  useManagerOperations,
} from '../../src/features/pivot/hooks';
import { extractApiErrorMessage } from '../../src/lib/api/client';
import { DemoScale, ManualScale } from '../../src/features/weighing/ScaleAdapter';
import { useNfcTag } from '../../src/features/nfc/useNfcTag';

const directions = ['IN', 'SORTED_OUTPUT', 'RESIDUE'] as const;

export default function WeighingScreen() {
  const query = useManagerOperations();
  const createBatch = useCreateIntakeBatch();
  const createWeight = useCreateWeight();
  const createStationWeight = useCreateStationWeight();
  const nfc = useNfcTag();
  const approve = useApproveBatch();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [weight, setWeight] = useState('10');
  const [direction, setDirection] = useState<(typeof directions)[number]>('IN');
  const [material, setMaterial] = useState('MIXED');
  const [cardNumber, setCardNumber] = useState('BG-DEMO-0001');
  const batches = useMemo(
    () =>
      (query.data?.batches ?? []).filter((item: any) =>
        `${item.batchNo} ${item.status}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [query.data?.batches, search],
  );
  const selected = useMemo(
    () => (query.data?.batches ?? []).find((item: any) => item.id === selectedId),
    [query.data?.batches, selectedId],
  );

  async function newBatch() {
    try {
      const batch = await createBatch.mutateAsync({});
      setSelectedId(batch.id);
      Alert.alert('Batch dibuat', `${batch.batchNo} siap menerima catatan timbang.`);
    } catch (error) {
      Alert.alert('Belum berhasil', extractApiErrorMessage(error));
    }
  }
  async function record(source: 'MANUAL' | 'SIMULATOR') {
    if (!selected) return;
    try {
      const adapter =
        source === 'SIMULATOR' ? new DemoScale(Number(weight)) : new ManualScale(Number(weight));
      const reading = await adapter.read();
      const inputEvent = direction === 'IN';
      const result = inputEvent
        ? await createStationWeight.mutateAsync({
            intakeBatchId: selected.id,
            deviceEventId: `weight-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            cardCredential: cardNumber.trim(),
            cardSource: cardNumber === 'BG-DEMO-0001' ? 'DEMO_CARD' : 'MANUAL_CARD_NUMBER',
            direction,
            material,
            weightKg: reading.weightKg,
            source: reading.source,
          })
        : await createWeight.mutateAsync({
            intakeBatchId: selected.id,
            deviceEventId: `weight-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            direction,
            material,
            weightKg: reading.weightKg,
            source: reading.source,
          });
      Alert.alert(
        'Berat tercatat',
        inputEvent
          ? `${result.collector.name} · ${reading.weightKg} kg`
          : `${reading.weightKg} kg berhasil ditambahkan ke batch.`,
      );
    } catch (error) {
      Alert.alert('Belum tercatat', extractApiErrorMessage(error));
    }
  }
  async function approveBatch() {
    if (!selected) return;
    try {
      await approve.mutateAsync(selected.id);
      setSelectedId('');
      Alert.alert('Batch disahkan', 'Inventory telah diperbarui.');
    } catch (error) {
      Alert.alert('Belum seimbang', extractApiErrorMessage(error));
    }
  }
  const output = selected ? Number(selected.outputKg) : 0;
  const input = selected ? Number(selected.inputKg) : 0;
  return (
    <>
      <ManagementPage
        title="Timbang dan Pemilahan"
        subtitle="Buka satu batch untuk mencatat input, hasil pemilahan, residu, dan mengesahkan neraca massa."
        primaryAction={{ label: 'Buat Batch', onPress: newBatch }}
        query={query}
        items={batches}
        search={search}
        onSearchChange={setSearch}
        archived={false}
        onArchivedChange={() => undefined}
        showArchiveFilter={false}
        onOpen={(item: any) => setSelectedId(item.id)}
        columns={[
          {
            key: 'batch',
            label: 'Batch',
            render: (item: any) => <Text style={masterText.primary}>{item.batchNo}</Text>,
          },
          {
            key: 'created',
            label: 'Dibuat',
            render: (item: any) => (
              <Text style={masterText.secondary}>
                {new Date(item.createdAt).toLocaleString('id-ID')}
              </Text>
            ),
          },
          {
            key: 'input',
            label: 'Masuk',
            render: (item: any) => (
              <Text style={masterText.secondary}>{Number(item.inputKg).toFixed(1)} kg</Text>
            ),
          },
          {
            key: 'output',
            label: 'Keluar',
            render: (item: any) => (
              <Text style={masterText.secondary}>{Number(item.outputKg).toFixed(1)} kg</Text>
            ),
          },
          {
            key: 'status',
            label: 'Status',
            render: (item: any) => <Text style={masterText.status}>{item.status}</Text>,
          },
        ]}
      />
      <FormDrawer
        visible={Boolean(selected)}
        title={selected?.batchNo ?? 'Detail Batch'}
        description={
          selected ? `${input.toFixed(1)} kg masuk · ${output.toFixed(1)} kg keluar` : undefined
        }
        dirty={false}
        showSubmit={selected?.status !== 'APPROVED'}
        submitLabel="Sahkan Neraca Massa"
        loading={approve.isPending}
        onClose={() => setSelectedId('')}
        onSubmit={approveBatch}
      >
        {selected?.status === 'APPROVED' ? (
          <Text style={masterText.status}>Batch telah disahkan dan tidak dapat diubah.</Text>
        ) : (
          <>
            <Text style={masterText.secondary}>Jenis pencatatan</Text>
            {directions.map((item) => (
              <Button
                key={item}
                size="sm"
                label={item.replace('_', ' ')}
                variant={direction === item ? 'primary' : 'secondary'}
                onPress={() => setDirection(item)}
              />
            ))}
            <Input
              label="Kategori material"
              value={material}
              onChangeText={(value) => setMaterial(value.toUpperCase())}
            />
            {direction === 'IN' ? (
              <>
                <Text style={masterText.secondary}>
                  Tempelkan Kartu Petugas pada pembaca NFC stasiun timbang. Untuk demonstrasi web,
                  gunakan nomor kartu tercetak.
                </Text>
                <Input
                  label="Kartu Petugas"
                  value={cardNumber}
                  autoCapitalize="characters"
                  onChangeText={(value) => setCardNumber(value.toUpperCase())}
                />
                <Button
                  label={nfc.reading ? 'Membaca Kartu...' : 'Baca Kartu NFC'}
                  variant="secondary"
                  disabled={nfc.availability !== 'siap'}
                  loading={nfc.reading}
                  onPress={async () => {
                    const credential = await nfc.readTag();
                    if (credential) setCardNumber(credential.toUpperCase());
                  }}
                />
              </>
            ) : null}
            <Input
              label="Berat (kg)"
              value={weight}
              keyboardType="decimal-pad"
              onChangeText={setWeight}
            />
            <Button
              label="Catat Manual"
              loading={createWeight.isPending || createStationWeight.isPending}
              disabled={
                !Number.isFinite(Number(weight)) ||
                Number(weight) <= 0 ||
                (direction === 'IN' && cardNumber.trim().length < 3)
              }
              onPress={() => record('MANUAL')}
            />
            <Button
              label="Gunakan Data Contoh"
              variant="secondary"
              disabled={
                !Number.isFinite(Number(weight)) ||
                Number(weight) <= 0 ||
                (direction === 'IN' && cardNumber.trim().length < 3)
              }
              onPress={() => record('SIMULATOR')}
            />
          </>
        )}
      </FormDrawer>
    </>
  );
}
