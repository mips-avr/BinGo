import { DataCard, DataListView } from '../../src/components/pivot/DataListView';
import { useManagerOperations } from '../../src/features/pivot/hooks';
export default function BillingScreen() {
  const query = useManagerOperations();
  return (
    <DataListView
      title="Tagihan"
      subtitle="Pantau tagihan layanan bulanan dan status pembayaran warga."
      query={query}
      renderItems={(data) =>
        data.invoices.map((invoice: any) => (
          <DataCard
            key={invoice.id}
            title={`${invoice.household.accountNo} • ${invoice.period}`}
            detail={`Rp${Number(invoice.amount).toLocaleString('id-ID')}`}
            meta={`${invoice.status} • jatuh tempo ${new Date(invoice.dueAt).toLocaleDateString('id-ID')}`}
          />
        ))
      }
    />
  );
}
