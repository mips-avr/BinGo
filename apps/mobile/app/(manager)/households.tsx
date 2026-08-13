import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ManagerMasterScreen, masterText } from '../../src/components/pivot/ManagerMasterScreen';
export default function Screen() {
  const router = useRouter();
  return (
    <ManagerMasterScreen<any>
      resource="households"
      title="Rumah Tangga"
      subtitle="Kelola akun layanan dan alamat pelanggan pada wilayah Pengelola."
      createLabel="Tambah Rumah Tangga"
      secondaryActions={[
        {
          label: 'Kembali ke Wilayah',
          onPress: () => router.push('/(manager)/customers' as never),
        },
      ]}
      initial={{
        serviceAreaId: '',
        accountNo: '',
        displayAddress: '',
        lat: '',
        lng: '',
        userPhone: '',
      }}
      fields={[
        { key: 'serviceAreaId', label: 'ID wilayah layanan' },
        { key: 'accountNo', label: 'Nomor pelanggan' },
        { key: 'displayAddress', label: 'Alamat layanan' },
        { key: 'lat', label: 'Latitude', keyboardType: 'decimal-pad', parse: Number },
        { key: 'lng', label: 'Longitude', keyboardType: 'decimal-pad', parse: Number },
        {
          key: 'userPhone',
          label: 'Nomor akun Warga (opsional)',
          keyboardType: 'phone-pad',
          getValue: (item) => (item.user as { phone?: string } | undefined)?.phone ?? '',
        },
      ]}
      columns={[
        {
          key: 'account',
          label: 'Pelanggan',
          render: (x) => <Text style={masterText.primary}>{x.accountNo}</Text>,
        },
        {
          key: 'address',
          label: 'Alamat',
          render: (x) => <Text style={masterText.secondary}>{x.displayAddress}</Text>,
        },
        {
          key: 'area',
          label: 'Wilayah',
          render: (x) => <Text style={masterText.secondary}>{x.serviceArea?.name}</Text>,
        },
        {
          key: 'status',
          label: 'Status',
          render: (x) => <Text style={masterText.status}>{x.active ? 'AKTIF' : 'NONAKTIF'}</Text>,
        },
        {
          key: 'accountLink',
          label: 'Akun aplikasi',
          render: (x) => (
            <Text style={masterText.secondary}>{x.user?.name ?? 'Belum terhubung'}</Text>
          ),
        },
      ]}
    />
  );
}
