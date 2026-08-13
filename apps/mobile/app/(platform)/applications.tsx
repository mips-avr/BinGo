import { useMemo, useState } from 'react';
import { Alert, Text } from 'react-native';
import { FormDrawer } from '../../src/components/pivot/FormDrawer';
import { ManagementPage } from '../../src/components/pivot/ManagementPage';
import { masterText } from '../../src/components/pivot/ManagerMasterScreen';
import { Button } from '../../src/components/ui/Button';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { Input } from '../../src/components/ui/Input';
import { SkeletonList } from '../../src/components/ui/Skeleton';
import {
  usePlatformApplication,
  usePlatformApplications,
  useReviewApplication,
} from '../../src/features/pivot/hooks';
import { extractApiErrorMessage } from '../../src/lib/api/client';

export default function ApplicationsScreen() {
  const list = usePlatformApplications();
  const review = useReviewApplication();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [reason, setReason] = useState('');
  const detail = usePlatformApplication(selectedId);
  const items = useMemo(
    () =>
      (list.data ?? []).filter((item: any) =>
        `${item.organizationName} ${item.organizationType} ${item.status}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [list.data, search],
  );

  function open(item: any) {
    setSelectedId(item.id);
    setReason('');
  }

  function decide(action: 'approve' | 'request-changes' | 'reject') {
    if (!detail.data) return;
    review.mutate(
      { id: detail.data.id, action, reason },
      {
        onSuccess: () => {
          setSelectedId('');
          Alert.alert('Keputusan tersimpan', 'Status dan catatan review telah diperbarui.');
        },
        onError: (error) => Alert.alert('Belum tersimpan', extractApiErrorMessage(error)),
      },
    );
  }

  return (
    <>
      <ManagementPage
        title="Antrean Verifikasi"
        subtitle="Pilih satu pengajuan untuk memeriksa profil, dokumen, dan mengambil keputusan."
        query={list}
        items={items}
        search={search}
        onSearchChange={setSearch}
        archived={false}
        onArchivedChange={() => undefined}
        showArchiveFilter={false}
        onOpen={open}
        columns={[
          {
            key: 'organization',
            label: 'Organisasi',
            render: (item: any) => <Text style={masterText.primary}>{item.organizationName}</Text>,
          },
          {
            key: 'type',
            label: 'Jenis',
            render: (item: any) => (
              <Text style={masterText.secondary}>{item.organizationType}</Text>
            ),
          },
          {
            key: 'version',
            label: 'Versi',
            render: (item: any) => <Text style={masterText.secondary}>Versi {item.version}</Text>,
          },
          {
            key: 'status',
            label: 'Status',
            render: (item: any) => (
              <Text style={masterText.status}>{item.status.replaceAll('_', ' ')}</Text>
            ),
          },
        ]}
      />
      <FormDrawer
        visible={Boolean(selectedId)}
        title={detail.data?.organizationName ?? 'Detail Pengajuan'}
        description="Keputusan review dicatat pada audit dan dapat dilihat pemohon."
        dirty={Boolean(reason)}
        loading={review.isPending}
        submitLabel="Setujui Organisasi"
        showSubmit={detail.data?.status === 'PENDING_REVIEW'}
        onClose={() => setSelectedId('')}
        onSubmit={() => decide('approve')}
      >
        {detail.isLoading ? (
          <SkeletonList count={5} />
        ) : detail.isError ? (
          <ErrorState
            message="Detail pengajuan belum dapat dimuat"
            onRetry={() => detail.refetch()}
          />
        ) : detail.data ? (
          <>
            <Text style={masterText.status}>
              {detail.data.organizationType} · {detail.data.status.replaceAll('_', ' ')} · Versi{' '}
              {detail.data.version}
            </Text>
            <Text style={masterText.primary}>Penanggung jawab</Text>
            <Text style={masterText.secondary}>
              {detail.data.responsibleName} · {detail.data.contactPhone}
            </Text>
            <Text style={masterText.primary}>Wilayah dan alamat</Text>
            <Text style={masterText.secondary}>
              {detail.data.serviceRegions.join(', ') || 'Belum diisi'} · {detail.data.address}
            </Text>
            <Text style={masterText.primary}>Dokumen privat</Text>
            {(detail.data.documents ?? []).map((document: any) => (
              <Text key={document.id} style={masterText.secondary}>
                • {document.label} ({document.mimeType})
              </Text>
            ))}
            {detail.data.status === 'PENDING_REVIEW' ? (
              <>
                <Input
                  label="Alasan atau catatan review"
                  value={reason}
                  multiline
                  numberOfLines={5}
                  onChangeText={setReason}
                />
                <Button
                  label="Minta Perubahan"
                  variant="secondary"
                  disabled={!reason.trim()}
                  onPress={() => decide('request-changes')}
                />
                <Button
                  label="Tolak Pengajuan"
                  variant="ghost"
                  disabled={!reason.trim()}
                  onPress={() => decide('reject')}
                />
              </>
            ) : (
              <Text style={masterText.status}>
                Pengajuan ini sudah memiliki keputusan {detail.data.status.replaceAll('_', ' ')}.
              </Text>
            )}
          </>
        ) : null}
      </FormDrawer>
    </>
  );
}
