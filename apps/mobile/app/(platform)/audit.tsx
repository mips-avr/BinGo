import { DataCard, DataListView } from '../../src/components/pivot/DataListView';
import { usePlatformAudit } from '../../src/features/pivot/hooks';
export default function Screen() {
  const q = usePlatformAudit();
  return (
    <DataListView
      title="Audit Platform"
      subtitle="Telusuri keputusan administratif dan aktivitas platform berdasarkan waktu serta pelakunya."
      query={q}
      renderItems={(items) =>
        items.map((x: any) => (
          <DataCard
            key={x.id}
            title={x.action.replaceAll('_', ' ')}
            detail={`${x.resourceType}${x.organization?.name ? ` • ${x.organization.name}` : ''}`}
            meta={`${new Date(x.createdAt).toLocaleString('id-ID')} • ${x.actor?.name ?? 'Sistem'}${x.reason ? ` • ${x.reason}` : ''}`}
          />
        ))
      }
    />
  );
}
