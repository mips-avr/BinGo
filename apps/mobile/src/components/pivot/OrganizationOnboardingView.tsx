import { useEffect, useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../ui/Button';
import { ErrorState } from '../ui/ErrorState';
import { Input } from '../ui/Input';
import { SkeletonList } from '../ui/Skeleton';
import { extractApiErrorMessage } from '../../lib/api/client';
import {
  useMyApplication,
  useSubmitMyApplication,
  useUpdateMyApplication,
  useUploadApplicationDocument,
} from '../../features/pivot/hooks';
import { colors, radius, screenStyles, spacing, typography } from '../../theme';

export function OrganizationOnboardingView() {
  const query = useMyApplication();
  const update = useUpdateMyApplication();
  const upload = useUploadApplicationDocument();
  const submit = useSubmitMyApplication();
  const [form, setForm] = useState({
    organizationName: '',
    responsibleName: '',
    contactPhone: '',
    address: '',
    serviceRegions: '',
    authorityBasis: '',
    acceptedMaterials: 'ORGANIC',
    capacityNote: '',
    receivingSchedule: '',
    qualityNotes: '',
  });

  useEffect(() => {
    if (!query.data) return;
    setForm({
      organizationName: query.data.organizationName ?? '',
      responsibleName: query.data.responsibleName ?? '',
      contactPhone: query.data.contactPhone ?? '',
      address: query.data.address ?? '',
      serviceRegions: (query.data.serviceRegions ?? []).join(', '),
      authorityBasis: query.data.authorityBasis ?? '',
      acceptedMaterials: (query.data.acceptedMaterials ?? ['ORGANIC']).join(', '),
      capacityNote: query.data.capacityNote ?? '',
      receivingSchedule: query.data.receivingSchedule ?? '',
      qualityNotes: query.data.qualityNotes ?? '',
    });
  }, [query.data]);

  if (query.isLoading)
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <SkeletonList count={5} />
      </ScrollView>
    );
  if (query.isError)
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <ErrorState message={extractApiErrorMessage(query.error)} onRetry={() => query.refetch()} />
      </ScrollView>
    );
  const application = query.data;
  const editable = ['DRAFT', 'CHANGES_REQUESTED'].includes(application.status);
  const business = application.organizationType === 'BUSINESS';
  const field = (key: keyof typeof form, label: string, multiline = false) => (
    <Input
      label={label}
      value={form[key]}
      onChangeText={(value) => setForm((old) => ({ ...old, [key]: value }))}
      editable={editable}
      multiline={multiline}
    />
  );

  async function save() {
    await update.mutateAsync({
      organizationName: form.organizationName.trim(),
      organizationType: application.organizationType,
      responsibleName: form.responsibleName.trim(),
      contactPhone: form.contactPhone.trim(),
      address: form.address.trim(),
      serviceRegions: form.serviceRegions
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      authorityBasis: form.authorityBasis.trim() || undefined,
      managedFacilities: [],
      acceptedMaterials: form.acceptedMaterials
        .split(',')
        .map((x) => x.trim().toUpperCase())
        .filter(Boolean),
      capacityNote: form.capacityNote.trim() || undefined,
      receivingSchedule: form.receivingSchedule.trim() || undefined,
      qualityNotes: form.qualityNotes.trim() || undefined,
      declarationAccepted: true,
    });
    Alert.alert('Tersimpan', 'Profil pengajuan berhasil diperbarui.');
  }

  async function pickDocument() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    await upload.mutateAsync({
      label: 'Dokumen pendukung',
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType ?? 'application/pdf',
      file: asset.file,
    });
    Alert.alert('Dokumen tersimpan', 'Dokumen hanya dapat dibuka oleh Anda dan Admin BinGo.');
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.statusRow}>
        <Text style={styles.status}>{application.status.replaceAll('_', ' ')}</Text>
        <Text style={styles.version}>Versi {application.version}</Text>
      </View>
      <Text style={screenStyles.screenTitle}>
        {business ? 'Verifikasi Business' : 'Verifikasi Pengelola'}
      </Text>
      <Text style={styles.subtitle}>
        {editable
          ? 'Lengkapi profil, unggah bukti, lalu kirim untuk ditinjau.'
          : 'Pengajuan sedang diproses. Riwayat dan catatan reviewer tersimpan.'}
      </Text>
      {application.status === 'CHANGES_REQUESTED' && application.reviews?.[0]?.reason ? (
        <View style={styles.note}>
          <Text style={styles.noteTitle}>Perubahan diperlukan</Text>
          <Text style={styles.noteText}>{application.reviews[0].reason}</Text>
        </View>
      ) : null}
      {editable ? (
        <>
          {field('organizationName', business ? 'Nama Business' : 'Nama Pengelola')}
          {field('responsibleName', 'Penanggung jawab')}
          {field('contactPhone', 'Nomor kontak')}
          {field('address', 'Alamat', true)}
          {field('serviceRegions', 'Wilayah layanan, pisahkan dengan koma')}
          {!business ? field('authorityBasis', 'Dasar kewenangan layanan', true) : null}
          {business ? (
            <>
              {field('acceptedMaterials', 'Material diterima, mis. ORGANIC, PAPER')}
              {field('capacityNote', 'Kapasitas penerimaan')}
              {field('receivingSchedule', 'Jadwal penerimaan')}
              {field('qualityNotes', 'Spesifikasi mutu dasar', true)}
            </>
          ) : null}
          <Button
            label="Simpan profil"
            loading={update.isPending}
            onPress={() =>
              save().catch((error) => Alert.alert('Belum tersimpan', extractApiErrorMessage(error)))
            }
          />
          <Button
            label="Unggah dokumen pendukung"
            variant="secondary"
            loading={upload.isPending}
            onPress={() =>
              pickDocument().catch((error) =>
                Alert.alert('Gagal mengunggah', extractApiErrorMessage(error)),
              )
            }
            style={{ marginTop: spacing.sm }}
          />
          <Text style={styles.documentCount}>
            {application.documents?.length ?? 0} dokumen privat tersimpan
          </Text>
          <Button
            label="Kirim untuk ditinjau"
            disabled={!application.documents?.length}
            loading={submit.isPending}
            onPress={() =>
              submit.mutate(undefined, {
                onSuccess: () =>
                  Alert.alert('Pengajuan terkirim', 'Admin BinGo akan meninjau data Anda.'),
                onError: (error) =>
                  Alert.alert('Belum dapat dikirim', extractApiErrorMessage(error)),
              })
            }
            style={{ marginTop: spacing.lg }}
          />
        </>
      ) : (
        <>
          <View style={styles.note}>
            <Text style={styles.noteTitle}>Status pengajuan</Text>
            <Text style={styles.noteText}>
              {application.status === 'ACTIVE'
                ? 'Organisasi aktif dan fitur operasional telah terbuka.'
                : 'Anda tetap dapat melihat status dan menghubungi bantuan.'}
            </Text>
          </View>
          <Text style={styles.documentCount}>
            {application.documents?.length ?? 0} dokumen tersimpan
          </Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 820,
    alignSelf: 'center',
    padding: spacing.xl,
    paddingBottom: 80,
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  status: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.bingo800,
    backgroundColor: colors.bingo100,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  version: { fontSize: 13, color: colors.neutral600 },
  subtitle: { ...typography.bodyMuted, marginTop: spacing.xs, marginBottom: spacing.xl },
  note: {
    backgroundColor: colors.amber100,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  noteTitle: { fontSize: 15, fontWeight: '800', color: colors.amber800 },
  noteText: { fontSize: 14, lineHeight: 20, color: colors.neutral700, marginTop: 4 },
  documentCount: { fontSize: 13, color: colors.neutral600, marginTop: spacing.sm },
});
