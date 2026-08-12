import { Text } from 'react-native';
import { DataCard, DataListView } from '../../src/components/pivot/DataListView';
import { useManagerOperations } from '../../src/features/pivot/hooks';
export default function ManagerOperations({ mode = 'runs' }: { mode?: string }) {
  const query = useManagerOperations();
  return (
    <DataListView
      title={
        mode === 'batches'
          ? 'Timbang dan Pemilahan'
          : mode === 'lots'
            ? 'Material'
            : mode === 'orders'
              ? 'Pesanan'
              : mode === 'reports'
                ? 'Laporan'
                : 'Operasional'
      }
      subtitle={
        mode === 'orders'
          ? 'Pantau reservasi, penerimaan, dan penyelesaian pesanan material.'
          : 'Pantau aktivitas layanan terbaru organisasi.'
      }
      query={query}
      renderItems={(data) => {
        const items =
          mode === 'batches'
            ? data.batches
            : mode === 'lots'
              ? data.lots
              : mode === 'orders'
                ? data.orders
                : mode === 'reports'
                  ? data.reports
                  : data.runs;
        return items.map((item: any) => (
          <DataCard
            key={item.id}
            title={
              item.batchNo ??
              item.code ??
              item.orderNo ??
              item.description ??
              item.route?.name ??
              'Aktivitas'
            }
            detail={item.status ?? `${item.availableKg ?? item.quantityKg} kg`}
            meta={
              item.scheduledFor ? new Date(item.scheduledFor).toLocaleString('id-ID') : undefined
            }
            trailing={<Text>{item.material ?? ''}</Text>}
          />
        ));
      }}
    />
  );
}
