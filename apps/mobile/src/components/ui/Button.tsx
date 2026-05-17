import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { colors } from '../../theme/screen';

type Variant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: Variant;
  loading?: boolean;
  testID?: string;
}

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  testID,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const containerStyle =
    variant === 'primary'
      ? buttonStyles.primary
      : variant === 'secondary'
        ? buttonStyles.secondary
        : buttonStyles.ghost;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      testID={testID}
      disabled={isDisabled}
      style={({ pressed }) => [
        buttonStyles.base,
        containerStyle,
        isDisabled ? buttonStyles.disabled : null,
        pressed && !isDisabled ? buttonStyles.pressed : null,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.neutral900 : colors.bingo700} />
      ) : (
        <Text
          style={[
            buttonStyles.label,
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
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 8,
    minHeight: 50,
  },
  primary: { backgroundColor: colors.bingo500 },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.bingo600,
  },
  ghost: { backgroundColor: 'transparent', marginTop: 0 },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.55 },
  label: { fontSize: 16, fontWeight: '700' },
  labelOnPrimary: { color: colors.neutral900 },
  labelOnLight: { color: colors.bingo700 },
});
