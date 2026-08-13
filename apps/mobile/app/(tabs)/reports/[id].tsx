import { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { statusLabel } from '../../../src/lib/presentation/status';
import { colors, fonts, radius, screenStyles, spacing } from '../../../src/theme';

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
  const [editing, setEditing] = useState(false);
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
      setEditing(false);
      setReplacementPhoto('');
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
      <View style={styles.titleRow}>
        <Text style={screenStyles.screenTitle}>{report.description}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{statusLabel(report.status)}</Text>
        </View>
      </View>
      <ReportPhoto uri={replacementPhoto || report.photoKey} />
      {editing ? (
        <>
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
          <Input
            label="Nama laporan"
            value={form.description}
            multiline
            onChangeText={(value) => setForm((current) => ({ ...current, description: value }))}
          />
          <Input
            label="Alamat"
            value={form.address}
            onChangeText={(value) => setForm((current) => ({ ...current, address: value }))}
          />
          <Input
            label="Latitude"
            value={form.lat}
            onChangeText={(value) => setForm((current) => ({ ...current, lat: value }))}
          />
          <Input
            label="Longitude"
            value={form.lng}
            onChangeText={(value) => setForm((current) => ({ ...current, lng: value }))}
          />
          <Button label="Simpan Perubahan" loading={mutation.isPending} onPress={save} />
          <Button
            label="Batal"
            variant="secondary"
            onPress={() => {
              setEditing(false);
              setReplacementPhoto('');
              setForm({
                description: report.description,
                address: report.address,
                lat: String(report.lat),
                lng: String(report.lng),
                photoKey: report.photoKey,
              });
            }}
            style={{ marginTop: spacing.sm }}
          />
        </>
      ) : (
        <>
          <View style={styles.detailCard}>
            <Detail label="Lokasi" value={report.address} />
            <Detail
              label="Dibuat"
              value={new Date(report.createdAt).toLocaleString('id-ID', {
                dateStyle: 'long',
                timeStyle: 'short',
              })}
            />
            <Detail
              label="Terakhir diperbarui"
              value={new Date(report.updatedAt).toLocaleString('id-ID', {
                dateStyle: 'long',
                timeStyle: 'short',
              })}
            />
            {report.resolutionNote ? (
              <Detail label="Catatan penanganan" value={report.resolutionNote} />
            ) : null}
            <Button
              label="Buka Lokasi"
              size="sm"
              variant="secondary"
              onPress={() =>
                Linking.openURL(
                  `https://www.google.com/maps/dir/?api=1&destination=${report.lat},${report.lng}`,
                )
              }
            />
          </View>
          {report.events?.length ? (
            <View style={styles.historyCard}>
              <Text style={styles.sectionTitle}>Riwayat Penanganan</Text>
              {[...report.events]
                .sort(
                  (a: any, b: any) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                )
                .map((event: any) => (
                  <View key={event.id} style={styles.historyItem}>
                    <View style={styles.timelineDot} />
                    <View style={styles.historyCopy}>
                      <Text style={styles.historyStatus}>{statusLabel(event.status)}</Text>
                      {event.note ? <Text style={styles.historyNote}>{event.note}</Text> : null}
                      <Text style={styles.historyDate}>
                        {new Date(event.createdAt).toLocaleString('id-ID')}
                      </Text>
                    </View>
                  </View>
                ))}
            </View>
          ) : null}
          {editable ? (
            <View style={styles.actions}>
              <Button label="Edit Laporan" onPress={() => setEditing(true)} />
              <Button label="Tarik Laporan" variant="secondary" onPress={withdraw} />
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: spacing.lg, paddingBottom: 100, backgroundColor: colors.white },
  titleRow: { gap: spacing.sm, marginBottom: spacing.md },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.bingo100,
  },
  statusText: { fontSize: 12, fontFamily: fonts.bold, color: colors.bingo800 },
  detailCard: {
    gap: spacing.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral200,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  detailItem: { gap: spacing.xs },
  detailLabel: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.neutral500,
    textTransform: 'uppercase',
  },
  detailValue: { fontSize: 15, lineHeight: 22, fontFamily: fonts.medium, color: colors.neutral900 },
  historyCard: {
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.neutral50,
  },
  sectionTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.neutral900 },
  historyItem: { flexDirection: 'row', gap: spacing.md },
  timelineDot: {
    width: 10,
    height: 10,
    marginTop: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.bingo600,
  },
  historyCopy: { flex: 1, gap: 2 },
  historyStatus: { fontSize: 14, fontFamily: fonts.bold, color: colors.neutral900 },
  historyNote: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.neutral700,
  },
  historyDate: { fontSize: 12, fontFamily: fonts.regular, color: colors.neutral500 },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
});
