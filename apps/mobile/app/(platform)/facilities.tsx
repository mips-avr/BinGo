import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DataCard } from '../../src/components/pivot/DataListView';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import {
  useCreatePlatformFacility,
  useFacilities,
  useVerifyPlatformFacility,
} from '../../src/features/pivot/hooks';
import { extractApiErrorMessage } from '../../src/lib/api/client';
import { colors, screenStyles, spacing } from '../../src/theme';

export default function FacilitiesScreen() {
  const query = useFacilities();
  const create = useCreatePlatformFacility();
  const verify = useVerifyPlatformFacility();
  const [name, setName] = useState('Titik Setor Demo Baru');
  const [operatorName, setOperator] = useState('Operator Komunitas Demo');
  const [address, setAddress] = useState('Jakarta Timur');
  const [sourceUrl, setSource] = useState('https://lingkunganhidup.jakarta.go.id/');
  const [selectedId, setSelectedId] = useState('');
  async function submit() {
    await create.mutateAsync({
      name,
      operatorName,
      address,
      lat: -6.225,
      lng: 106.9,
      sourceUrl,
      openingNote: 'Konfirmasi jadwal sebelum berangkat',
      materials: ['ORGANIC', 'PAPER', 'PET'],
    });
    Alert.alert('Fasilitas dibuat', 'Entri baru sudah berlabel sumber dan tanggal verifikasi.');
  }
  async function submitVerification() {
    if (!selectedId) return Alert.alert('Pilih fasilitas', 'Pilih fasilitas yang sudah diperiksa.');
    await verify.mutateAsync({
      id: selectedId,
      sourceUrl,
      note: 'Diperiksa kembali oleh Admin BinGo Demo',
    });
    Alert.alert('Verifikasi diperbarui', 'Sumber dan waktu pemeriksaan terbaru telah disimpan.');
  }
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={screenStyles.screenTitle}>Fasilitas</Text>
      <Text style={styles.subtitle}>
        Kelola direktori lintas Pengelola dengan sumber dan tanggal pemeriksaan yang jelas.
      </Text>
      <Card style={styles.panel}>
        <Text style={styles.heading}>Tambah fasilitas</Text>
        <Input label="Nama fasilitas" value={name} onChangeText={setName} />
        <Input label="Operator" value={operatorName} onChangeText={setOperator} />
        <Input label="Alamat" value={address} onChangeText={setAddress} />
        <Input label="Sumber data" value={sourceUrl} keyboardType="url" onChangeText={setSource} />
        <Button
          label="Simpan fasilitas"
          loading={create.isPending}
          onPress={() =>
            submit().catch((error) => Alert.alert('Belum disimpan', extractApiErrorMessage(error)))
          }
        />
      </Card>
      <View style={styles.choices}>
        {query.data?.map((facility: any) => (
          <Button
            key={facility.id}
            size="sm"
            label={facility.name}
            variant={selectedId === facility.id ? 'primary' : 'secondary'}
            onPress={() => setSelectedId(facility.id)}
          />
        ))}
      </View>
      {selectedId ? (
        <Button
          label="Verifikasi fasilitas terpilih"
          loading={verify.isPending}
          onPress={() =>
            submitVerification().catch((error) =>
              Alert.alert('Belum diverifikasi', extractApiErrorMessage(error)),
            )
          }
        />
      ) : null}
      <Text style={[styles.heading, { marginTop: spacing.xl }]}>Direktori aktif</Text>
      {query.data?.map((facility: any) => (
        <DataCard
          key={facility.id}
          title={facility.name}
          detail={facility.operatorName}
          meta={`Verifikasi ${new Date(facility.verifiedAt).toLocaleDateString('id-ID')}`}
        />
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    paddingBottom: 100,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  subtitle: { color: colors.neutral600, marginTop: spacing.xs, marginBottom: spacing.xl },
  panel: { marginBottom: spacing.xl },
  heading: { fontSize: 18, fontWeight: '800', color: colors.neutral900, marginBottom: spacing.md },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
});
