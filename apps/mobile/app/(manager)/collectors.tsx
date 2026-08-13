import { useMemo, useState } from 'react';
import { Alert, Text } from 'react-native';
import { FormDrawer } from '../../src/components/pivot/FormDrawer';
import { ManagementPage } from '../../src/components/pivot/ManagementPage';
import { masterText } from '../../src/components/pivot/ManagerMasterScreen';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import {
  useDeactivateCollectorCard,
  useIssueCollectorCard,
  useManagerResource,
  useManagerResourceMutation,
} from '../../src/features/pivot/hooks';
import { extractApiErrorMessage } from '../../src/lib/api/client';

const empty = { name: '', phone: '', employeeNo: '', initialPassword: '' };
export default function CollectorsScreen() {
  const [search, setSearch] = useState('');
  const [archived, setArchived] = useState(false);
  const query = useManagerResource(
    'collectors',
    useMemo(() => ({ search, archived, page: 1, pageSize: 50 }), [archived, search]),
  );
  const mutation = useManagerResourceMutation('collectors');
  const issue = useIssueCollectorCard();
  const deactivate = useDeactivateCollectorCard();
  const [mode, setMode] = useState<'collector' | 'cards' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState(empty);
  const [cardNumber, setCardNumber] = useState('');
  const [uidCredential, setUidCredential] = useState('');
  function openCollector(item?: any) {
    setSelected(item ?? null);
    setForm(
      item
        ? {
            name: item.user.name,
            phone: item.user.phone,
            employeeNo: item.employeeNo,
            initialPassword: '',
          }
        : empty,
    );
    setMode('collector');
  }
  async function saveCollector() {
    try {
      await mutation.mutateAsync({
        action: selected ? 'update' : 'create',
        id: selected?.id,
        data: form,
      });
      setMode(null);
    } catch (error) {
      Alert.alert('Belum tersimpan', extractApiErrorMessage(error));
    }
  }
  async function saveCard() {
    try {
      await issue.mutateAsync({
        collectorId: selected.id,
        cardNumber,
        uidCredential: uidCredential || undefined,
      });
      setCardNumber('');
      setUidCredential('');
    } catch (error) {
      Alert.alert('Kartu belum terbit', extractApiErrorMessage(error));
    }
  }
  return (
    <>
      <ManagementPage
        title="Petugas dan Kartu"
        subtitle="Kelola akun Petugas dari daftar. Buka satu Petugas untuk menerbitkan, menonaktifkan, atau mengganti kartu."
        primaryAction={{ label: 'Tambah Petugas', onPress: () => openCollector() }}
        query={query}
        items={query.data?.items ?? []}
        search={search}
        onSearchChange={setSearch}
        archived={archived}
        onArchivedChange={setArchived}
        onEdit={openCollector}
        onOpen={(item) => {
          setSelected(item);
          setMode('cards');
        }}
        onArchive={(item) =>
          mutation.mutate({ action: 'archive', id: item.id, reason: 'Petugas tidak lagi aktif' })
        }
        onRestore={(item) => mutation.mutate({ action: 'restore', id: item.id })}
        columns={[
          {
            key: 'name',
            label: 'Petugas',
            render: (item: any) => <Text style={masterText.primary}>{item.user.name}</Text>,
          },
          {
            key: 'employeeNo',
            label: 'Nomor',
            render: (item: any) => <Text style={masterText.secondary}>{item.employeeNo}</Text>,
          },
          {
            key: 'phone',
            label: 'Telepon',
            render: (item: any) => <Text style={masterText.secondary}>{item.user.phone}</Text>,
          },
          {
            key: 'cards',
            label: 'Kartu Aktif',
            render: (item: any) => (
              <Text style={masterText.status}>
                {item.cards.filter((card: any) => card.active).length}
              </Text>
            ),
          },
        ]}
      />
      <FormDrawer
        visible={mode === 'collector'}
        title={selected ? 'Edit Petugas' : 'Tambah Petugas'}
        dirty
        loading={mutation.isPending}
        onClose={() => setMode(null)}
        onSubmit={saveCollector}
      >
        {Object.entries({
          name: 'Nama lengkap',
          phone: 'Nomor telepon',
          employeeNo: 'Nomor Petugas',
          initialPassword: 'Kata sandi awal',
        }).map(([key, label]) => (
          <Input
            key={key}
            label={label}
            value={form[key as keyof typeof form]}
            editable={!selected || key !== 'initialPassword'}
            onChangeText={(value) => setForm((current) => ({ ...current, [key]: value }))}
          />
        ))}
      </FormDrawer>
      <FormDrawer
        visible={mode === 'cards'}
        title={`Kartu ${selected?.user?.name ?? 'Petugas'}`}
        description="Kartu yang dinonaktifkan tetap berada pada riwayat. Terbitkan kartu baru untuk penggantian."
        loading={issue.isPending || deactivate.isPending}
        submitLabel="Terbitkan Kartu"
        onClose={() => setMode(null)}
        onSubmit={saveCard}
      >
        {selected?.cards?.map((card: any) => (
          <Button
            key={card.id}
            label={`${card.cardNumber} · ${card.active ? 'Aktif' : 'Nonaktif'}`}
            variant="secondary"
            disabled={!card.active}
            onPress={() =>
              deactivate.mutate({
                collectorId: selected.id,
                cardId: card.id,
                reason: 'Diganti melalui dashboard Pengelola',
              })
            }
          />
        ))}
        <Input label="Nomor kartu tercetak" value={cardNumber} onChangeText={setCardNumber} />
        <Input label="UID kartu (opsional)" value={uidCredential} onChangeText={setUidCredential} />
      </FormDrawer>
    </>
  );
}
