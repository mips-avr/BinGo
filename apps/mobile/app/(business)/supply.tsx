import { useState } from 'react';
import { Alert, Text } from 'react-native';
import { DataCard, DataListView } from '../../src/components/pivot/DataListView';
import { FormDrawer } from '../../src/components/pivot/FormDrawer';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useBusinessCatalog, useCreateOrder } from '../../src/features/pivot/hooks';
import { extractApiErrorMessage } from '../../src/lib/api/client';
export default function SupplyScreen() {
  const query = useBusinessCatalog();
  const order = useCreateOrder();
  const [selected, setSelected] = useState<any>(null);
  const [quantity, setQuantity] = useState('');
  async function submit() {
    try {
      await order.mutateAsync({ lotId: selected.id, quantityKg: Number(quantity) });
      setSelected(null);
    } catch (error) {
      Alert.alert('Belum dipesan', extractApiErrorMessage(error));
    }
  }
  return (
    <>
      <DataListView
        title="Pasokan Material"
        subtitle="Bandingkan lot yang tersedia, lalu tekan Pesan pada material yang sesuai."
        query={query}
        renderItems={(data) =>
          data.lots.map((lot: any) => (
            <DataCard
              key={lot.id}
              title={`${lot.material} • ${lot.code}`}
              detail={`${Number(lot.availableKg).toLocaleString('id-ID')} kg • Rp${Number(lot.pricePerKg).toLocaleString('id-ID')}/kg`}
              meta={lot.organization.name}
              trailing={
                <Button
                  size="sm"
                  label="Pesan"
                  onPress={() => {
                    setSelected(lot);
                    setQuantity('');
                  }}
                />
              }
            />
          ))
        }
      />
      <FormDrawer
        visible={Boolean(selected)}
        title="Pesan Material"
        description={
          selected ? `${selected.material} dari ${selected.organization.name}` : undefined
        }
        loading={order.isPending}
        dirty={Boolean(quantity)}
        submitLabel="Buat Pesanan"
        onClose={() => setSelected(null)}
        onSubmit={submit}
      >
        {selected ? (
          <Text>{Number(selected.availableKg).toLocaleString('id-ID')} kg tersedia</Text>
        ) : null}
        <Input
          label="Jumlah pesanan (kg)"
          value={quantity}
          keyboardType="decimal-pad"
          onChangeText={setQuantity}
        />
      </FormDrawer>
    </>
  );
}
