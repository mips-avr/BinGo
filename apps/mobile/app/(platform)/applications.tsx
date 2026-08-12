import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DataCard } from '../../src/components/pivot/DataListView';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { Input } from '../../src/components/ui/Input';
import { SkeletonList } from '../../src/components/ui/Skeleton';
import {
  usePlatformApplication,
  usePlatformApplications,
  useReviewApplication,
} from '../../src/features/pivot/hooks';
import { extractApiErrorMessage } from '../../src/lib/api/client';
import { colors, screenStyles, spacing } from '../../src/theme';

export default function ApplicationsScreen() {
  const list = usePlatformApplications();
  const review = useReviewApplication();
  const [selectedId, setSelectedId] = useState('');
  const detail = usePlatformApplication(selectedId || list.data?.[0]?.id || '');
  const [reason, setReason] = useState(
    'Mohon lengkapi bukti kewenangan layanan dan jadwal operasional.',
  );
  const selected = detail.data;
  function decide(action: 'approve' | 'request-changes' | 'reject') {
    review.mutate(
      { id: selected.id, action, reason },
      {
        onSuccess: () =>
          Alert.alert(
            'Keputusan tersimpan',
            'Pemohon dapat melihat status terbaru dan catatan review.',
          ),
        onError: (error) => Alert.alert('Belum tersimpan', extractApiErrorMessage(error)),
      },
    );
  }
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={screenStyles.screenTitle}>Antrean Verifikasi</Text>
      <Text style={styles.subtitle}>
        Periksa identitas, cakupan layanan, kapasitas, dan dokumen sebelum mengambil keputusan.
      </Text>
      {list.isLoading ? (
        <SkeletonList count={4} />
      ) : list.isError ? (
        <ErrorState message="Antrean belum dapat dimuat" onRetry={() => list.refetch()} />
      ) : (
        <View style={styles.choices}>
          {list.data?.map((item: any) => (
            <Button
              key={item.id}
              size="sm"
              label={item.organizationName}
              variant={(selected?.id ?? list.data?.[0]?.id) === item.id ? 'primary' : 'secondary'}
              onPress={() => setSelectedId(item.id)}
            />
          ))}
        </View>
      )}
      {selected ? (
        <Card style={styles.panel}>
          <Text style={styles.heading}>{selected.organizationName}</Text>
          <Text style={styles.meta}>
            {selected.organizationType} • {selected.status.replaceAll('_', ' ')} • Versi{' '}
            {selected.version}
          </Text>
          <DataCard
            title="Penanggung jawab"
            detail={selected.responsibleName}
            meta={selected.contactPhone}
          />
          <DataCard
            title="Wilayah layanan"
            detail={selected.serviceRegions.join(', ') || 'Belum diisi'}
            meta={selected.address}
          />
          <Text style={styles.heading}>Dokumen privat</Text>
          {selected.documents.map((document: any) => (
            <DataCard
              key={document.id}
              title={document.label}
              detail={document.mimeType}
              meta={document.demo ? 'Dokumen Demo' : 'Dokumen pemohon'}
            />
          ))}
          {selected.status === 'PENDING_REVIEW' ? (
            <>
              <Input
                label="Alasan atau catatan review"
                value={reason}
                multiline
                onChangeText={setReason}
              />
              <Button
                label="Setujui organisasi"
                loading={review.isPending}
                onPress={() => decide('approve')}
              />
              <Button
                label="Minta perubahan"
                variant="secondary"
                style={{ marginTop: spacing.sm }}
                onPress={() => decide('request-changes')}
              />
              <Button
                label="Tolak pengajuan"
                variant="ghost"
                style={{ marginTop: spacing.sm }}
                onPress={() => decide('reject')}
              />
            </>
          ) : (
            <Text style={styles.done}>Keputusan: {selected.status.replaceAll('_', ' ')}</Text>
          )}
        </Card>
      ) : null}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    paddingBottom: 100,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  subtitle: { color: colors.neutral600, marginTop: spacing.xs, marginBottom: spacing.xl },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  panel: { marginBottom: spacing.xl },
  heading: { fontSize: 18, fontWeight: '800', color: colors.neutral900, marginBottom: spacing.sm },
  meta: { color: colors.neutral600, marginBottom: spacing.lg },
  done: { color: colors.bingo700, fontWeight: '700' },
});
