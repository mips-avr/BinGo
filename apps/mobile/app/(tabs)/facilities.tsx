import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { SkeletonList } from '../../src/components/ui/Skeleton';
import { useFacilities } from '../../src/features/pivot/hooks';
import { colors, screenStyles, spacing } from '../../src/theme';
export default function FacilitiesScreen() {
  const query = useFacilities();
  return <SafeAreaView style={styles.safe} edges={['top']}><ScrollView contentContainerStyle={styles.content}><Text style={screenStyles.screenTitle}>Jalur Setor</Text><Text style={styles.lead}>Temukan fasilitas yang menerima material Anda.</Text>{query.isLoading ? <SkeletonList /> : query.isError ? <ErrorState message="Fasilitas belum dapat dimuat" onRetry={() => query.refetch()} /> : query.data.map((facility: any) => <Card key={facility.id} style={styles.card}><View style={styles.row}><Text style={styles.title}>{facility.name}</Text>{facility.demo ? <Text style={styles.demo}>DEMO</Text> : null}</View><Text style={styles.body}>{facility.address}</Text><Text style={styles.meta}>{facility.materialRules.map((rule: any) => rule.material).join(', ')} • Diverifikasi {new Date(facility.verifiedAt).toLocaleDateString('id-ID')}</Text><Button label="Buka arah di Google Maps" variant="secondary" size="sm" style={{ marginTop: spacing.md }} onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lng}`)} /></Card>)}</ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.neutral50 }, content: { padding: spacing.lg, paddingBottom: 80 }, lead: { color: colors.neutral600, marginTop: spacing.xs, marginBottom: spacing.lg }, card: { marginBottom: spacing.md }, row: { flexDirection: 'row', alignItems: 'center' }, title: { flex: 1, fontSize: 17, fontWeight: '800', color: colors.neutral900 }, demo: { fontSize: 10, fontWeight: '800', color: colors.amber800, backgroundColor: colors.amber100, paddingHorizontal: 7, paddingVertical: 4 }, body: { fontSize: 14, color: colors.neutral700, marginTop: spacing.xs }, meta: { fontSize: 12, color: colors.neutral500, marginTop: spacing.xs } });
