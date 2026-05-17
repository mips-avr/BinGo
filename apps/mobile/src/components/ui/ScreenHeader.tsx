import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  canGoBack?: boolean;
  trailing?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, canGoBack = true, trailing }: ScreenHeaderProps) {
  const router = useRouter();
  return (
    <View className="flex-row items-center justify-between px-5 py-4">
      <View className="flex-1 flex-row items-center">
        {canGoBack ? (
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Kembali"
            className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-white"
          >
            <Text className="text-xl text-bingo-700">‹</Text>
          </Pressable>
        ) : null}
        <View className="flex-1">
          <Text className="text-xl font-bold text-neutral-900" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text className="text-sm text-neutral-500" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {trailing ? <View className="ml-3">{trailing}</View> : null}
    </View>
  );
}
