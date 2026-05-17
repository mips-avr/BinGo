import { Text, View } from 'react-native';

export interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: string;
}

/** State kosong yang ramah; tetap simpel tanpa ilustrasi agar bundle ringan. */
export function EmptyState({ title, message, icon = '🌱' }: EmptyStateProps) {
  return (
    <View className="items-center justify-center px-6 py-10">
      <Text className="text-5xl">{icon}</Text>
      <Text className="mt-3 text-center text-base font-semibold text-neutral-800">{title}</Text>
      {message ? (
        <Text className="mt-1 text-center text-sm text-neutral-500">{message}</Text>
      ) : null}
    </View>
  );
}
