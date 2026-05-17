import { Redirect } from 'expo-router';
import { ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuthenticatedHome } from '../src/lib/navigation/role-routes';
import { useAuthStore } from '../src/store/authStore';
import { t } from '../src/i18n';

/**
 * Router root.
 * - Saat masih `loading`/`idle` → splash sederhana.
 * - `unauthenticated` → ke flow auth.
 * - `authenticated` → tab bar sesuai peran (warga/UMKM vs pemulung).
 */
export default function IndexRoute() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

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

  return <Redirect href={getAuthenticatedHome(user.role)} />;
}
