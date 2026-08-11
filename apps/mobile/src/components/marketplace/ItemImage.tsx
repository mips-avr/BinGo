import { Image, StyleSheet, Text, View } from 'react-native';
import type { ImageStyle, StyleProp, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

/**
 * Gambar produk dengan cadangan yang dilukis di perangkat.
 *
 * Sebelumnya cadangan berupa URL ke layanan placeholder pihak ketiga, sehingga
 * setiap kartu produk tanpa gambar menembak jaringan keluar. Pada demo tanpa
 * internet — atau di lokasi juri dengan koneksi lambat — kartu tampil sebagai
 * kotak kosong. Cadangan sekarang murni lokal dan tidak pernah gagal dimuat.
 */
export function ItemImage({
  uri,
  label,
  height,
  style,
}: {
  uri: string | null;
  label: string;
  height: number;
  style?: StyleProp<ViewStyle & ImageStyle>;
}) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[{ height }, s.image, style as StyleProp<ImageStyle>]}
        resizeMode="cover"
      />
    );
  }
  const initials = label
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
  return (
    <View
      style={[{ height }, s.image, s.fallback, style as StyleProp<ViewStyle>]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
    >
      <View style={s.badge}>
        <Text style={s.badgeText}>{initials}</Text>
      </View>
      <Text style={s.caption} numberOfLines={1}>
        ♻️ BinGo
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  image: {
    width: '100%',
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    backgroundColor: colors.neutral200,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bingo100,
    gap: spacing.xs,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.bingo600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...typography.cardTitle,
    color: colors.white,
    fontSize: 20,
  },
  caption: {
    ...typography.caption,
    color: colors.bingo800,
    fontWeight: '700',
  },
});
