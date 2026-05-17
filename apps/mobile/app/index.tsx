import { Redirect } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/authStore';
import { t } from '../src/i18n';

/**
 * Routing root. Setelah hydrate selesai:
 * - `unauthenticated` → arahkan ke layar masuk.
 * - `authenticated`   → tampilkan beranda sementara (Phase 4 akan
 *   menggantikannya dengan tab navigator per peran).
 */
export default function IndexRoute() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  if (status === 'idle' || status === 'loading') {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bingo-50">
        <ActivityIndicator color="#15803D" />
        <Text className="mt-3 text-sm text-bingo-700">{t.common.loading}</Text>
      </SafeAreaView>
    );
  }

  if (status === 'unauthenticated' || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-bingo-50">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-3xl font-bold text-bingo-700">
          Halo, {user.name.split(' ')[0]}!
        </Text>
        <Text className="mt-2 text-base text-bingo-600">
          Peran: {t.auth.role[user.role]}
        </Text>
        <Text className="mt-1 text-sm text-neutral-500">{user.phone}</Text>
        <Text className="mt-4 text-sm text-neutral-500">
          {t.points.label}: {user.pointsBalance}
        </Text>

        <Pressable
          onPress={logout}
          className="mt-10 rounded-xl border border-bingo-600 bg-white px-6 py-3"
        >
          <Text className="font-semibold text-bingo-700">{t.auth.logout}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
