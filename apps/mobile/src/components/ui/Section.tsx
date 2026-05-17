import { Pressable, Text, View } from 'react-native';

export interface SectionProps {
  title: string;
  action?: { label: string; onPress: () => void };
  children: React.ReactNode;
}

export function Section({ title, action, children }: SectionProps) {
  return (
    <View className="mb-6">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base font-bold text-neutral-900">{title}</Text>
        {action ? (
          <Pressable onPress={action.onPress} accessibilityRole="button">
            <Text className="text-sm font-semibold text-bingo-700">{action.label}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}
