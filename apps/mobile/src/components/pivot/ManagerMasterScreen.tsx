import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, StyleSheet, Text } from 'react-native';
import { extractApiErrorMessage } from '../../lib/api/client';
import { useManagerResource, useManagerResourceMutation } from '../../features/pivot/hooks';
import { colors, fonts } from '../../theme';
import { FormDrawer } from './FormDrawer';
import { ManagementPage, type ManagementColumn } from './ManagementPage';
import { Input } from '../ui/Input';

export interface MasterField {
  key: string;
  label: string;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'phone-pad';
  multiline?: boolean;
  parse?: (value: string) => unknown;
  getValue?: (item: Record<string, unknown>) => unknown;
}

export function ManagerMasterScreen<T extends { id: string }>({
  resource,
  title,
  subtitle,
  createLabel,
  fields,
  initial,
  columns,
  normalize,
  renderActions,
  secondaryActions,
  canEdit,
  canArchive,
}: {
  resource: string;
  title: string;
  subtitle: string;
  createLabel: string;
  fields: MasterField[];
  initial: Record<string, string>;
  columns: ManagementColumn<T>[];
  normalize?: (value: Record<string, unknown>) => Record<string, unknown>;
  renderActions?: (
    item: T,
    mutation: ReturnType<typeof useManagerResourceMutation>,
  ) => React.ReactNode;
  secondaryActions?: { label: string; onPress: () => void }[];
  canEdit?: (item: T) => boolean;
  canArchive?: (item: T) => boolean;
}) {
  const [search, setSearch] = useState('');
  const [archived, setArchived] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const queryParams = useMemo(
    () => ({ search, archived, page, pageSize }),
    [archived, page, search],
  );
  const query = useManagerResource(resource, queryParams);
  const mutation = useManagerResourceMutation(resource);
  const [drawer, setDrawer] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<T | null>(null);
  const [form, setForm] = useState(initial);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!drawer) setDirty(false);
  }, [drawer]);

  function openCreate() {
    setSelected(null);
    setForm(initial);
    setDirty(false);
    setDrawer('create');
  }
  function openEdit(item: T) {
    setSelected(item);
    setForm(
      Object.fromEntries(
        fields.map((field) => [
          field.key,
          stringify(
            field.getValue
              ? field.getValue(item as Record<string, unknown>)
              : (item as Record<string, unknown>)[field.key],
          ),
        ]),
      ),
    );
    setDirty(false);
    setDrawer('edit');
  }
  async function submit() {
    const raw = Object.fromEntries(
      fields.map((field) => [
        field.key,
        field.parse ? field.parse(form[field.key] ?? '') : form[field.key],
      ]),
    );
    const data = normalize ? normalize(raw) : raw;
    try {
      await mutation.mutateAsync({
        action: drawer === 'edit' ? 'update' : 'create',
        id: selected?.id,
        data,
      });
      setDrawer(null);
      Alert.alert('Tersimpan', `${title} berhasil ${selected ? 'diperbarui' : 'ditambahkan'}.`);
    } catch (error) {
      Alert.alert('Belum tersimpan', extractApiErrorMessage(error));
    }
  }
  function archive(item: T, restore = false) {
    const record = item as unknown as Record<string, unknown>;
    const label = String(record.name ?? record.code ?? record.accountNo ?? item.id);
    const run = () =>
      mutation.mutate({
        action: restore ? 'restore' : 'archive',
        id: item.id,
        reason: restore
          ? 'Dipulihkan melalui dashboard'
          : 'Tidak lagi digunakan pada operasional aktif',
      });
    const message = `${restore ? 'Pulihkan' : 'Arsipkan'} ${label}? Riwayat transaksi tetap dipertahankan.`;
    if (Platform.OS === 'web') {
      if (globalThis.confirm(message)) run();
      return;
    }
    Alert.alert(restore ? 'Pulihkan data' : 'Arsipkan data', message, [
      { text: 'Batal', style: 'cancel' },
      {
        text: restore ? 'Pulihkan' : 'Arsipkan',
        style: restore ? 'default' : 'destructive',
        onPress: run,
      },
    ]);
  }

  return (
    <>
      <ManagementPage
        title={title}
        subtitle={subtitle}
        primaryAction={{ label: createLabel, onPress: openCreate }}
        query={query}
        items={(query.data?.items ?? []) as T[]}
        columns={columns}
        search={search}
        onSearchChange={setSearch}
        archived={archived}
        onArchivedChange={(value) => {
          setArchived(value);
          setPage(1);
        }}
        onEdit={openEdit}
        onArchive={(item) => archive(item)}
        onRestore={(item) => archive(item, true)}
        pagination={{ page, pageSize, total: query.data?.total ?? 0, onPageChange: setPage }}
        renderActions={renderActions ? (item) => renderActions(item, mutation) : undefined}
        secondaryActions={secondaryActions}
        canEdit={canEdit}
        canArchive={canArchive}
      />
      <FormDrawer
        visible={Boolean(drawer)}
        title={drawer === 'edit' ? `Edit ${title}` : createLabel}
        description="Lengkapi informasi yang dibutuhkan, lalu simpan perubahan."
        dirty={dirty}
        loading={mutation.isPending}
        onClose={() => setDrawer(null)}
        onSubmit={submit}
      >
        {fields.map((field) => (
          <Input
            key={field.key}
            label={field.label}
            placeholder={field.placeholder}
            value={form[field.key] ?? ''}
            keyboardType={field.keyboardType}
            multiline={field.multiline}
            onChangeText={(value) => {
              setDirty(true);
              setForm((current) => ({ ...current, [field.key]: value }));
            }}
          />
        ))}
        <Text style={styles.note}>
          Data yang sudah mempunyai riwayat tidak dihapus permanen. Gunakan Arsipkan dari daftar.
        </Text>
      </FormDrawer>
    </>
  );
}

function stringify(value: unknown) {
  if (Array.isArray(value)) return value.join(', ');
  if (value == null) return '';
  return String(value);
}

export const masterText = StyleSheet.create({
  primary: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.neutral900 },
  secondary: { fontSize: 13, fontFamily: fonts.regular, color: colors.neutral600 },
  status: { fontSize: 12, fontFamily: fonts.bold, color: colors.bingo700 },
});

const styles = StyleSheet.create({
  note: { fontSize: 12, lineHeight: 18, fontFamily: fonts.regular, color: colors.neutral500 },
});
