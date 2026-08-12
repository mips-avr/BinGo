import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { readEncryptedQueue, synchronizeEncryptedQueue } from '../../src/features/offline/encryptedQueue';
import { syncQueuedDeviceEvent } from '../../src/features/pivot/api';
import { screenStyles, spacing } from '../../src/theme';

export default function Screen(){
  const [count,setCount]=useState(0); const [syncing,setSyncing]=useState(false);
  const refresh=()=>readEncryptedQueue().then((items)=>setCount(items.length));
  useEffect(()=>{refresh()},[]);
  return <ScrollView contentContainerStyle={styles.root}><Text style={screenStyles.screenTitle}>Riwayat Sinkronisasi</Text><Text style={styles.body}>Aktivitas offline disimpan terenkripsi pada perangkat. Event yang diterima atau duplikat akan dikeluarkan dari antrean.</Text><Card><Text style={styles.count}>{count}</Text><Text style={styles.body}>event menunggu sinkronisasi</Text></Card><Button label="Sinkronkan sekarang" disabled={!count} loading={syncing} onPress={async()=>{setSyncing(true);const result=await synchronizeEncryptedQueue(syncQueuedDeviceEvent);setSyncing(false);await refresh();Alert.alert('Sinkronisasi selesai',`${result.accepted} diterima, ${result.duplicate} duplikat, ${result.rejected} ditolak, ${result.remaining} tersisa.`)}} style={{marginTop:spacing.md}}/></ScrollView>;
}
const styles=StyleSheet.create({root:{padding:spacing.lg},body:{fontSize:15,lineHeight:22,marginVertical:spacing.md},count:{fontSize:32,fontWeight:'900'}});
