import { useMemo, useState } from 'react';
import { Alert, Text } from 'react-native';
import { FormDrawer } from '../../src/components/pivot/FormDrawer';
import { ManagementPage } from '../../src/components/pivot/ManagementPage';
import { masterText } from '../../src/components/pivot/ManagerMasterScreen';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useInvoiceMutation, useManagerOperations } from '../../src/features/pivot/hooks';
import { extractApiErrorMessage } from '../../src/lib/api/client';

export default function BillingScreen() {
  const query = useManagerOperations();
  const mutation = useInvoiceMutation();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [drawer, setDrawer] = useState(false);
  const [form, setForm] = useState({
    subscriptionId: '',
    period: new Date().toISOString().slice(0, 7),
    amount: '30000',
    dueAt: new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10),
  });
  const items = useMemo(
    () =>
      (query.data?.invoices ?? []).filter((x: any) =>
        `${x.household.accountNo} ${x.period} ${x.status}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [query.data?.invoices, search],
  );
  function open(item?: any) {
    setSelected(item ?? null);
    setForm(
      item
        ? {
            subscriptionId: item.subscriptionId,
            period: item.period,
            amount: String(item.amount),
            dueAt: new Date(item.dueAt).toISOString().slice(0, 10),
          }
        : {
            subscriptionId: query.data?.subscriptions?.[0]?.id ?? '',
            period: new Date().toISOString().slice(0, 7),
            amount: '30000',
            dueAt: new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10),
          },
    );
    setDrawer(true);
  }
  async function save() {
    try {
      await mutation.mutateAsync({
        id: selected?.id,
        data: {
          subscriptionId: form.subscriptionId,
          period: form.period,
          amount: Number(form.amount),
          dueAt: new Date(form.dueAt).toISOString(),
        },
      });
      setDrawer(false);
    } catch (error) {
      Alert.alert('Belum tersimpan', extractApiErrorMessage(error));
    }
  }
  return (
    <>
      <ManagementPage
        title="Tagihan"
        subtitle="Buat invoice dari langganan aktif. Hanya invoice belum dibayar yang dapat diedit atau dibatalkan."
        primaryAction={{ label: 'Buat Invoice', onPress: () => open() }}
        query={query}
        items={items}
        search={search}
        onSearchChange={setSearch}
        archived={false}
        onArchivedChange={() => undefined}
        showArchiveFilter={false}
        onEdit={(item) => (item.status === 'UNPAID' ? open(item) : undefined)}
        canEdit={(item: any) => item.status === 'UNPAID'}
        renderActions={(item: any) =>
          item.status === 'UNPAID' ? (
            <Button
              size="sm"
              label="Void"
              variant="ghost"
              onPress={() =>
                mutation.mutate({
                  id: item.id,
                  data: { action: 'void', reason: 'Dibatalkan oleh Pengelola' },
                })
              }
            />
          ) : null
        }
        columns={[
          {
            key: 'account',
            label: 'Pelanggan',
            render: (x: any) => <Text style={masterText.primary}>{x.household.accountNo}</Text>,
          },
          {
            key: 'period',
            label: 'Periode',
            render: (x: any) => <Text style={masterText.secondary}>{x.period}</Text>,
          },
          {
            key: 'amount',
            label: 'Jumlah',
            render: (x: any) => (
              <Text style={masterText.secondary}>Rp{Number(x.amount).toLocaleString('id-ID')}</Text>
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
        visible={drawer}
        title={selected ? 'Edit Invoice' : 'Buat Invoice'}
        dirty
        loading={mutation.isPending}
        onClose={() => setDrawer(false)}
        onSubmit={save}
      >
        <Input
          label="ID langganan"
          value={form.subscriptionId}
          editable={!selected}
          onChangeText={(value) => setForm((x) => ({ ...x, subscriptionId: value }))}
        />
        <Input
          label="Periode"
          value={form.period}
          editable={!selected}
          onChangeText={(value) => setForm((x) => ({ ...x, period: value }))}
        />
        <Input
          label="Jumlah"
          value={form.amount}
          keyboardType="number-pad"
          onChangeText={(value) => setForm((x) => ({ ...x, amount: value }))}
        />
        <Input
          label="Jatuh tempo"
          value={form.dueAt}
          onChangeText={(value) => setForm((x) => ({ ...x, dueAt: value }))}
        />
      </FormDrawer>
    </>
  );
}
