import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '../../src/components/ui/Button';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { DataCard, DataListView } from '../../src/components/pivot/DataListView';
import { useOrganizationStatus, usePlatformOrganizations } from '../../src/features/pivot/hooks';

export default function OrganizationsScreen() {
  const query = usePlatformOrganizations();
  const mutation = useOrganizationStatus();
  const [pendingSuspend, setPendingSuspend] = useState<{ id: string; name: string } | null>(null);

  return (
    <>
      <DataListView
        title="Organisasi"
        subtitle="Kelola status organisasi Pengelola dan Business."
        query={query}
        renderItems={(items) => items.map((item: any) => (
          <DataCard
            key={item.id}
            title={item.name}
            detail={`${item.type} • ${item.status.replaceAll('_', ' ')}`}
            meta={`${item._count.members} anggota • ${item._count.facilities} fasilitas`}
            trailing={
              <View style={{ gap: 6 }}>
                {item.status === 'SUSPENDED' ? (
                  <Button
                    size="sm"
                    label="Aktifkan kembali"
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
                ) : (
                  <Text>{item.status}</Text>
                )}
              </View>
            }
          />
        ))}
      />
      <ConfirmDialog
        visible={Boolean(pendingSuspend)}
        title={`Suspend ${pendingSuspend?.name ?? 'organisasi'}?`}
        message="Transaksi baru akan diblokir. Riwayat organisasi tetap tersimpan."
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
              reason: 'Pemeriksaan kepatuhan platform pada mode demo',
            },
            { onSuccess: () => setPendingSuspend(null) },
          );
        }}
      />
    </>
  );
}
