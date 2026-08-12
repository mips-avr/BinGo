import { Alert, Text, View } from 'react-native';
import { Button } from '../../src/components/ui/Button';
import { DataCard, DataListView } from '../../src/components/pivot/DataListView';
import { useOrganizationStatus, usePlatformOrganizations } from '../../src/features/pivot/hooks';

export default function Screen(){
  const query=usePlatformOrganizations(); const mutation=useOrganizationStatus();
  return <DataListView title="Organisasi" subtitle="Suspensi menghentikan transaksi baru tanpa menghapus riwayat." query={query} renderItems={(items)=>items.map((item:any)=><DataCard key={item.id} title={item.name} detail={`${item.type} • ${item.status.replaceAll('_',' ')}`} meta={`${item._count.members} anggota • ${item._count.facilities} fasilitas`} trailing={<View style={{gap:6}}>{item.status==='SUSPENDED'?<Button size="sm" label="Aktifkan kembali" onPress={()=>mutation.mutate({id:item.id,action:'reactivate'})}/>:item.status==='ACTIVE'?<Button size="sm" variant="secondary" label="Suspend" onPress={()=>Alert.alert('Suspend organisasi','Transaksi baru akan diblokir. Riwayat tetap tersimpan.',[{text:'Batal',style:'cancel'},{text:'Suspend',style:'destructive',onPress:()=>mutation.mutate({id:item.id,action:'suspend',reason:'Pemeriksaan kepatuhan platform pada mode demo'})}])}/>:<Text>{item.status}</Text>}</View>}/>)}/>;
}
