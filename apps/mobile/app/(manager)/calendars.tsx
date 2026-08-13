import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ManagerMasterScreen, masterText } from '../../src/components/pivot/ManagerMasterScreen';
export default function Screen() {
  const router = useRouter();
  return (
    <ManagerMasterScreen<any>
      resource="calendars"
      title="Kalender Pengumpulan"
      subtitle="Kelola jadwal umum per wilayah sebelum membuat tugas operasional."
      createLabel="Tambah Kalender"
      secondaryActions={[
        { label: 'Kembali ke Rute', onPress: () => router.push('/(manager)/routes' as never) },
      ]}
      initial={{
        serviceAreaId: '',
        title: '',
        days: 'MONDAY, THURSDAY',
        startTime: '07:00',
        endTime: '11:00',
        materials: 'ORGANIC, MIXED',
      }}
      fields={[
        { key: 'serviceAreaId', label: 'ID wilayah' },
        { key: 'title', label: 'Nama kalender' },
        { key: 'days', label: 'Hari, pisahkan koma' },
        { key: 'startTime', label: 'Jam mulai' },
        { key: 'endTime', label: 'Jam selesai' },
        { key: 'materials', label: 'Material, pisahkan koma' },
      ]}
      normalize={(value) => ({
        ...value,
        days: String(value.days)
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
        materials: String(value.materials)
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
      })}
      columns={[
        {
          key: 'title',
          label: 'Kalender',
          render: (x) => <Text style={masterText.primary}>{x.title}</Text>,
        },
        {
          key: 'area',
          label: 'Wilayah',
          render: (x) => <Text style={masterText.secondary}>{x.serviceArea?.name}</Text>,
        },
        {
          key: 'days',
          label: 'Hari',
          render: (x) => <Text style={masterText.secondary}>{x.days.join(', ')}</Text>,
        },
        {
          key: 'time',
          label: 'Waktu',
          render: (x) => (
            <Text style={masterText.status}>
              {x.startTime}–{x.endTime}
            </Text>
          ),
        },
      ]}
    />
  );
}
