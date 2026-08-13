import { useMemo, useState } from 'react';
import { Text } from 'react-native';
import { ManagementPage } from '../../src/components/pivot/ManagementPage';
import { masterText } from '../../src/components/pivot/ManagerMasterScreen';
import { Button } from '../../src/components/ui/Button';
import { useManagerOperations, useManagerOrderAction } from '../../src/features/pivot/hooks';
export default function Screen() {
  const query = useManagerOperations();
  const mutation = useManagerOrderAction();
  const [search, setSearch] = useState('');
  const items = useMemo(
    () =>
      (query.data?.orders ?? []).filter((x: any) =>
        `${x.orderNo} ${x.buyer?.name} ${x.status}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [query.data?.orders, search],
  );
  return (
    <ManagementPage
      title="Pesanan Penjualan"
      subtitle="Konfirmasi reservasi yang dapat dipenuhi atau batalkan agar kuantitas kembali ke lot."
      query={query}
      items={items}
      search={search}
      onSearchChange={setSearch}
      archived={false}
      onArchivedChange={() => undefined}
      showArchiveFilter={false}
      renderActions={(item: any) =>
        item.status === 'RESERVED' ? (
          <>
            <Button
              size="sm"
              label="Konfirmasi"
              variant="ghost"
              onPress={() =>
                mutation.mutate({
                  id: item.id,
                  action: 'confirm',
                  reason: 'Stok diverifikasi Pengelola',
                })
              }
            />
            <Button
              size="sm"
              label="Batalkan"
              variant="ghost"
              onPress={() =>
                mutation.mutate({
                  id: item.id,
                  action: 'cancel',
                  reason: 'Tidak dapat dipenuhi Pengelola',
                })
              }
            />
          </>
        ) : null
      }
      columns={[
        {
          key: 'order',
          label: 'Pesanan',
          render: (x: any) => <Text style={masterText.primary}>{x.orderNo}</Text>,
        },
        {
          key: 'buyer',
          label: 'Business',
          render: (x: any) => <Text style={masterText.secondary}>{x.buyer?.name}</Text>,
        },
        {
          key: 'quantity',
          label: 'Jumlah',
          render: (x: any) => (
            <Text style={masterText.secondary}>
              {Number(x.quantityKg).toLocaleString('id-ID')} kg
            </Text>
          ),
        },
        {
          key: 'status',
          label: 'Status',
          render: (x: any) => <Text style={masterText.status}>{x.status}</Text>,
        },
      ]}
    />
  );
}
