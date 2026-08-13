import { useMemo, useState } from 'react';
import { Alert, Text } from 'react-native';
import { FormDrawer } from '../../src/components/pivot/FormDrawer';
import { ManagementPage } from '../../src/components/pivot/ManagementPage';
import { masterText } from '../../src/components/pivot/ManagerMasterScreen';
import { Input } from '../../src/components/ui/Input';
import { useMaterialCategories, useMaterialCategoryMutation } from '../../src/features/pivot/hooks';
import { extractApiErrorMessage } from '../../src/lib/api/client';

export default function MaterialCategoriesScreen() {
  const query = useMaterialCategories();
  const mutation = useMaterialCategoryMutation();
  const [search, setSearch] = useState('');
  const [archived, setArchived] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({
    publicName: '',
    description: '',
    preparation: '',
    icon: '',
    displayOrder: '0',
  });
  const items = useMemo(
    () =>
      (query.data ?? [])
        .filter(
          (item: any) =>
            item.active !== archived &&
            `${item.code} ${item.publicName}`.toLowerCase().includes(search.toLowerCase()),
        )
        .map((item: any) => ({ ...item, id: item.code })),
    [archived, query.data, search],
  );
  function open(item: any) {
    setSelected(item);
    setForm({
      publicName: item.publicName,
      description: item.description,
      preparation: item.preparation ?? '',
      icon: item.icon ?? '',
      displayOrder: String(item.displayOrder),
    });
  }
  async function save() {
    try {
      await mutation.mutateAsync({
        code: selected.code,
        action: 'update',
        data: { ...form, displayOrder: Number(form.displayOrder) },
      });
      setSelected(null);
    } catch (error) {
      Alert.alert('Belum tersimpan', extractApiErrorMessage(error));
    }
  }
  return (
    <>
      <ManagementPage
        title="Kategori Material"
        subtitle="Kelola nama, panduan, ikon, urutan, dan status kategori material."
        query={query}
        items={items}
        search={search}
        onSearchChange={setSearch}
        archived={archived}
        onArchivedChange={setArchived}
        onEdit={open}
        onArchive={(item: any) =>
          mutation.mutate({
            code: item.code,
            action: 'archive',
            reason: 'Kategori disembunyikan dari alur baru',
          })
        }
        onRestore={(item: any) => mutation.mutate({ code: item.code, action: 'restore' })}
        columns={[
          {
            key: 'name',
            label: 'Kategori',
            render: (item: any) => <Text style={masterText.primary}>{item.publicName}</Text>,
          },
          {
            key: 'code',
            label: 'Kode sistem',
            render: (item: any) => <Text style={masterText.status}>{item.code}</Text>,
          },
          {
            key: 'description',
            label: 'Deskripsi',
            render: (item: any) => <Text style={masterText.secondary}>{item.description}</Text>,
          },
          {
            key: 'order',
            label: 'Urutan',
            render: (item: any) => <Text style={masterText.secondary}>{item.displayOrder}</Text>,
          },
        ]}
      />
      <FormDrawer
        visible={Boolean(selected)}
        title={`Edit ${selected?.code ?? 'Kategori'}`}
        description="Perbarui informasi kategori yang ditampilkan kepada pengguna BinGo."
        dirty
        loading={mutation.isPending}
        onClose={() => setSelected(null)}
        onSubmit={save}
      >
        {Object.entries({
          publicName: 'Nama publik',
          description: 'Deskripsi',
          preparation: 'Panduan persiapan',
          icon: 'Nama ikon',
          displayOrder: 'Urutan tampil',
        }).map(([key, label]) => (
          <Input
            key={key}
            label={label}
            value={form[key as keyof typeof form]}
            multiline={key === 'description' || key === 'preparation'}
            onChangeText={(value) => setForm((current) => ({ ...current, [key]: value }))}
          />
        ))}
      </FormDrawer>
    </>
  );
}
