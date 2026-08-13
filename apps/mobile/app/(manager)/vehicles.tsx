import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ManagerMasterScreen, masterText } from '../../src/components/pivot/ManagerMasterScreen';
export default function Screen() {
  const router = useRouter();
  return (
    <ManagerMasterScreen<any>
      resource="vehicles"
      title="Kendaraan"
      subtitle="Kelola kendaraan yang tersedia untuk penugasan pengumpulan."
      createLabel="Tambah Kendaraan"
      secondaryActions={[
        { label: 'Kembali ke Rute', onPress: () => router.push('/(manager)/routes' as never) },
      ]}
      initial={{ label: '', plateNumber: '', capacityKg: '' }}
      fields={[
        { key: 'label', label: 'Nama kendaraan' },
        { key: 'plateNumber', label: 'Nomor polisi' },
        { key: 'capacityKg', label: 'Kapasitas (kg)', keyboardType: 'decimal-pad', parse: Number },
      ]}
      columns={[
        {
          key: 'label',
          label: 'Kendaraan',
          render: (x) => <Text style={masterText.primary}>{x.label}</Text>,
        },
        {
          key: 'plate',
          label: 'Nomor Polisi',
          render: (x) => <Text style={masterText.secondary}>{x.plateNumber || '—'}</Text>,
        },
        {
          key: 'capacity',
          label: 'Kapasitas',
          render: (x) => (
            <Text style={masterText.secondary}>
              {Number(x.capacityKg || 0).toLocaleString('id-ID')} kg
            </Text>
          ),
        },
        {
          key: 'runs',
          label: 'Riwayat',
          render: (x) => <Text style={masterText.status}>{x._count?.runs ?? 0} tugas</Text>,
        },
      ]}
    />
  );
}
