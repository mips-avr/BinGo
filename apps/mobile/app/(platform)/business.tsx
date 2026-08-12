import { DataCard, DataListView } from '../../src/components/pivot/DataListView';
import { usePlatformOrganizations } from '../../src/features/pivot/hooks';
export default function Screen(){const q=usePlatformOrganizations();const query={...q,data:q.data?.filter((x:any)=>x.type==='BUSINESS')};return <DataListView title="Business" subtitle="Status verifikasi dan kesehatan organisasi pengolah." query={query} renderItems={(items)=>items.map((x:any)=><DataCard key={x.id} title={x.name} detail={x.status.replaceAll('_',' ')} meta={`${x._count.members} pengguna terdaftar`}/>)}/>}
