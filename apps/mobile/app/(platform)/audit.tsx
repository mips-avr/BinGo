import { useMemo, useState } from 'react';
import { Text } from 'react-native';
import { ManagementPage } from '../../src/components/pivot/ManagementPage';
import { masterText } from '../../src/components/pivot/ManagerMasterScreen';
import { usePlatformAudit } from '../../src/features/pivot/hooks';

export default function Screen() {
  const query = usePlatformAudit();
  const [search, setSearch] = useState('');
  const items = useMemo(
    () =>
      (query.data ?? []).filter((item: any) =>
        `${item.action} ${item.resourceType} ${item.organization?.name ?? ''} ${item.actor?.name ?? ''} ${item.reason ?? ''}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [query.data, search],
  );
  return (
    <ManagementPage
      title="Audit Platform"
      subtitle="Telusuri keputusan administratif dan aktivitas platform berdasarkan waktu serta pelakunya."
      query={query}
      items={items}
      search={search}
      onSearchChange={setSearch}
      archived={false}
      onArchivedChange={() => undefined}
      showArchiveFilter={false}
      columns={[
        {
          key: 'action',
          label: 'Aktivitas',
          render: (item: any) => (
            <Text style={masterText.primary}>{item.action.replaceAll('_', ' ')}</Text>
          ),
        },
        {
          key: 'resource',
          label: 'Resource',
          render: (item: any) => <Text style={masterText.secondary}>{item.resourceType}</Text>,
        },
        {
          key: 'organization',
          label: 'Organisasi',
          render: (item: any) => (
            <Text style={masterText.secondary}>{item.organization?.name ?? 'Platform'}</Text>
          ),
        },
        {
          key: 'actor',
          label: 'Pelaku',
          render: (item: any) => (
            <Text style={masterText.secondary}>{item.actor?.name ?? 'Sistem'}</Text>
          ),
        },
        {
          key: 'time',
          label: 'Waktu',
          render: (item: any) => (
            <Text style={masterText.secondary}>
              {new Date(item.createdAt).toLocaleString('id-ID')}
            </Text>
          ),
        },
        {
          key: 'reason',
          label: 'Alasan',
          render: (item: any) => <Text style={masterText.secondary}>{item.reason ?? '—'}</Text>,
        },
      ]}
    />
  );
}
