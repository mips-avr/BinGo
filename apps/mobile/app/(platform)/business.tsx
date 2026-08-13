import { useMemo, useState } from 'react';
import { Text } from 'react-native';
import { ManagementPage } from '../../src/components/pivot/ManagementPage';
import { masterText } from '../../src/components/pivot/ManagerMasterScreen';
import { usePlatformOrganizations } from '../../src/features/pivot/hooks';

export default function BusinessScreen() {
  const query = usePlatformOrganizations();
  const [search, setSearch] = useState('');
  const items = useMemo(
    () =>
      (query.data ?? []).filter(
        (item: any) =>
          item.type === 'BUSINESS' &&
          `${item.name} ${item.status}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [query.data, search],
  );
  return (
    <ManagementPage
      title="Business"
      subtitle="Pantau status verifikasi dan kesehatan organisasi pengolah."
      query={query}
      items={items}
      search={search}
      onSearchChange={setSearch}
      archived={false}
      onArchivedChange={() => undefined}
      showArchiveFilter={false}
      columns={[
        {
          key: 'name',
          label: 'Business',
          render: (item: any) => <Text style={masterText.primary}>{item.name}</Text>,
        },
        {
          key: 'status',
          label: 'Status',
          render: (item: any) => (
            <Text style={masterText.status}>{item.status.replaceAll('_', ' ')}</Text>
          ),
        },
        {
          key: 'members',
          label: 'Pengguna',
          render: (item: any) => (
            <Text style={masterText.secondary}>{item._count.members} pengguna</Text>
          ),
        },
        {
          key: 'facilities',
          label: 'Fasilitas',
          render: (item: any) => (
            <Text style={masterText.secondary}>{item._count.facilities} fasilitas</Text>
          ),
        },
      ]}
    />
  );
}
