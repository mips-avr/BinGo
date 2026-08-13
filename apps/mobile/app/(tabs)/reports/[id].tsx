import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../../src/components/ui/Button';
import { Input } from '../../../src/components/ui/Input';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { ReportPhoto } from '../../../src/components/pivot/ReportPhoto';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { SkeletonList } from '../../../src/components/ui/Skeleton';
import { useHouseholdReportMutation } from '../../../src/features/pivot/hooks';
import { uploadImage } from '../../../src/features/uploads/api';
import { pickFromGallery } from '../../../src/lib/image/picker';
import { api, extractApiErrorMessage } from '../../../src/lib/api/client';
import { colors, screenStyles, spacing } from '../../../src/theme';

export default function ReportDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const query = useQuery({
    queryKey: ['pivot', 'reports'],
    queryFn: async () => (await api.get('/api/v1/pivot/reports')).data,
  });
  const report = query.data?.find((item: any) => item.id === id);
  const mutation = useHouseholdReportMutation();
  const [form, setForm] = useState({
    description: '',
    address: '',
    lat: '',
    lng: '',
    photoKey: '',
  });
  const [replacementPhoto, setReplacementPhoto] = useState('');
  useEffect(() => {
    if (report)
      setForm({
        description: report.description,
        address: report.address,
        lat: String(report.lat),
        lng: String(report.lng),
        photoKey: report.photoKey,
      });
  }, [report]);
  if (query.isLoading)
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <SkeletonList count={4} />
      </ScrollView>
    );
  if (query.isError || !report)
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <ErrorState message="Laporan tidak ditemukan" onRetry={() => query.refetch()} />
      </ScrollView>
    );
  const editable = report.status === 'SUBMITTED';
  async function save() {
    try {
      const photoKey = replacementPhoto ? (await uploadImage(replacementPhoto)).url : form.photoKey;
      await mutation.mutateAsync({
        action: 'update',
        id,
        data: { ...form, photoKey, lat: Number(form.lat), lng: Number(form.lng) },
      });
      Alert.alert('Laporan diperbarui');
    } catch (error) {
      Alert.alert('Belum tersimpan', extractApiErrorMessage(error));
    }
  }
  async function withdraw() {
    try {
      await mutation.mutateAsync({ action: 'withdraw', id, reason: 'Laporan ditarik oleh warga' });
      router.back();
    } catch (error) {
      Alert.alert('Belum ditarik', extractApiErrorMessage(error));
    }
  }
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ScreenHeader title="Detail Laporan" />
      <Text style={screenStyles.screenTitle}>{report.status.replaceAll('_', ' ')}</Text>
      <Text style={styles.help}>
        {editable
          ? 'Laporan masih dapat diperbarui atau ditarik sebelum diverifikasi Pengelola.'
          : 'Laporan telah diproses dan tidak dapat diubah.'}
      </Text>
      <ReportPhoto uri={replacementPhoto || report.photoKey} />
      {editable ? (
        <Button
          label="Ganti Foto"
          variant="secondary"
          style={{ marginBottom: spacing.lg }}
          onPress={async () => {
            try {
              const image = await pickFromGallery();
              if (image) setReplacementPhoto(image.uri);
            } catch (error) {
              Alert.alert('Foto belum dipilih', extractApiErrorMessage(error));
            }
          }}
        />
      ) : null}
      <Input
        label="Deskripsi"
        value={form.description}
        editable={editable}
        multiline
        onChangeText={(value) => setForm((current) => ({ ...current, description: value }))}
      />
      <Input
        label="Alamat"
        value={form.address}
        editable={editable}
        onChangeText={(value) => setForm((current) => ({ ...current, address: value }))}
      />
      <Input
        label="Latitude"
        value={form.lat}
        editable={editable}
        onChangeText={(value) => setForm((current) => ({ ...current, lat: value }))}
      />
      <Input
        label="Longitude"
        value={form.lng}
        editable={editable}
        onChangeText={(value) => setForm((current) => ({ ...current, lng: value }))}
      />
      {editable ? (
        <>
          <Button label="Simpan Perubahan" loading={mutation.isPending} onPress={save} />
          <Button
            label="Tarik Laporan"
            variant="secondary"
            onPress={withdraw}
            style={{ marginTop: spacing.sm }}
          />
        </>
      ) : null}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: spacing.lg, paddingBottom: 100, backgroundColor: colors.white },
  help: { color: colors.neutral600, marginVertical: spacing.md },
});
