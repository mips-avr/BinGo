import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radius, spacing, touch } from '../../theme';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'sm';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  testID?: string;
  /** Margin/lebar dari pemanggil. Digabung terakhir sehingga selalu menang. */
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  testID,
  style,
  accessibilityLabel,
  onHoverIn,
  onHoverOut,
  ...rest
}: ButtonProps) {
  const isDisabled = Boolean(disabled || loading);
  const [hovered, setHovered] = useState(false);
  const containerStyle =
    variant === 'primary'
      ? buttonStyles.primary
      : variant === 'secondary'
        ? buttonStyles.secondary
        : buttonStyles.ghost;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      testID={testID}
      disabled={isDisabled}
      onHoverIn={(event) => {
        setHovered(true);
        onHoverIn?.(event);
      }}
      onHoverOut={(event) => {
        setHovered(false);
        onHoverOut?.(event);
      }}
      style={({ pressed }) => [
        buttonStyles.base,
        size === 'sm' ? buttonStyles.sizeSm : buttonStyles.sizeMd,
        containerStyle,
        isDisabled ? buttonStyles.disabled : null,
        hovered && !isDisabled ? buttonStyles.hovered : null,
        pressed && !isDisabled ? buttonStyles.pressed : null,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.white : colors.bingo700} />
      ) : (
        <Text
          numberOfLines={1}
          style={[
            buttonStyles.label,
            size === 'sm' ? buttonStyles.labelSm : null,
            variant === 'primary' ? buttonStyles.labelOnPrimary : buttonStyles.labelOnLight,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const buttonStyles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    // Sengaja tanpa `marginTop` bawaan: jarak adalah urusan tata letak
    // pemanggil. Margin bawaan dulu memaksa pemanggil membungkus tombol dengan
    // View kosong hanya untuk menetralkannya.
  },
  sizeMd: {
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    minHeight: 50,
  },
  sizeSm: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: touch.minTarget,
    borderRadius: radius.lg,
  },
  /**
   * Primer memakai bingo600 + teks putih, sama seperti seluruh permukaan primer
   * lain di aplikasi (kartu poin warga, tombol aksi pemulung). Kombinasi lama
   * bingo500 + teks neutral900 adalah satu-satunya yang berbeda sendiri.
   */
  primary: { backgroundColor: colors.bingo600 },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.bingo600,
  },
  ghost: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.88 },
  hovered: { opacity: 0.94, transform: [{ translateY: -1 }], cursor: 'pointer' },
  disabled: { opacity: 0.55 },
  label: { fontSize: 16, fontWeight: '700' },
  labelSm: { fontSize: 14 },
  labelOnPrimary: { color: colors.white },
  labelOnLight: { color: colors.bingo700 },
});
