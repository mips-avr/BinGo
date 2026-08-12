import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DataCard } from '../../src/components/pivot/DataListView';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import {
  useCreateCollectionRoute,
  useCreateCollectionRun,
  useManagerOperations,
} from '../../src/features/pivot/hooks';
import { extractApiErrorMessage } from '../../src/lib/api/client';
import { colors, screenStyles, spacing } from '../../src/theme';

export default function RoutesScreen() {
  const query = useManagerOperations();
  const createRoute = useCreateCollectionRoute();
  const createRun = useCreateCollectionRun();
  const [routeName, setRouteName] = useState('Rute Pagi Demo');
  const [stops, setStops] = useState('Jalan Melati No. 1\nJalan Melati No. 3');
  const [routeId, setRouteId] = useState('');
  const [collectorId, setCollectorId] = useState('');
  const [scheduledFor, setScheduledFor] = useState(
    new Date(Date.now() + 86_400_000).toISOString().slice(0, 16),
  );
  const data = query.data;
  const selectedRoute = useMemo(
    () => data?.routes?.find((item: any) => item.id === routeId) ?? data?.routes?.[0],
    [data?.routes, routeId],
  );
  const selectedCollector = useMemo(
    () => data?.collectors?.find((item: any) => item.id === collectorId) ?? data?.collectors?.[0],
    [collectorId, data?.collectors],
  );

  async function saveRoute() {
    const area = data?.areas?.find((item: any) => item.status === 'ACTIVE');
    if (!area) return Alert.alert('Wilayah belum tersedia', 'Aktifkan wilayah layanan dahulu.');
    const result = await createRoute.mutateAsync({
      serviceAreaId: area.id,
      name: routeName,
      stops: stops
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
    });
    setRouteId(result.id);
    Alert.alert('Rute tersimpan', `${result.stops.length} titik siap dijadwalkan.`);
  }

  async function scheduleRun() {
    if (!selectedRoute || !selectedCollector)
      return Alert.alert('Data belum lengkap', 'Pilih rute dan Petugas terlebih dahulu.');
    await createRun.mutateAsync({
      routeId: selectedRoute.id,
      collectorId: selectedCollector.id,
      vehicleId: data?.vehicles?.[0]?.id,
      scheduledFor: new Date(scheduledFor).toISOString(),
    });
    Alert.alert('Tugas dijadwalkan', 'Tugas baru sudah tersedia untuk Petugas.');
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={screenStyles.screenTitle}>Kalender dan Rute</Text>
      <Text style={styles.subtitle}>
        Susun titik pengambilan, pilih Petugas, lalu terbitkan tugas.
      </Text>
      <Card style={styles.panel}>
        <Text style={styles.heading}>1. Buat rute</Text>
        <Input label="Nama rute" value={routeName} onChangeText={setRouteName} />
        <Input
          label="Alamat titik, satu per baris"
          value={stops}
          onChangeText={setStops}
          multiline
          numberOfLines={4}
        />
        <Button
          label="Simpan rute"
          loading={createRoute.isPending}
          onPress={() =>
            saveRoute().catch((error) =>
              Alert.alert('Belum tersimpan', extractApiErrorMessage(error)),
            )
          }
        />
      </Card>
      <Card style={styles.panel}>
        <Text style={styles.heading}>2. Jadwalkan pengambilan</Text>
        <Text style={styles.label}>Pilih rute</Text>
        <View style={styles.choices}>
          {data?.routes?.map((route: any) => (
            <Button
              key={route.id}
              size="sm"
              label={route.name}
              variant={selectedRoute?.id === route.id ? 'primary' : 'secondary'}
              onPress={() => setRouteId(route.id)}
            />
          ))}
        </View>
        <Text style={styles.label}>Pilih Petugas</Text>
        <View style={styles.choices}>
          {data?.collectors?.map((collector: any) => (
            <Button
              key={collector.id}
              size="sm"
              label={collector.user.name}
              variant={selectedCollector?.id === collector.id ? 'primary' : 'secondary'}
              onPress={() => setCollectorId(collector.id)}
            />
          ))}
        </View>
        <Input
          label="Waktu pengambilan"
          value={scheduledFor}
          onChangeText={setScheduledFor}
          placeholder="2026-08-13T07:00"
        />
        <Button
          label="Terbitkan tugas"
          loading={createRun.isPending}
          onPress={() =>
            scheduleRun().catch((error) =>
              Alert.alert('Belum terjadwal', extractApiErrorMessage(error)),
            )
          }
        />
      </Card>
      <Text style={styles.heading}>Tugas terbaru</Text>
      {data?.runs?.map((run: any) => (
        <DataCard
          key={run.id}
          title={run.route.name}
          detail={run.assignments.map((item: any) => item.collector.user.name).join(', ')}
          meta={`${run.status.replaceAll('_', ' ')} • ${new Date(run.scheduledFor).toLocaleString('id-ID')}`}
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
  subtitle: {
    color: colors.neutral600,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    fontSize: 15,
  },
  panel: { marginBottom: spacing.xl },
  heading: { fontSize: 18, fontWeight: '800', color: colors.neutral900, marginBottom: spacing.md },
  label: { fontSize: 14, fontWeight: '700', color: colors.neutral700, marginBottom: spacing.sm },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
});
