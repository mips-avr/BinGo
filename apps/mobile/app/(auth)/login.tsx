import { Link, useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoginForm } from '../../src/components/forms/LoginForm';
import { KeyboardAvoider } from '../../src/components/ui/KeyboardAvoider';
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
    // `edges` eksplisit — 30 layar lain menyebutkannya, dua layar auth tidak.
    <SafeAreaView style={screenStyles.safeRoot} edges={['top', 'bottom']}>
      <KeyboardAvoider>
        <ScrollView
          contentContainerStyle={screenStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Text
            style={{ fontSize: 48, marginBottom: spacing.xs }}
            accessibilityLabel={t.common.appName}
          >
            ♻️
          </Text>
          <View style={{ marginBottom: spacing.xxl }}>
            <Text style={screenStyles.brandTitle} accessibilityRole="header">
              {t.common.appName}
            </Text>
            <Text style={screenStyles.brandTagline}>{t.common.tagline}</Text>
          </View>

          <Text style={screenStyles.screenTitle} accessibilityRole="header">
            {t.auth.login}
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
        </ScrollView>
      </KeyboardAvoider>
    </SafeAreaView>
  );
}
