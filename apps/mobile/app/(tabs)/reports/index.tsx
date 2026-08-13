import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ManagementPage } from '../../../src/components/pivot/ManagementPage';
import { masterText } from '../../../src/components/pivot/ManagerMasterScreen';
import { ReportPhoto } from '../../../src/components/pivot/ReportPhoto';
import { api } from '../../../src/lib/api/client';
import { statusLabel } from '../../../src/lib/presentation/status';
import { colors, fonts, spacing } from '../../../src/theme';

export default function Screen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const query = useQuery({
    queryKey: ['pivot', 'reports'],
    queryFn: async () => (await api.get('/api/v1/pivot/reports')).data,
  });
  const items = useMemo(
    () =>
      (query.data ?? []).filter((item: any) =>
        `${item.description} ${item.address} ${item.status}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [query.data, search],
  );
  return (
    <ManagementPage
      title="Laporan Lingkungan"
      subtitle="Laporkan tumpukan sampah liar dan pantau tindak lanjut Pengelola."
      primaryAction={{ label: 'Buat Laporan', onPress: () => router.push('/(tabs)/reports/new') }}
      query={query}
      items={items}
      search={search}
      onSearchChange={setSearch}
      archived={false}
      onArchivedChange={() => undefined}
      showArchiveFilter={false}
      compactBare
      onOpen={(item: any) => router.push(`/(tabs)/reports/${item.id}`)}
      renderCompactItem={(item: any) => (
        <View style={styles.reportCard}>
          <ReportPhoto uri={item.photoKey} />
          <Text style={styles.reportTitle} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      )}
      columns={[
        {
          key: 'photo',
          label: 'Foto',
          width: 90,
          render: (item: any) => <ReportPhoto compact uri={item.photoKey} />,
        },
        {
          key: 'report',
          label: 'Laporan',
          render: (item: any) => <Text style={masterText.primary}>{item.description}</Text>,
        },
        {
          key: 'address',
          label: 'Lokasi',
          render: (item: any) => <Text style={masterText.secondary}>{item.address}</Text>,
        },
        {
          key: 'created',
          label: 'Dibuat',
          render: (item: any) => (
            <Text style={masterText.secondary}>
              {new Date(item.createdAt).toLocaleDateString('id-ID')}
            </Text>
          ),
        },
        {
          key: 'status',
          label: 'Status',
          render: (item: any) => <Text style={masterText.status}>{statusLabel(item.status)}</Text>,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  reportCard: {
    width: '100%',
  },
  reportTitle: {
    paddingTop: spacing.xs,
    fontSize: 16,
    lineHeight: 23,
    fontFamily: fonts.bold,
    color: colors.neutral900,
  },
});
