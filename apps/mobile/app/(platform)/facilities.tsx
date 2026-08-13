import { useMemo, useState } from 'react';
import { Alert, Text } from 'react-native';
import { FormDrawer } from '../../src/components/pivot/FormDrawer';
import { ManagementPage } from '../../src/components/pivot/ManagementPage';
import { masterText } from '../../src/components/pivot/ManagerMasterScreen';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import {
  usePlatformFacilities,
  usePlatformFacilityMutation,
  useVerifyPlatformFacility,
} from '../../src/features/pivot/hooks';
import { extractApiErrorMessage } from '../../src/lib/api/client';

const empty = {
  name: '',
  operatorName: '',
  address: '',
  lat: '-6.225',
  lng: '106.9',
  sourceUrl: '',
  openingNote: '',
  materials: 'ORGANIC, PAPER, PET',
};
export default function FacilitiesScreen() {
  const [search, setSearch] = useState('');
  const [archived, setArchived] = useState(false);
  const query = usePlatformFacilities(archived);
  const mutation = usePlatformFacilityMutation();
  const verify = useVerifyPlatformFacility();
  const [mode, setMode] = useState<'form' | 'verify' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState(empty);
  const [verificationNote, setVerificationNote] = useState('');
  const items = useMemo(
    () =>
      (query.data ?? []).filter((item: any) =>
        `${item.name} ${item.operatorName} ${item.address}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [query.data, search],
  );
  function openForm(item?: any) {
    setSelected(item ?? null);
    setForm(
      item
        ? {
            name: item.name,
            operatorName: item.operatorName,
            address: item.address,
            lat: String(item.lat),
            lng: String(item.lng),
            sourceUrl: item.sourceUrl,
            openingNote: item.openingNote ?? '',
            materials: item.materialRules?.map((rule: any) => rule.material).join(', ') ?? '',
          }
        : empty,
    );
    setMode('form');
  }
  async function save() {
    const data = {
      ...form,
      lat: Number(form.lat),
      lng: Number(form.lng),
      materials: form.materials
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    };
    try {
      await mutation.mutateAsync({
        action: selected ? 'update' : 'create',
        id: selected?.id,
        data,
      });
      setMode(null);
    } catch (error) {
      Alert.alert('Belum tersimpan', extractApiErrorMessage(error));
    }
  }
  async function saveVerification() {
    try {
      await verify.mutateAsync({
        id: selected.id,
        sourceUrl: selected.sourceUrl,
        note: verificationNote,
      });
      setMode(null);
    } catch (error) {
      Alert.alert('Belum diverifikasi', extractApiErrorMessage(error));
    }
  }
  return (
    <>
      <ManagementPage
        title="Fasilitas"
        subtitle="Kelola direktori lintas organisasi serta tanggal verifikasi sumbernya."
        primaryAction={{ label: 'Tambah Fasilitas', onPress: () => openForm() }}
        query={query}
        items={items}
        search={search}
        onSearchChange={setSearch}
        archived={archived}
        onArchivedChange={setArchived}
        onEdit={openForm}
        onArchive={(item) =>
          mutation.mutate({
            action: 'archive',
            id: item.id,
            reason: 'Entri tidak lagi layak ditampilkan',
          })
        }
        onRestore={(item) => mutation.mutate({ action: 'restore', id: item.id })}
        renderActions={
          !archived
            ? (item) => (
                <Button
                  size="sm"
                  label="Verifikasi"
                  variant="ghost"
                  onPress={() => {
                    setSelected(item);
                    setVerificationNote('');
                    setMode('verify');
                  }}
                />
              )
            : undefined
        }
        columns={[
          {
            key: 'name',
            label: 'Fasilitas',
            render: (item: any) => <Text style={masterText.primary}>{item.name}</Text>,
          },
          {
            key: 'operator',
            label: 'Operator',
            render: (item: any) => <Text style={masterText.secondary}>{item.operatorName}</Text>,
          },
          {
            key: 'address',
            label: 'Alamat',
            render: (item: any) => <Text style={masterText.secondary}>{item.address}</Text>,
          },
          {
            key: 'verified',
            label: 'Verifikasi',
            render: (item: any) => (
              <Text style={masterText.status}>
                {new Date(item.verifiedAt).toLocaleDateString('id-ID')}
              </Text>
            ),
          },
        ]}
      />
      <FormDrawer
        visible={mode === 'form'}
        title={selected ? 'Edit Fasilitas' : 'Tambah Fasilitas'}
        dirty
        loading={mutation.isPending}
        onClose={() => setMode(null)}
        onSubmit={save}
      >
        {Object.entries({
          name: 'Nama fasilitas',
          operatorName: 'Operator',
          address: 'Alamat',
          lat: 'Latitude',
          lng: 'Longitude',
          sourceUrl: 'Sumber data',
          openingNote: 'Catatan operasional',
          materials: 'Material diterima, pisahkan dengan koma',
        }).map(([key, label]) => (
          <Input
            key={key}
            label={label}
            value={form[key as keyof typeof form]}
            onChangeText={(value) => setForm((current) => ({ ...current, [key]: value }))}
          />
        ))}
      </FormDrawer>
      <FormDrawer
        visible={mode === 'verify'}
        title="Verifikasi Fasilitas"
        description={selected?.name}
        loading={verify.isPending}
        submitLabel="Simpan Verifikasi"
        onClose={() => setMode(null)}
        onSubmit={saveVerification}
      >
        <Input label="Sumber verifikasi" value={selected?.sourceUrl ?? ''} editable={false} />
        <Input
          label="Catatan pemeriksaan"
          value={verificationNote}
          multiline
          onChangeText={setVerificationNote}
        />
      </FormDrawer>
    </>
  );
}
