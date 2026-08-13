import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../../theme';

export function ReportPhoto({ uri, compact = false }: { uri?: string | null; compact?: boolean }) {
  if (!uri) return <Text style={styles.missing}>Foto tidak tersedia</Text>;
  return (
    <View style={[styles.frame, compact ? styles.compact : styles.full]}>
      <Image
        source={{ uri }}
        resizeMode="cover"
        style={styles.image}
        accessibilityLabel="Foto laporan"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', borderRadius: radius.sm, backgroundColor: colors.neutral100 },
  compact: { width: 72, height: 52 },
  full: { width: '100%', aspectRatio: 16 / 9, marginBottom: 16 },
  image: { width: '100%', height: '100%' },
  missing: { color: colors.neutral500, fontSize: 13 },
});
