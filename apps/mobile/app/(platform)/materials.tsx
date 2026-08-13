import { ScrollView, StyleSheet, Text } from 'react-native';
import { DataCard } from '../../src/components/pivot/DataListView';
import { colors, screenStyles, spacing } from '../../src/theme';

const categories = [
  ['ORGANIC', 'Sisa makanan, daun, dan bahan organik yang dapat diolah.'],
  ['PAPER', 'Kertas dan kardus yang bersih serta kering.'],
  ['PET', 'Kemasan plastik PET yang sudah dikosongkan.'],
  ['HDPE', 'Kemasan plastik HDPE dengan tutup dipisahkan bila diperlukan.'],
  ['METAL', 'Kaleng dan logam tanpa isi berbahaya.'],
  ['GLASS', 'Kaca utuh atau pecah yang dikemas aman.'],
] as const;

export default function MaterialCategoriesScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={screenStyles.screenTitle}>Kategori Material</Text>
      <Text style={styles.subtitle}>Referensi kategori yang dipakai pada timbang, inventory, dan marketplace.</Text>
      {categories.map(([name, description]) => (
        <DataCard key={name} title={name} detail={description} meta="Aktif pada lingkungan Demo" />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 960, alignSelf: 'center', padding: spacing.xl, paddingBottom: 100 },
  subtitle: { marginTop: spacing.xs, marginBottom: spacing.xl, color: colors.neutral600, fontSize: 15, lineHeight: 21 },
});
