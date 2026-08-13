import { useState } from 'react';
import { Pressable, StyleSheet, View, type ViewProps } from 'react-native';
import { colors, radius, spacing, shadow } from '../../theme';

export interface CardProps extends ViewProps {
  onPress?: () => void;
  padded?: boolean;
}

export function Card({
  children,
  onPress,
  padded = true,
  style,
  accessibilityRole,
  ...rest
}: CardProps) {
  const [hovered, setHovered] = useState(false);
  const baseStyle = [cardStyles.container, padded ? cardStyles.padded : null, style];

  if (onPress) {
    return (
      // `{...rest}` wajib diteruskan di cabang ini: tanpa itu `testID` dan
      // `accessibilityLabel` diam-diam hilang pada setiap kartu yang bisa ditekan.
      <Pressable
        onPress={onPress}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={({ pressed }) => [
          ...baseStyle,
          hovered ? cardStyles.hovered : null,
          pressed ? cardStyles.pressed : null,
        ]}
        accessibilityRole={accessibilityRole ?? 'button'}
        {...rest}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View style={baseStyle} accessibilityRole={accessibilityRole} {...rest}>
      {children}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral100,
    ...shadow(3),
  },
  padded: {
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
  hovered: {
    borderColor: colors.bingo200,
    transform: [{ translateY: -1 }],
    cursor: 'pointer',
  },
});
