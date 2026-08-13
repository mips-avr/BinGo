import { useState } from 'react';
import { Button } from '../../src/components/ui/Button';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { DataCard, DataListView } from '../../src/components/pivot/DataListView';
import { useModeratePublication, usePlatformModeration } from '../../src/features/pivot/hooks';

export default function Screen() {
  const query = usePlatformModeration();
  const mutation = useModeratePublication();
  const [pendingHide, setPendingHide] = useState<{ resourceType: 'requirement' | 'lot'; id: string } | null>(null);

  const action = (resourceType: 'requirement' | 'lot', item: any) => (
    <Button
      size="sm"
      variant="secondary"
      label={item.status === 'HIDDEN' ? 'Pulihkan' : 'Sembunyikan'}
      onPress={() => {
        if (item.status === 'HIDDEN') {
          mutation.mutate({ resourceType, id: item.id, action: 'restore' });
          return;
        }
        setPendingHide({ resourceType, id: item.id });
      }}
    />
  );

  return <>
    <DataListView
      title="Moderasi"
      subtitle="Tinjau publikasi kebutuhan dan lot material."
      query={query}
      renderItems={(data) => <>
        {data.requirements.map((item: any) => <DataCard key={item.id} title={item.title} detail={`Kebutuhan • ${item.organization.name}`} meta={`${item.quantityKg} kg • ${item.status}`} trailing={action('requirement', item)} />)}
        {data.lots.map((item: any) => <DataCard key={item.id} title={item.code} detail={`Lot • ${item.organization.name}`} meta={`${item.availableKg} kg tersedia • ${item.status}`} trailing={action('lot', item)} />)}
      </>}
    />
    <ConfirmDialog
      visible={Boolean(pendingHide)}
      title="Sembunyikan publikasi?"
      message="Publikasi tidak akan tampil sampai dipulihkan. Alasan tindakan tercatat pada audit."
      confirmLabel="Sembunyikan"
      destructive
      loading={mutation.isPending}
      onCancel={() => setPendingHide(null)}
      onConfirm={() => {
        if (!pendingHide) return;
        mutation.mutate(
          { ...pendingHide, action: 'hide', reason: 'Ditinjau pada moderasi demo' },
          { onSuccess: () => setPendingHide(null) },
        );
      }}
    />
  </>;
}
