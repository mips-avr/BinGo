import { useMemo, useState } from 'react';
import { Alert, Text } from 'react-native';
import { FormDrawer } from '../../src/components/pivot/FormDrawer';
import { ManagementPage } from '../../src/components/pivot/ManagementPage';
import { masterText } from '../../src/components/pivot/ManagerMasterScreen';
import { Input } from '../../src/components/ui/Input';
import { useBusinessCatalog, useReceiveOrder } from '../../src/features/pivot/hooks';
import { extractApiErrorMessage } from '../../src/lib/api/client';

export default function ReceiptsScreen() {
  const query = useBusinessCatalog();
  const receive = useReceiveOrder();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [receivedKg, setReceivedKg] = useState('');
  const [residueKg, setResidueKg] = useState('0');
  const [note, setNote] = useState('');
  const pending = useMemo(
    () =>
      (query.data?.orders ?? []).filter(
        (order: any) =>
          !order.receipt &&
          `${order.orderNo} ${order.seller?.name}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [query.data?.orders, search],
  );
  function open(order: any) {
    setSelected(order);
    setReceivedKg(String(Number(order.quantityKg)));
    setResidueKg('0');
    setNote('');
  }
  async function save() {
    try {
      await receive.mutateAsync({
        id: selected.id,
        receivedKg: Number(receivedKg),
        residueKg: Number(residueKg || 0),
        note,
      });
      setSelected(null);
      Alert.alert(
        'Penerimaan tercatat',
        'Berat diterima dan dampak terverifikasi telah diperbarui.',
      );
    } catch (error) {
      Alert.alert('Belum dikonfirmasi', extractApiErrorMessage(error));
    }
  }
  return (
    <>
      <ManagementPage
        title="Penerimaan"
        subtitle="Buka pesanan yang tiba untuk mencatat berat aktual satu kali."
        query={query}
        items={pending}
        search={search}
        onSearchChange={setSearch}
        archived={false}
        onArchivedChange={() => undefined}
        showArchiveFilter={false}
        onOpen={open}
        columns={[
          {
            key: 'order',
            label: 'Pesanan',
            render: (item: any) => <Text style={masterText.primary}>{item.orderNo}</Text>,
          },
          {
            key: 'seller',
            label: 'Pengelola',
            render: (item: any) => <Text style={masterText.secondary}>{item.seller?.name}</Text>,
          },
          {
            key: 'material',
            label: 'Material',
            render: (item: any) => <Text style={masterText.secondary}>{item.lot?.material}</Text>,
          },
          {
            key: 'quantity',
            label: 'Dipesan',
            render: (item: any) => (
              <Text style={masterText.status}>
                {Number(item.quantityKg).toLocaleString('id-ID')} kg
              </Text>
            ),
          },
        ]}
      />
      <FormDrawer
        visible={Boolean(selected)}
        title={`Konfirmasi ${selected?.orderNo ?? 'Penerimaan'}`}
        description="Penerimaan bersifat final dan tidak dapat diedit. Pastikan angka sesuai hasil pemeriksaan."
        dirty={Boolean(receivedKg)}
        loading={receive.isPending}
        submitLabel="Konfirmasi Penerimaan"
        onClose={() => setSelected(null)}
        onSubmit={save}
      >
        <Input
          label="Berat diterima (kg)"
          keyboardType="decimal-pad"
          value={receivedKg}
          onChangeText={setReceivedKg}
        />
        <Input
          label="Residu (kg)"
          keyboardType="decimal-pad"
          value={residueKg}
          onChangeText={setResidueKg}
        />
        <Input
          label="Catatan pemeriksaan"
          value={note}
          multiline
          numberOfLines={4}
          onChangeText={setNote}
        />
      </FormDrawer>
    </>
  );
}
