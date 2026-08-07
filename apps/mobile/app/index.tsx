import { Redirect } from 'expo-router';
import { ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuthenticatedHome } from '../src/lib/navigation/role-routes';
import { useAuthStore } from '../src/store/authStore';
import { t } from '../src/i18n';
import { colors, screenStyles, spacing } from '../src/theme';

/**
 * Router root — splash singkat lalu redirect ke login atau home.
 */
export default function IndexRoute() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  if (status === 'idle' || status === 'loading') {
    return (
      <SafeAreaView style={screenStyles.splash} edges={['top', 'bottom']}>
        <Text style={{ fontSize: 56 }} accessibilityElementsHidden>
          ♻️
        </Text>
        <Text style={screenStyles.brandTitle} accessibilityRole="header">
          {t.common.appName}
        </Text>
        <ActivityIndicator
          color={colors.bingo700}
          style={{ marginTop: spacing.xl }}
          accessibilityLabel={t.common.loadingLabel}
        />
        <Text style={screenStyles.splashText}>{t.common.loading}</Text>
      </SafeAreaView>
    );
  }

  if (status === 'unauthenticated' || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href={getAuthenticatedHome(user.role)} />;
}
