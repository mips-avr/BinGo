import { Alert, Text } from 'react-native';
import { Button } from '../../src/components/ui/Button';
import { DataCard, DataListView } from '../../src/components/pivot/DataListView';
import { useCollectorToday, useUpdateStop } from '../../src/features/pivot/hooks';
export default function Screen() {
  const q = useCollectorToday(),
    m = useUpdateStop();
  return (
    <DataListView
      title="Rute Hari Ini"
      subtitle="Perbarui status agar Pengelola dan Warga mendapat informasi yang jelas."
      query={q}
      renderItems={(d) =>
        d.run?.route.stops.map((x: any) => (
          <DataCard
            key={x.id}
            title={`${x.sequence}. ${x.label}`}
            detail={x.address}
            meta={x.status}
            trailing={
              x.status !== 'COLLECTED' ? (
                <Button
                  label="Sudah diambil"
                  size="sm"
                  onPress={() =>
                    m.mutate(
                      { id: x.id, status: 'COLLECTED' },
                      { onSuccess: () => Alert.alert('Status diperbarui') },
                    )
                  }
                />
              ) : (
                <Text>✓ Selesai</Text>
              )
            }
          />
        )) ?? []
      }
    />
  );
}
