import { useMemo, useState } from 'react';
import { Alert, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { FormDrawer } from '../../src/components/pivot/FormDrawer';
import { ManagementPage } from '../../src/components/pivot/ManagementPage';
import { masterText } from '../../src/components/pivot/ManagerMasterScreen';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useCollectionRunMutation, useManagerOperations } from '../../src/features/pivot/hooks';
import { extractApiErrorMessage } from '../../src/lib/api/client';
export default function Screen() {
  const router = useRouter();
  const query = useManagerOperations();
  const mutation = useCollectionRunMutation();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [scheduledFor, setScheduledFor] = useState('');
  const items = useMemo(
    () =>
      (query.data?.runs ?? []).filter((x: any) =>
        `${x.route.name} ${x.status}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [query.data?.runs, search],
  );
  function open(item: any) {
    setSelected(item);
    setScheduledFor(new Date(item.scheduledFor).toISOString().slice(0, 16));
  }
  async function save() {
    try {
      await mutation.mutateAsync({
        id: selected.id,
        data: { scheduledFor: new Date(scheduledFor).toISOString() },
      });
      setSelected(null);
    } catch (error) {
      Alert.alert('Belum dijadwalkan ulang', extractApiErrorMessage(error));
    }
  }
  return (
    <>
      <ManagementPage
        title="Tugas Pengumpulan"
        subtitle="Jadwalkan ulang atau batalkan tugas selama masih berstatus PLANNED."
        secondaryActions={[
          { label: 'Kembali ke Rute', onPress: () => router.push('/(manager)/routes' as never) },
        ]}
        query={query}
        items={items}
        search={search}
        onSearchChange={setSearch}
        archived={false}
        onArchivedChange={() => undefined}
        showArchiveFilter={false}
        onEdit={(item) => (item.status === 'PLANNED' ? open(item) : undefined)}
        canEdit={(item: any) => item.status === 'PLANNED'}
        renderActions={(item: any) =>
          item.status === 'PLANNED' ? (
            <Button
              size="sm"
              label="Batalkan"
              variant="ghost"
              onPress={() =>
                mutation.mutate({
                  id: item.id,
                  data: { action: 'cancel', reason: 'Dibatalkan oleh Pengelola' },
                })
              }
            />
          ) : null
        }
        columns={[
          {
            key: 'route',
            label: 'Rute',
            render: (x: any) => <Text style={masterText.primary}>{x.route.name}</Text>,
          },
          {
            key: 'time',
            label: 'Jadwal',
            render: (x: any) => (
              <Text style={masterText.secondary}>
                {new Date(x.scheduledFor).toLocaleString('id-ID')}
              </Text>
            ),
          },
          {
            key: 'collector',
            label: 'Petugas',
            render: (x: any) => (
              <Text style={masterText.secondary}>
                {x.assignments.map((a: any) => a.collector.user.name).join(', ')}
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
      <FormDrawer
        visible={Boolean(selected)}
        title="Jadwalkan Ulang Tugas"
        dirty
        loading={mutation.isPending}
        onClose={() => setSelected(null)}
        onSubmit={save}
      >
        <Input label="Waktu pengambilan" value={scheduledFor} onChangeText={setScheduledFor} />
      </FormDrawer>
    </>
  );
}
