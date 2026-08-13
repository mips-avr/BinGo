import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ManagerMasterScreen, masterText } from '../../src/components/pivot/ManagerMasterScreen';
export default function Screen() {
  const router = useRouter();
  return (
    <ManagerMasterScreen<any>
      resource="weigh-stations"
      title="Stasiun Timbang"
      subtitle="Kelola lokasi dan kanal pencatatan timbang."
      createLabel="Tambah Stasiun"
      secondaryActions={[
        { label: 'Kembali ke Batch', onPress: () => router.push('/(manager)/weighing' as never) },
      ]}
      initial={{ name: '', address: '', channels: 'Timbangan Utama' }}
      fields={[
        { key: 'name', label: 'Nama stasiun' },
        { key: 'address', label: 'Alamat' },
        {
          key: 'channels',
          label: 'Kanal, pisahkan koma',
          getValue: (item) =>
            ((item.channels as { label: string; active: boolean }[] | undefined) ?? [])
              .filter((channel) => channel.active)
              .map((channel) => channel.label)
              .join(', '),
        },
      ]}
      normalize={(value) => ({
        ...value,
        channels: String(value.channels)
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
      })}
      columns={[
        {
          key: 'name',
          label: 'Stasiun',
          render: (x) => <Text style={masterText.primary}>{x.name}</Text>,
        },
        {
          key: 'address',
          label: 'Alamat',
          render: (x) => <Text style={masterText.secondary}>{x.address}</Text>,
        },
        {
          key: 'channels',
          label: 'Kanal',
          render: (x) => <Text style={masterText.secondary}>{x.channels?.length ?? 0}</Text>,
        },
        {
          key: 'batches',
          label: 'Batch',
          render: (x) => <Text style={masterText.status}>{x._count?.intakeBatches ?? 0}</Text>,
        },
      ]}
    />
  );
}
