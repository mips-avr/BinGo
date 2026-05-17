import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: Variant;
  loading?: boolean;
  testID?: string;
}

const containerByVariant: Record<Variant, string> = {
  primary: 'bg-bingo-600 active:bg-bingo-700',
  secondary: 'bg-white border border-bingo-600 active:bg-bingo-50',
  ghost: 'bg-transparent',
};

const labelByVariant: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-bingo-700',
  ghost: 'text-bingo-700',
};

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  testID,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      testID={testID}
      disabled={isDisabled}
      className={`flex-row items-center justify-center rounded-xl px-4 py-3 ${
        containerByVariant[variant]
      } ${isDisabled ? 'opacity-60' : ''}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#15803D'} />
      ) : (
        <Text className={`text-base font-semibold ${labelByVariant[variant]}`}>{label}</Text>
      )}
    </Pressable>
  );
}
