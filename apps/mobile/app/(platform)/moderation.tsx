import { useMemo, useState } from 'react';
import { Text } from 'react-native';
import { ManagementPage } from '../../src/components/pivot/ManagementPage';
import { masterText } from '../../src/components/pivot/ManagerMasterScreen';
import { Button } from '../../src/components/ui/Button';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { useModeratePublication, usePlatformModeration } from '../../src/features/pivot/hooks';

type ModerationItem = {
  id: string;
  resourceType: 'requirement' | 'lot';
  title: string;
  organizationName: string;
  quantityKg: number;
  status: string;
};

export default function ModerationScreen() {
  const query = usePlatformModeration();
  const mutation = useModeratePublication();
  const [search, setSearch] = useState('');
  const [pendingHide, setPendingHide] = useState<ModerationItem | null>(null);
  const items = useMemo(() => {
    const requirements = (query.data?.requirements ?? []).map((item: any) => ({
      id: item.id,
      resourceType: 'requirement' as const,
      title: item.title,
      organizationName: item.organization.name,
      quantityKg: Number(item.quantityKg),
      status: item.status,
    }));
    const lots = (query.data?.lots ?? []).map((item: any) => ({
      id: item.id,
      resourceType: 'lot' as const,
      title: item.code,
      organizationName: item.organization.name,
      quantityKg: Number(item.availableKg),
      status: item.status,
    }));
    return [...requirements, ...lots].filter((item) =>
      `${item.title} ${item.organizationName} ${item.resourceType} ${item.status}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  }, [query.data, search]);

  return (
    <>
      <ManagementPage
        title="Moderasi"
        subtitle="Tinjau publikasi kebutuhan dan lot dari seluruh organisasi."
        query={query}
        items={items}
        search={search}
        onSearchChange={setSearch}
        archived={false}
        onArchivedChange={() => undefined}
        showArchiveFilter={false}
        renderActions={(item) => (
          <Button
            size="sm"
            variant="secondary"
            label={item.status === 'HIDDEN' ? 'Pulihkan' : 'Sembunyikan'}
            loading={mutation.isPending}
            onPress={() => {
              if (item.status === 'HIDDEN') {
                mutation.mutate({
                  resourceType: item.resourceType,
                  id: item.id,
                  action: 'restore',
                });
                return;
              }
              setPendingHide(item);
            }}
          />
        )}
        columns={[
          {
            key: 'publication',
            label: 'Publikasi',
            render: (item) => <Text style={masterText.primary}>{item.title}</Text>,
          },
          {
            key: 'type',
            label: 'Jenis',
            render: (item) => (
              <Text style={masterText.secondary}>
                {item.resourceType === 'lot' ? 'Lot material' : 'Kebutuhan material'}
              </Text>
            ),
          },
          {
            key: 'organization',
            label: 'Organisasi',
            render: (item) => <Text style={masterText.secondary}>{item.organizationName}</Text>,
          },
          {
            key: 'status',
            label: 'Jumlah dan status',
            render: (item) => (
              <Text style={masterText.status}>
                {item.quantityKg} kg · {item.status}
              </Text>
            ),
          },
        ]}
      />
      <ConfirmDialog
        visible={Boolean(pendingHide)}
        title={`Sembunyikan ${pendingHide?.title ?? 'publikasi'}?`}
        message="Publikasi tidak tampil sampai dipulihkan. Alasan tindakan tercatat pada audit."
        confirmLabel="Sembunyikan"
        destructive
        loading={mutation.isPending}
        onCancel={() => setPendingHide(null)}
        onConfirm={() => {
          if (!pendingHide) return;
          mutation.mutate(
            {
              resourceType: pendingHide.resourceType,
              id: pendingHide.id,
              action: 'hide',
              reason: 'Ditinjau melalui moderasi Admin BinGo',
            },
            { onSuccess: () => setPendingHide(null) },
          );
        }}
      />
    </>
  );
}
