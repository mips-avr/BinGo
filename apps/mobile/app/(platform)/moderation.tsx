import { Alert } from 'react-native';
import { Button } from '../../src/components/ui/Button';
import { DataCard, DataListView } from '../../src/components/pivot/DataListView';
import { useModeratePublication, usePlatformModeration } from '../../src/features/pivot/hooks';

export default function Screen() {
  const query = usePlatformModeration();
  const mutation = useModeratePublication();

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
        Alert.alert('Sembunyikan publikasi', 'Alasan akan tercatat pada audit.', [
          { text: 'Batal', style: 'cancel' },
          { text: 'Sembunyikan', onPress: () => mutation.mutate({ resourceType, id: item.id, action: 'hide', reason: 'Ditinjau pada moderasi demo' }) },
        ]);
      }}
    />
  );

  return <DataListView
    title="Moderasi"
    subtitle="Admin dapat menyembunyikan publikasi, tanpa mengubah isi komersialnya."
    query={query}
    renderItems={(data) => <>
      {data.requirements.map((item: any) => <DataCard key={item.id} title={item.title} detail={`Kebutuhan • ${item.organization.name}`} meta={`${item.quantityKg} kg • ${item.status}`} trailing={action('requirement', item)} />)}
      {data.lots.map((item: any) => <DataCard key={item.id} title={item.code} detail={`Lot • ${item.organization.name}`} meta={`${item.availableKg} kg tersedia • ${item.status}`} trailing={action('lot', item)} />)}
    </>}
  />;
}
