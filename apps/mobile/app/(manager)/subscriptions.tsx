import { useMemo, useState } from 'react';
import { Alert, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { FormDrawer } from '../../src/components/pivot/FormDrawer';
import { ManagementPage } from '../../src/components/pivot/ManagementPage';
import { masterText } from '../../src/components/pivot/ManagerMasterScreen';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useManagerOperations, useSubscriptionMutation } from '../../src/features/pivot/hooks';
import { extractApiErrorMessage } from '../../src/lib/api/client';
export default function Screen() {
  const router = useRouter();
  const query = useManagerOperations();
  const mutation = useSubscriptionMutation();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [drawer, setDrawer] = useState(false);
  const [form, setForm] = useState({ householdId: '', servicePlanId: '', startsAt: '' });
  const items = useMemo(
    () =>
      (query.data?.subscriptions ?? []).filter((x: any) =>
        `${x.household.accountNo} ${x.servicePlan.name}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [query.data?.subscriptions, search],
  );
  function open(item?: any) {
    setSelected(item ?? null);
    setForm(
      item
        ? { householdId: item.householdId, servicePlanId: item.servicePlanId, startsAt: '' }
        : { householdId: '', servicePlanId: query.data?.plans?.[0]?.id ?? '', startsAt: '' },
    );
    setDrawer(true);
  }
  async function save() {
    try {
      await mutation.mutateAsync({
        id: selected?.id,
        data: selected
          ? { servicePlanId: form.servicePlanId }
          : { ...form, startsAt: form.startsAt || undefined },
      });
      setDrawer(false);
    } catch (error) {
      Alert.alert('Belum tersimpan', extractApiErrorMessage(error));
    }
  }
  return (
    <>
      <ManagementPage
        title="Langganan"
        subtitle="Hubungkan rumah tangga dengan paket layanan, ganti paket, atau hentikan layanan."
        primaryAction={{ label: 'Tambah Langganan', onPress: () => open() }}
        secondaryActions={[
          {
            label: 'Kembali ke Wilayah',
            onPress: () => router.push('/(manager)/customers' as never),
          },
        ]}
        query={query}
        items={items}
        search={search}
        onSearchChange={setSearch}
        archived={false}
        onArchivedChange={() => undefined}
        showArchiveFilter={false}
        onEdit={open}
        renderActions={(item: any) =>
          item.active ? (
            <Button
              size="sm"
              label="Hentikan"
              variant="ghost"
              onPress={() =>
                mutation.mutate({
                  id: item.id,
                  data: { action: 'stop', reason: 'Dihentikan oleh Pengelola' },
                })
              }
            />
          ) : null
        }
        columns={[
          {
            key: 'household',
            label: 'Pelanggan',
            render: (x: any) => <Text style={masterText.primary}>{x.household.accountNo}</Text>,
          },
          {
            key: 'plan',
            label: 'Paket',
            render: (x: any) => <Text style={masterText.secondary}>{x.servicePlan.name}</Text>,
          },
          {
            key: 'start',
            label: 'Mulai',
            render: (x: any) => (
              <Text style={masterText.secondary}>
                {new Date(x.startsAt).toLocaleDateString('id-ID')}
              </Text>
            ),
          },
          {
            key: 'status',
            label: 'Status',
            render: (x: any) => (
              <Text style={masterText.status}>{x.active ? 'AKTIF' : 'BERHENTI'}</Text>
            ),
          },
        ]}
      />
      <FormDrawer
        visible={drawer}
        title={selected ? 'Ganti Paket' : 'Tambah Langganan'}
        dirty
        loading={mutation.isPending}
        onClose={() => setDrawer(false)}
        onSubmit={save}
      >
        <Input
          label="ID rumah tangga"
          value={form.householdId}
          editable={!selected}
          onChangeText={(value) => setForm((x) => ({ ...x, householdId: value }))}
        />
        <Input
          label="ID paket layanan"
          value={form.servicePlanId}
          onChangeText={(value) => setForm((x) => ({ ...x, servicePlanId: value }))}
        />
        {!selected ? (
          <Input
            label="Tanggal mulai (opsional)"
            value={form.startsAt}
            onChangeText={(value) => setForm((x) => ({ ...x, startsAt: value }))}
          />
        ) : null}
      </FormDrawer>
    </>
  );
}
