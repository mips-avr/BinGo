import { useMemo, useState } from 'react';
import { Alert, Text } from 'react-native';
import { FormDrawer } from '../../src/components/pivot/FormDrawer';
import { ManagementPage } from '../../src/components/pivot/ManagementPage';
import { masterText } from '../../src/components/pivot/ManagerMasterScreen';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useSupportTicketMutation, useSupportTickets } from '../../src/features/pivot/hooks';
import { extractApiErrorMessage } from '../../src/lib/api/client';

export default function PlatformHelpScreen() {
  const query = useSupportTickets(true);
  const mutation = useSupportTicketMutation();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [status, setStatus] = useState('IN_PROGRESS');
  const [message, setMessage] = useState('');
  const items = useMemo(
    () =>
      (query.data ?? []).filter((item: any) =>
        `${item.subject} ${item.createdBy?.name} ${item.organization?.name ?? ''}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [query.data, search],
  );
  async function save() {
    try {
      await mutation.mutateAsync({ id: selected.id, data: { status, message } });
      setSelected(null);
    } catch (error) {
      Alert.alert('Belum diperbarui', extractApiErrorMessage(error));
    }
  }
  return (
    <>
      <ManagementPage
        title="Bantuan"
        subtitle="Tinjau, balas, selesaikan, buka kembali, atau arsipkan tiket dukungan."
        query={query}
        items={items}
        search={search}
        onSearchChange={setSearch}
        archived={false}
        onArchivedChange={() => undefined}
        showArchiveFilter={false}
        onOpen={(item) => {
          setSelected(item);
          setStatus(item.status === 'OPEN' ? 'IN_PROGRESS' : item.status);
          setMessage('');
        }}
        columns={[
          {
            key: 'subject',
            label: 'Subjek',
            render: (item: any) => <Text style={masterText.primary}>{item.subject}</Text>,
          },
          {
            key: 'requester',
            label: 'Pemohon',
            render: (item: any) => <Text style={masterText.secondary}>{item.createdBy?.name}</Text>,
          },
          {
            key: 'organization',
            label: 'Organisasi',
            render: (item: any) => (
              <Text style={masterText.secondary}>{item.organization?.name ?? 'Akun personal'}</Text>
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
        title={selected?.subject ?? 'Tiket Bantuan'}
        description={selected?.description}
        dirty={Boolean(message)}
        loading={mutation.isPending}
        submitLabel="Simpan Tindakan"
        onClose={() => setSelected(null)}
        onSubmit={save}
      >
        {['IN_PROGRESS', 'RESOLVED', 'OPEN', 'ARCHIVED'].map((value) => (
          <Button
            key={value}
            size="sm"
            label={value.replaceAll('_', ' ')}
            variant={status === value ? 'primary' : 'secondary'}
            onPress={() => setStatus(value)}
          />
        ))}
        <Input
          label="Balasan atau catatan"
          value={message}
          multiline
          numberOfLines={5}
          onChangeText={setMessage}
        />
      </FormDrawer>
    </>
  );
}
