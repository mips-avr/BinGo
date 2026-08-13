import { useMemo, useState } from 'react';
import { Text } from 'react-native';
import { ManagementPage } from '../../src/components/pivot/ManagementPage';
import { masterText } from '../../src/components/pivot/ManagerMasterScreen';
import { Button } from '../../src/components/ui/Button';
import { useBusinessCatalog, useBusinessOrderAction } from '../../src/features/pivot/hooks';
export default function Screen() {
  const query = useBusinessCatalog();
  const mutation = useBusinessOrderAction();
  const [search, setSearch] = useState('');
  const items = useMemo(
    () =>
      (query.data?.orders ?? []).filter((x: any) =>
        `${x.orderNo} ${x.seller?.name} ${x.status}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [query.data?.orders, search],
  );
  return (
    <ManagementPage
      title="Pesanan"
      subtitle="Pantau pesanan. Reservasi dapat dibatalkan sebelum dikonfirmasi Pengelola."
      query={query}
      items={items}
      search={search}
      onSearchChange={setSearch}
      archived={false}
      onArchivedChange={() => undefined}
      showArchiveFilter={false}
      renderActions={(item: any) =>
        item.status === 'RESERVED' ? (
          <Button
            size="sm"
            label="Batalkan"
            variant="ghost"
            onPress={() => mutation.mutate({ id: item.id, reason: 'Dibatalkan oleh Business' })}
          />
        ) : null
      }
      columns={[
        {
          key: 'order',
          label: 'Pesanan',
          render: (x: any) => <Text style={masterText.primary}>{x.orderNo}</Text>,
        },
        {
          key: 'seller',
          label: 'Pengelola',
          render: (x: any) => <Text style={masterText.secondary}>{x.seller?.name}</Text>,
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
