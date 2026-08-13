import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Text } from 'react-native';
import { FormDrawer } from '../../src/components/pivot/FormDrawer';
import { ManagementPage } from '../../src/components/pivot/ManagementPage';
import { masterText } from '../../src/components/pivot/ManagerMasterScreen';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import {
  useCreateCollectionRun,
  useManagerOperations,
  useManagerResource,
  useManagerResourceMutation,
} from '../../src/features/pivot/hooks';
import { extractApiErrorMessage } from '../../src/lib/api/client';

const empty = { name: '', serviceAreaId: '', stops: '' };

export default function RoutesScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [archived, setArchived] = useState(false);
  const routes = useManagerResource(
    'routes',
    useMemo(() => ({ search, archived, page: 1, pageSize: 50 }), [archived, search]),
  );
  const operations = useManagerOperations();
  const mutation = useManagerResourceMutation('routes');
  const schedule = useCreateCollectionRun();
  const [drawer, setDrawer] = useState<'route' | 'schedule' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState(empty);
  const [collectorId, setCollectorId] = useState('');
  const [scheduledFor, setScheduledFor] = useState(
    new Date(Date.now() + 86_400_000).toISOString().slice(0, 16),
  );
  const [dirty, setDirty] = useState(false);

  function openRoute(item?: any) {
    setSelected(item ?? null);
    setForm(
      item
        ? {
            name: item.name,
            serviceAreaId: item.serviceAreaId,
            stops: item.stops?.map((stop: any) => stop.address).join('\n') ?? '',
          }
        : { ...empty, serviceAreaId: operations.data?.areas?.[0]?.id ?? '' },
    );
    setDirty(false);
    setDrawer('route');
  }
  function openSchedule(item: any) {
    setSelected(item);
    setCollectorId(operations.data?.collectors?.[0]?.id ?? '');
    setDirty(false);
    setDrawer('schedule');
  }
  async function submit() {
    try {
      if (drawer === 'route') {
        await mutation.mutateAsync({
          action: selected ? 'update' : 'create',
          id: selected?.id,
          data: {
            ...form,
            stops: form.stops
              .split('\n')
              .map((value) => value.trim())
              .filter(Boolean),
          },
        });
      } else if (selected) {
        await schedule.mutateAsync({
          routeId: selected.id,
          collectorId,
          vehicleId: operations.data?.vehicles?.[0]?.id,
          scheduledFor: new Date(scheduledFor).toISOString(),
        });
      }
      setDrawer(null);
      Alert.alert(
        'Tersimpan',
        drawer === 'route' ? 'Rute berhasil disimpan.' : 'Tugas tersedia pada aplikasi Petugas.',
      );
    } catch (error) {
      Alert.alert('Belum tersimpan', extractApiErrorMessage(error));
    }
  }

  return (
    <>
      <ManagementPage
        title="Kalender dan Rute"
        subtitle="Kelola rute terlebih dahulu, lalu jadwalkan tugas dari rute yang dipilih."
        primaryAction={{ label: 'Buat Rute', onPress: () => openRoute() }}
        secondaryActions={[
          { label: 'Tugas', onPress: () => router.push('/(manager)/runs' as never) },
          { label: 'Kalender', onPress: () => router.push('/(manager)/calendars' as never) },
          { label: 'Kendaraan', onPress: () => router.push('/(manager)/vehicles' as never) },
        ]}
        query={routes}
        items={routes.data?.items ?? []}
        search={search}
        onSearchChange={setSearch}
        archived={archived}
        onArchivedChange={setArchived}
        onEdit={openRoute}
        canEdit={(item: any) => !item._count?.runs}
        onOpen={openSchedule}
        onArchive={(item) =>
          mutation.mutate({ action: 'archive', id: item.id, reason: 'Rute tidak lagi digunakan' })
        }
        onRestore={(item) => mutation.mutate({ action: 'restore', id: item.id })}
        renderActions={
          !archived
            ? (item: any) =>
                item._count?.runs ? (
                  <Button
                    size="sm"
                    label="Buat Revisi"
                    variant="ghost"
                    onPress={() =>
                      mutation.mutate({
                        action: 'duplicate',
                        id: item.id,
                        reason: 'Revisi rute bersejarah',
                      })
                    }
                  />
                ) : null
            : undefined
        }
        columns={[
          {
            key: 'name',
            label: 'Rute',
            render: (item: any) => <Text style={masterText.primary}>{item.name}</Text>,
          },
          {
            key: 'area',
            label: 'Wilayah',
            render: (item: any) => (
              <Text style={masterText.secondary}>{item.serviceArea?.name}</Text>
            ),
          },
          {
            key: 'stops',
            label: 'Titik',
            render: (item: any) => (
              <Text style={masterText.secondary}>{item.stops?.length ?? 0} titik</Text>
            ),
          },
          {
            key: 'runs',
            label: 'Riwayat tugas',
            render: (item: any) => <Text style={masterText.status}>{item._count?.runs ?? 0}</Text>,
          },
        ]}
      />
      <FormDrawer
        visible={drawer === 'route'}
        title={selected ? 'Edit Rute' : 'Buat Rute'}
        description={
          selected?._count?.runs
            ? 'Rute yang sudah memiliki riwayat tidak dapat diubah. Buat rute baru untuk revisi.'
            : 'Satu alamat per baris akan menjadi satu titik pengambilan.'
        }
        dirty={dirty}
        loading={mutation.isPending}
        onClose={() => setDrawer(null)}
        onSubmit={submit}
      >
        <Input
          label="Nama rute"
          value={form.name}
          onChangeText={(value) => {
            setDirty(true);
            setForm((current) => ({ ...current, name: value }));
          }}
        />
        <Input
          label="ID wilayah layanan"
          value={form.serviceAreaId}
          onChangeText={(value) => {
            setDirty(true);
            setForm((current) => ({ ...current, serviceAreaId: value }));
          }}
        />
        <Input
          label="Alamat titik, satu per baris"
          value={form.stops}
          multiline
          numberOfLines={6}
          onChangeText={(value) => {
            setDirty(true);
            setForm((current) => ({ ...current, stops: value }));
          }}
        />
      </FormDrawer>
      <FormDrawer
        visible={drawer === 'schedule'}
        title={`Jadwalkan ${selected?.name ?? 'Rute'}`}
        description="Pilih Petugas dan waktu keberangkatan. Tugas akan langsung muncul pada APK Petugas."
        dirty={dirty}
        loading={schedule.isPending}
        submitLabel="Terbitkan Tugas"
        onClose={() => setDrawer(null)}
        onSubmit={submit}
      >
        <Text style={masterText.secondary}>Petugas</Text>
        {operations.data?.collectors?.map((collector: any) => (
          <Button
            key={collector.id}
            size="sm"
            label={collector.user.name}
            variant={collectorId === collector.id ? 'primary' : 'secondary'}
            onPress={() => {
              setDirty(true);
              setCollectorId(collector.id);
            }}
          />
        ))}
        <Input
          label="Waktu pengambilan"
          value={scheduledFor}
          onChangeText={(value) => {
            setDirty(true);
            setScheduledFor(value);
          }}
        />
      </FormDrawer>
    </>
  );
}
