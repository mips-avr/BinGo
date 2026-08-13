import { Text } from 'react-native';
import { ManagerMasterScreen, masterText } from '../../src/components/pivot/ManagerMasterScreen';
import { useRouter } from 'expo-router';

export default function Screen() {
  const router = useRouter();
  return (
    <ManagerMasterScreen<any>
      resource="service-areas"
      title="Wilayah Layanan"
      subtitle="Kelola wilayah kolektif dan status kesiapan layanan. Rumah tangga dikelola dari detail wilayah."
      createLabel="Tambah Wilayah"
      secondaryActions={[
        { label: 'Rumah Tangga', onPress: () => router.push('/(manager)/households' as never) },
        { label: 'Paket Layanan', onPress: () => router.push('/(manager)/service-plans' as never) },
        { label: 'Langganan', onPress: () => router.push('/(manager)/subscriptions' as never) },
      ]}
      initial={{ name: '', region: '', densityLabel: '', status: 'ACTIVE' }}
      fields={[
        { key: 'name', label: 'Nama wilayah' },
        { key: 'region', label: 'Kecamatan atau wilayah administratif' },
        { key: 'densityLabel', label: 'Kepadatan' },
        { key: 'status', label: 'Status', placeholder: 'ACTIVE atau COLLECTING_INTEREST' },
      ]}
      columns={[
        {
          key: 'name',
          label: 'Wilayah',
          render: (item) => <Text style={masterText.primary}>{item.name}</Text>,
        },
        {
          key: 'region',
          label: 'Region',
          render: (item) => <Text style={masterText.secondary}>{item.region}</Text>,
        },
        {
          key: 'households',
          label: 'Rumah Tangga',
          render: (item) => <Text style={masterText.secondary}>{item._count.households}</Text>,
        },
        {
          key: 'status',
          label: 'Status',
          render: (item) => (
            <Text style={masterText.status}>{item.status.replaceAll('_', ' ')}</Text>
          ),
        },
      ]}
    />
  );
}
