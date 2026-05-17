import { Pressable, StyleSheet, View, type ViewProps } from 'react-native';
import { colors, shadow } from '../../theme/screen';

export interface CardProps extends ViewProps {
  onPress?: () => void;
  padded?: boolean;
}

export function Card({ children, onPress, padded = true, style, ...rest }: CardProps) {
  const baseStyle = [cardStyles.container, padded ? cardStyles.padded : null, style];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [...baseStyle, pressed ? cardStyles.pressed : null]}
        accessibilityRole="button"
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View style={baseStyle} {...rest}>
      {children}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral100,
    ...shadow(3),
  },
  padded: {
    padding: 16,
  },
  pressed: {
    opacity: 0.85,
  },
});
