import { Pressable, View, type ViewProps } from 'react-native';

export interface CardProps extends ViewProps {
  onPress?: () => void;
  padded?: boolean;
}

export function Card({ children, onPress, padded = true, className = '', ...rest }: CardProps & { className?: string }) {
  const base = `rounded-2xl bg-white shadow-sm ${padded ? 'p-4' : ''} ${className}`;
  if (onPress) {
    return (
      <Pressable onPress={onPress} className={`${base} active:opacity-80`} accessibilityRole="button">
        {children}
      </Pressable>
    );
  }
  return (
    <View className={base} {...rest}>
      {children}
    </View>
  );
}
