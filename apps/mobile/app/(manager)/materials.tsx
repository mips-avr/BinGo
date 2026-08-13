import { Text } from 'react-native';
import { ManagerMasterScreen, masterText } from '../../src/components/pivot/ManagerMasterScreen';
import { Button } from '../../src/components/ui/Button';

export default function MaterialsScreen() {
  return (
    <ManagerMasterScreen<any>
      resource="lots"
      title="Lot Material"
      subtitle="Pantau stok material dan terbitkan lot yang siap ditawarkan kepada Business."
      createLabel="Buat Lot"
      initial={{ material: 'ORGANIC', quantityKg: '', pricePerKg: '' }}
      fields={[
        { key: 'material', label: 'Kategori material' },
        { key: 'quantityKg', label: 'Jumlah (kg)', keyboardType: 'decimal-pad', parse: Number },
        { key: 'pricePerKg', label: 'Harga per kg', keyboardType: 'number-pad', parse: Number },
      ]}
      renderActions={(item, mutation) =>
        item.status === 'DRAFT' ? (
          <Button
            size="sm"
            label="Terbitkan"
            variant="ghost"
            onPress={() => mutation.mutate({ action: 'publish', id: item.id })}
          />
        ) : item.status === 'PUBLISHED' ? (
          <Button
            size="sm"
            label="Tutup"
            variant="ghost"
            onPress={() => mutation.mutate({ action: 'close', id: item.id })}
          />
        ) : null
      }
      canEdit={(item) => item.status === 'DRAFT'}
      columns={[
        {
          key: 'code',
          label: 'Kode',
          render: (item) => <Text style={masterText.primary}>{item.code}</Text>,
        },
        {
          key: 'material',
          label: 'Material',
          render: (item) => <Text style={masterText.secondary}>{item.material}</Text>,
        },
        {
          key: 'availableKg',
          label: 'Tersedia',
          render: (item) => (
            <Text style={masterText.secondary}>
              {Number(item.availableKg).toLocaleString('id-ID')} kg
            </Text>
          ),
        },
        {
          key: 'status',
          label: 'Status',
          render: (item) => <Text style={masterText.status}>{item.status}</Text>,
        },
      ]}
    />
  );
}
