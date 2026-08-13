import { useMemo, useState } from 'react';
import { Text } from 'react-native';
import { ManagementPage } from '../../src/components/pivot/ManagementPage';
import { masterText } from '../../src/components/pivot/ManagerMasterScreen';
import { Button } from '../../src/components/ui/Button';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { useOrganizationStatus, usePlatformOrganizations } from '../../src/features/pivot/hooks';

export default function OrganizationsScreen() {
  const query = usePlatformOrganizations();
  const mutation = useOrganizationStatus();
  const [search, setSearch] = useState('');
  const [pendingSuspend, setPendingSuspend] = useState<{ id: string; name: string } | null>(null);
  const items = useMemo(
    () =>
      (query.data ?? []).filter((item: any) =>
        `${item.name} ${item.type} ${item.status}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [query.data, search],
  );

  return (
    <>
      <ManagementPage
        title="Organisasi"
        subtitle="Pantau dan kelola status organisasi Pengelola serta Business."
        query={query}
        items={items}
        search={search}
        onSearchChange={setSearch}
        archived={false}
        onArchivedChange={() => undefined}
        showArchiveFilter={false}
        renderActions={(item: any) =>
          item.status === 'SUSPENDED' ? (
            <Button
              size="sm"
              label="Aktifkan"
              loading={mutation.isPending}
              onPress={() => mutation.mutate({ id: item.id, action: 'reactivate' })}
            />
          ) : item.status === 'ACTIVE' ? (
            <Button
              size="sm"
              variant="secondary"
              label="Suspend"
              onPress={() => setPendingSuspend({ id: item.id, name: item.name })}
            />
          ) : null
        }
        columns={[
          {
            key: 'name',
            label: 'Organisasi',
            render: (item: any) => <Text style={masterText.primary}>{item.name}</Text>,
          },
          {
            key: 'type',
            label: 'Jenis',
            render: (item: any) => <Text style={masterText.secondary}>{item.type}</Text>,
          },
          {
            key: 'status',
            label: 'Status',
            render: (item: any) => (
              <Text style={masterText.status}>{item.status.replaceAll('_', ' ')}</Text>
            ),
          },
          {
            key: 'activity',
            label: 'Cakupan',
            render: (item: any) => (
              <Text style={masterText.secondary}>
                {item._count.members} anggota · {item._count.facilities} fasilitas
              </Text>
            ),
          },
        ]}
      />
      <ConfirmDialog
        visible={Boolean(pendingSuspend)}
        title={`Suspend ${pendingSuspend?.name ?? 'organisasi'}?`}
        message="Transaksi baru diblokir, sedangkan seluruh riwayat tetap dipertahankan."
        confirmLabel="Suspend"
        destructive
        loading={mutation.isPending}
        onCancel={() => setPendingSuspend(null)}
        onConfirm={() => {
          if (!pendingSuspend) return;
          mutation.mutate(
            {
              id: pendingSuspend.id,
              action: 'suspend',
              reason: 'Pemeriksaan kepatuhan platform',
            },
            { onSuccess: () => setPendingSuspend(null) },
          );
        }}
      />
    </>
  );
}
