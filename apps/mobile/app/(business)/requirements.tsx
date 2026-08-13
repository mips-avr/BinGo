import { useMemo, useState } from 'react';
import { Alert, Text } from 'react-native';
import { FormDrawer } from '../../src/components/pivot/FormDrawer';
import { ManagementPage } from '../../src/components/pivot/ManagementPage';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import {
  useBusinessRequirementMutation,
  useBusinessRequirements,
  useCreateRequirement,
} from '../../src/features/pivot/hooks';
import { extractApiErrorMessage } from '../../src/lib/api/client';
import { masterText } from '../../src/components/pivot/ManagerMasterScreen';

const empty = {
  title: '',
  material: 'ORGANIC',
  quantityKg: '',
  pricePerKg: '',
  region: '',
  moistureMaxPct: '',
  contaminationMaxPct: '',
  notes: '',
};
export default function RequirementsScreen() {
  const [search, setSearch] = useState('');
  const [archived, setArchived] = useState(false);
  const params = useMemo(() => ({ search, archived, pageSize: 50 }), [archived, search]);
  const query = useBusinessRequirements(params);
  const create = useCreateRequirement();
  const mutation = useBusinessRequirementMutation();
  const [selected, setSelected] = useState<any>(null);
  const [drawer, setDrawer] = useState(false);
  const [form, setForm] = useState(empty);
  function open(item?: any) {
    setSelected(item ?? null);
    setForm(
      item
        ? {
            title: item.title,
            material: item.material,
            quantityKg: String(item.quantityKg),
            pricePerKg: String(item.pricePerKg ?? ''),
            region: item.region,
            moistureMaxPct: String(item.qualitySpecs?.[0]?.moistureMaxPct ?? ''),
            contaminationMaxPct: String(item.qualitySpecs?.[0]?.contaminationMaxPct ?? ''),
            notes: item.qualitySpecs?.[0]?.notes ?? '',
          }
        : empty,
    );
    setDrawer(true);
  }
  async function save() {
    const data = {
      title: form.title,
      material: form.material,
      quantityKg: Number(form.quantityKg),
      pricePerKg: form.pricePerKg ? Number(form.pricePerKg) : undefined,
      region: form.region,
      qualitySpec: {
        moistureMaxPct: form.moistureMaxPct ? Number(form.moistureMaxPct) : undefined,
        contaminationMaxPct: form.contaminationMaxPct
          ? Number(form.contaminationMaxPct)
          : undefined,
        notes: form.notes,
      },
    };
    try {
      if (selected) await mutation.mutateAsync({ action: 'update', id: selected.id, data });
      else await create.mutateAsync(data);
      setDrawer(false);
    } catch (error) {
      Alert.alert('Belum tersimpan', extractApiErrorMessage(error));
    }
  }
  return (
    <>
      <ManagementPage
        title="Kebutuhan Material"
        subtitle="Simpan sebagai draft, lalu publikasikan setelah volume dan spesifikasi mutu siap."
        primaryAction={{ label: 'Buat Kebutuhan', onPress: () => open() }}
        query={query}
        items={query.data?.items ?? []}
        search={search}
        onSearchChange={setSearch}
        archived={archived}
        onArchivedChange={setArchived}
        onEdit={(item) => (item.status === 'DRAFT' ? open(item) : undefined)}
        canEdit={(item: any) => item.status === 'DRAFT'}
        onArchive={(item) =>
          mutation.mutate({ action: 'archive', id: item.id, reason: 'Tidak lagi dibutuhkan' })
        }
        onRestore={(item) => mutation.mutate({ action: 'restore', id: item.id })}
        renderActions={
          !archived
            ? (item: any) =>
                item.status === 'DRAFT' ? (
                  <Button
                    size="sm"
                    label="Publikasikan"
                    variant="ghost"
                    onPress={() => mutation.mutate({ action: 'publish', id: item.id })}
                  />
                ) : item.status === 'PUBLISHED' ? (
                  <Button
                    size="sm"
                    label="Tutup"
                    variant="ghost"
                    onPress={() => mutation.mutate({ action: 'close', id: item.id })}
                  />
                ) : null
            : undefined
        }
        columns={[
          {
            key: 'title',
            label: 'Kebutuhan',
            render: (x: any) => <Text style={masterText.primary}>{x.title}</Text>,
          },
          {
            key: 'material',
            label: 'Material',
            render: (x: any) => <Text style={masterText.secondary}>{x.material}</Text>,
          },
          {
            key: 'quantity',
            label: 'Volume',
            render: (x: any) => (
              <Text style={masterText.secondary}>
                {Number(x.quantityKg).toLocaleString('id-ID')} kg
              </Text>
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
        title={selected ? 'Edit Kebutuhan' : 'Buat Kebutuhan'}
        loading={create.isPending || mutation.isPending}
        dirty
        onClose={() => setDrawer(false)}
        onSubmit={save}
      >
        {Object.entries({
          title: 'Judul',
          material: 'Kategori material',
          quantityKg: 'Jumlah (kg)',
          pricePerKg: 'Target harga per kg',
          region: 'Wilayah',
          moistureMaxPct: 'Kadar air maksimum (%)',
          contaminationMaxPct: 'Kontaminasi maksimum (%)',
          notes: 'Catatan mutu',
        }).map(([key, label]) => (
          <Input
            key={key}
            label={label}
            value={form[key as keyof typeof form]}
            onChangeText={(value) => setForm((current) => ({ ...current, [key]: value }))}
          />
        ))}
      </FormDrawer>
    </>
  );
}
