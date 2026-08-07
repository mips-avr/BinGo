import { Stack, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Button } from '../src/components/ui/Button';
import { getAuthenticatedHome } from '../src/lib/navigation/role-routes';
import { useAuthStore } from '../src/store/authStore';
import { colors, radius, spacing, typography } from '../src/theme';
import { t } from '../src/i18n';

/**
 * Rute cadangan expo-router.
 *
 * Tanpa berkas ini, tautan dalam (deep link) yang salah atau rute yang sudah
 * dipindahkan menampilkan layar bawaan expo-router berbahasa Inggris.
 */
export default function NotFoundScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  function goHome() {
    router.replace(user ? getAuthenticatedHome(user.role) : '/(auth)/login');
  }

  return (
    <>
      <Stack.Screen options={{ title: t.common.notFoundTitle, headerShown: false }} />
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.content}>
          <View style={s.iconCircle}>
            <Feather name="compass" size={28} color={colors.bingo700} />
          </View>
          <Text style={s.title} accessibilityRole="header">
            {t.common.notFoundTitle}
          </Text>
          <Text style={s.message}>{t.common.notFoundMessage}</Text>
          <Button
            label={t.common.backToHome}
            onPress={goHome}
            testID="not-found-home"
            style={s.button}
          />
        </View>
      </SafeAreaView>
    </>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    height: 72,
    width: 72,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bingo100,
  },
  title: {
    marginTop: spacing.md,
    textAlign: 'center',
    ...typography.screenTitle,
  },
  message: {
    marginTop: spacing.xs,
    textAlign: 'center',
    ...typography.bodyMuted,
  },
  button: {
    marginTop: spacing.xl,
    minWidth: 220,
  },
});
