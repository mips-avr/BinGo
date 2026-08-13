import { Link, useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { AuthPage } from '../../src/components/auth/AuthPage';
import { LoginForm } from '../../src/components/forms/LoginForm';
import { t } from '../../src/i18n';
import { screenStyles, spacing } from '../../src/theme';

/**
 * Layar masuk — ini bukan landing marketing, tapi entry utama setelah splash.
 * Memakai StyleSheet eksplisit agar teks & form selalu terlihat di device
 * (NativeWind kadang hanya menerapkan warna latar di beberapa setup Expo Go).
 */
export default function LoginScreen() {
  const router = useRouter();
  return (
    <AuthPage>
      <Text style={screenStyles.screenTitle} accessibilityRole="header">
        {t.auth.login}
      </Text>
      <Text style={[screenStyles.bodyMuted, { marginBottom: spacing.xl }]}>
        Gunakan akun sesuai peran Anda.
      </Text>
      <LoginForm onSuccess={() => router.replace('/')} />

      <View style={screenStyles.footerRow}>
        <Text style={screenStyles.footerText}>{t.auth.noAccount} </Text>
        <Link
          href="/(auth)/role-select"
          style={screenStyles.footerLink}
          accessibilityRole="link"
        >
          {t.auth.register}
        </Link>
      </View>
    </AuthPage>
  );
}
