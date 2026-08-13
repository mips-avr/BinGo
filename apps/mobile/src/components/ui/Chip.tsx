import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, touch } from '../../theme';

export interface ChipProps {
  label: string;
  /** Keterangan kecil di bawah label (mis. penanda "tidak dibeli"). */
  caption?: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Chip pilihan tunggal — dipakai pemilih material, pemilih grade, filter radius,
 * dan filter jendela waktu papan harga.
 *
 * Sebelumnya keempatnya menulis geometri sendiri-sendiri (33px, 29px, 44px) dan
 * salah satunya bahkan memakai `<Text onPress>` dengan border, yang dirender
 * tidak konsisten di Android. Satu komponen membuat tinggi sentuh selalu ≥44dp.
 *
 * Status terpilih ditandai warna DAN ikon centang — pengguna sasaran BinGo
 * banyak yang memakai layar murah dengan kontras rendah, jadi warna saja tidak
 * cukup sebagai penanda.
 */
export function Chip({
  label,
  caption,
  selected = false,
  disabled = false,
  onPress,
  accessibilityLabel,
  testID,
  style,
}: ChipProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={accessibilityLabel ?? label}
      testID={testID}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        chipStyles.base,
        selected ? chipStyles.selected : chipStyles.idle,
        disabled ? chipStyles.disabled : null,
        hovered && !disabled && !selected ? chipStyles.hovered : null,
        pressed && !disabled ? chipStyles.pressed : null,
        style,
      ]}
    >
      <View style={chipStyles.row}>
        {selected ? (
          <Feather name="check" size={14} color={colors.white} style={chipStyles.check} />
        ) : null}
        <View style={chipStyles.labelWrap}>
          <Text
            style={[chipStyles.label, selected ? chipStyles.labelSelected : chipStyles.labelIdle]}
          >
            {label}
          </Text>
          {caption ? (
            <Text style={[chipStyles.caption, selected ? chipStyles.captionSelected : null]}>
              {caption}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const chipStyles = StyleSheet.create({
  base: {
    marginRight: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: touch.minTarget,
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  check: { marginRight: spacing.xxs },
  labelWrap: { flexShrink: 1 },
  selected: { borderColor: colors.bingo600, backgroundColor: colors.bingo600 },
  idle: { borderColor: colors.neutral300, backgroundColor: colors.white },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  hovered: { borderColor: colors.bingo600, backgroundColor: colors.bingo100, cursor: 'pointer' },
  label: { fontSize: 14 },
  labelSelected: { fontWeight: '700', color: colors.white },
  labelIdle: { fontWeight: '500', color: colors.neutral800 },
  caption: { marginTop: 2, fontSize: 10, color: colors.amber700 },
  captionSelected: { color: colors.white },
});
