import { Text } from 'react-native';
import { Button } from '../../src/components/ui/Button';
import { ManagerMasterScreen, masterText } from '../../src/components/pivot/ManagerMasterScreen';
export default function Screen() {
  return (
    <ManagerMasterScreen<any>
      resource="facilities"
      title="Fasilitas"
      subtitle="Kelola fasilitas milik organisasi. Admin BinGo tetap menjadi pihak yang memverifikasi direktori platform."
      createLabel="Tambah Fasilitas"
      initial={{
        name: '',
        operatorName: '',
        address: '',
        lat: '-6.20',
        lng: '106.90',
        sourceUrl: '',
        openingNote: '',
        materials: 'ORGANIC, PAPER',
      }}
      fields={[
        { key: 'name', label: 'Nama fasilitas' },
        { key: 'operatorName', label: 'Operator' },
        { key: 'address', label: 'Alamat' },
        { key: 'lat', label: 'Latitude', keyboardType: 'decimal-pad', parse: Number },
        { key: 'lng', label: 'Longitude', keyboardType: 'decimal-pad', parse: Number },
        { key: 'sourceUrl', label: 'Sumber data' },
        { key: 'openingNote', label: 'Catatan operasional' },
        { key: 'materials', label: 'Material diterima, pisahkan dengan koma' },
      ]}
      normalize={(data) => ({
        ...data,
        materials: String(data.materials)
          .split(',')
          .map((x) => x.trim().toUpperCase())
          .filter(Boolean),
      })}
      columns={[
        {
          key: 'name',
          label: 'Fasilitas',
          render: (x) => <Text style={masterText.primary}>{x.name}</Text>,
        },
        {
          key: 'address',
          label: 'Alamat',
          render: (x) => <Text style={masterText.secondary}>{x.address}</Text>,
        },
        {
          key: 'status',
          label: 'Status',
          render: (x) => <Text style={masterText.status}>{x.status}</Text>,
        },
        {
          key: 'verifiedAt',
          label: 'Verifikasi',
          render: (x) => (
            <Text style={masterText.secondary}>
              {new Date(x.verifiedAt).toLocaleDateString('id-ID')}
            </Text>
          ),
        },
      ]}
      renderActions={(item, mutation) => (
        <Button
          size="sm"
          variant="secondary"
          label={item.verificationRequestedAt ? 'Verifikasi diajukan' : 'Ajukan verifikasi'}
          disabled={Boolean(item.verificationRequestedAt) || mutation.isPending}
          onPress={() =>
            mutation.mutate({
              action: 'request-verification',
              id: item.id,
            })
          }
        />
      )}
    />
  );
}
