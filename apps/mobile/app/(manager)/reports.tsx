import { useMemo, useState } from 'react';
import { Alert, Text } from 'react-native';
import { FormDrawer } from '../../src/components/pivot/FormDrawer';
import { ManagementPage } from '../../src/components/pivot/ManagementPage';
import { masterText } from '../../src/components/pivot/ManagerMasterScreen';
import { ReportPhoto } from '../../src/components/pivot/ReportPhoto';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useManagerOperations, useUpdateReportStatus } from '../../src/features/pivot/hooks';
import { extractApiErrorMessage } from '../../src/lib/api/client';

const statuses = ['VERIFIED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'SUBMITTED'];

export default function ReportsScreen() {
  const query = useManagerOperations();
  const mutation = useUpdateReportStatus();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [status, setStatus] = useState('VERIFIED');
  const [note, setNote] = useState('');
  const items = useMemo(
    () =>
      (query.data?.reports ?? []).filter((item: any) =>
        `${item.description} ${item.address}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [query.data?.reports, search],
  );
  function open(item: any) {
    setSelected(item);
    setStatus(item.status === 'SUBMITTED' ? 'VERIFIED' : item.status);
    setNote(item.resolutionNote ?? '');
  }
  async function save() {
    try {
      await mutation.mutateAsync({ id: selected.id, status, note });
      setSelected(null);
      Alert.alert('Status diperbarui', 'Riwayat penanganan laporan telah dicatat.');
    } catch (error) {
      Alert.alert('Belum diperbarui', extractApiErrorMessage(error));
    }
  }
  return (
    <>
      <ManagementPage
        title="Laporan Warga"
        subtitle="Buka satu laporan untuk memverifikasi, memulai penanganan, menyelesaikan, atau menolaknya."
        query={query}
        items={items}
        search={search}
        onSearchChange={setSearch}
        archived={false}
        onArchivedChange={() => undefined}
        showArchiveFilter={false}
        onOpen={open}
        columns={[
          {
            key: 'photo',
            label: 'Foto',
            width: 90,
            render: (item: any) => <ReportPhoto compact uri={item.photoKey} />,
          },
          {
            key: 'description',
            label: 'Laporan',
            render: (item: any) => <Text style={masterText.primary}>{item.description}</Text>,
          },
          {
            key: 'address',
            label: 'Lokasi',
            render: (item: any) => <Text style={masterText.secondary}>{item.address}</Text>,
          },
          {
            key: 'created',
            label: 'Dibuat',
            render: (item: any) => (
              <Text style={masterText.secondary}>
                {new Date(item.createdAt).toLocaleDateString('id-ID')}
              </Text>
            ),
          },
          {
            key: 'status',
            label: 'Status',
            render: (item: any) => (
              <Text style={masterText.status}>{item.status.replaceAll('_', ' ')}</Text>
            ),
          },
        ]}
      />
      <FormDrawer
        visible={Boolean(selected)}
        title="Tangani Laporan"
        description={selected ? `${selected.description} · ${selected.address}` : undefined}
        dirty={Boolean(note)}
        loading={mutation.isPending}
        submitLabel="Simpan Status"
        onClose={() => setSelected(null)}
        onSubmit={save}
      >
        <ReportPhoto uri={selected?.photoKey} />
        <Text style={masterText.secondary}>Pilih tahap penanganan</Text>
        {statuses.map((value) => (
          <Button
            key={value}
            size="sm"
            label={value.replaceAll('_', ' ')}
            variant={status === value ? 'primary' : 'secondary'}
            onPress={() => setStatus(value)}
          />
        ))}
        <Input
          label="Catatan tindakan"
          value={note}
          multiline
          numberOfLines={5}
          onChangeText={setNote}
        />
      </FormDrawer>
    </>
  );
}
