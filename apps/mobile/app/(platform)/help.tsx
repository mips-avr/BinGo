import { ScrollView, StyleSheet, Text } from 'react-native';
import { Card } from '../../src/components/ui/Card';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { colors, screenStyles, spacing } from '../../src/theme';

export default function PlatformHelpScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={screenStyles.screenTitle}>Bantuan</Text>
      <Text style={styles.subtitle}>Pantau permintaan bantuan akun dan organisasi.</Text>
      <Card>
        <EmptyState
          title="Belum ada permintaan bantuan"
          message="Permintaan baru akan tampil di sini saat dikirim oleh pemilik organisasi."
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 960, alignSelf: 'center', padding: spacing.xl, paddingBottom: 100 },
  subtitle: { marginTop: spacing.xs, marginBottom: spacing.xl, color: colors.neutral600, fontSize: 15 },
});
