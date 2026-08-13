import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ManagerMasterScreen, masterText } from '../../src/components/pivot/ManagerMasterScreen';
export default function Screen() {
  const router = useRouter();
  return (
    <ManagerMasterScreen<any>
      resource="service-plans"
      title="Paket Layanan"
      subtitle="Kelola tarif bulanan dan hari pengumpulan yang ditawarkan."
      createLabel="Tambah Paket"
      secondaryActions={[
        { label: 'Kembali ke Wilayah', onPress: () => router.push('/(manager)/customers' as never) },
      ]}
      initial={{ serviceAreaId: '', name: '', monthlyFee: '', collectionDays: 'MONDAY, THURSDAY' }}
      fields={[
        { key: 'serviceAreaId', label: 'ID wilayah (opsional)' },
        { key: 'name', label: 'Nama paket' },
        { key: 'monthlyFee', label: 'Iuran bulanan', keyboardType: 'number-pad', parse: Number },
        { key: 'collectionDays', label: 'Hari, pisahkan koma' },
      ]}
      normalize={(value) => ({
        ...value,
        collectionDays: String(value.collectionDays)
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
      })}
      columns={[
        {
          key: 'name',
          label: 'Paket',
          render: (x) => <Text style={masterText.primary}>{x.name}</Text>,
        },
        {
          key: 'fee',
          label: 'Iuran',
          render: (x) => (
            <Text style={masterText.secondary}>
              Rp{Number(x.monthlyFee).toLocaleString('id-ID')}
            </Text>
          ),
        },
        {
          key: 'days',
          label: 'Jadwal',
          render: (x) => <Text style={masterText.secondary}>{x.collectionDays.join(', ')}</Text>,
        },
        {
          key: 'subs',
          label: 'Langganan',
          render: (x) => <Text style={masterText.status}>{x._count?.subscriptions ?? 0}</Text>,
        },
      ]}
    />
  );
}
