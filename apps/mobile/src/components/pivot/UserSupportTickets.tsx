import { useState } from 'react';
import { Alert, Text } from 'react-native';
import { extractApiErrorMessage } from '../../lib/api/client';
import { useSupportTicketMutation, useSupportTickets } from '../../features/pivot/hooks';
import { Input } from '../ui/Input';
import { FormDrawer } from './FormDrawer';
import { ManagementPage } from './ManagementPage';
import { masterText } from './ManagerMasterScreen';

export function UserSupportTickets() {
  const query = useSupportTickets(false);
  const mutation = useSupportTicketMutation();
  const [search, setSearch] = useState('');
  const [drawer, setDrawer] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  async function submit() {
    try {
      await mutation.mutateAsync({ data: { subject, description } });
      setDrawer(false);
      setSubject('');
      setDescription('');
      Alert.alert(
        'Tiket dibuat',
        'Tim BinGo dapat menindaklanjuti tiket ini dari dashboard Admin.',
      );
    } catch (error) {
      Alert.alert('Tiket belum dibuat', extractApiErrorMessage(error));
    }
  }

  return (
    <>
      <ManagementPage
        title="Bantuan"
        subtitle="Kirim kendala layanan atau permintaan pemulihan akun dan pantau jawabannya."
        primaryAction={{ label: 'Buat Tiket', onPress: () => setDrawer(true) }}
        query={query}
        items={(query.data ?? []).filter((item: any) =>
          `${item.subject} ${item.status}`.toLowerCase().includes(search.toLowerCase()),
        )}
        search={search}
        onSearchChange={setSearch}
        archived={false}
        onArchivedChange={() => undefined}
        showArchiveFilter={false}
        columns={[
          {
            key: 'subject',
            label: 'Subjek',
            render: (item: any) => <Text style={masterText.primary}>{item.subject}</Text>,
          },
          {
            key: 'status',
            label: 'Status',
            render: (item: any) => (
              <Text style={masterText.status}>{item.status.replaceAll('_', ' ')}</Text>
            ),
          },
          {
            key: 'reply',
            label: 'Balasan terakhir',
            render: (item: any) => (
              <Text style={masterText.secondary} numberOfLines={2}>
                {item.messages?.at(-1)?.message ?? item.description}
              </Text>
            ),
          },
        ]}
      />
      <FormDrawer
        visible={drawer}
        title="Buat Tiket Bantuan"
        description="Jelaskan satu kendala secara spesifik agar dapat ditangani dengan cepat."
        dirty={Boolean(subject || description)}
        loading={mutation.isPending}
        onClose={() => setDrawer(false)}
        onSubmit={submit}
      >
        <Input label="Subjek" value={subject} onChangeText={setSubject} />
        <Input
          label="Deskripsi"
          value={description}
          multiline
          numberOfLines={6}
          onChangeText={setDescription}
        />
      </FormDrawer>
    </>
  );
}
