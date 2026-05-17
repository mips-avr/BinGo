import { Link, useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoginForm } from '../../src/components/forms/LoginForm';
import { t } from '../../src/i18n';
import { screenStyles } from '../../src/theme/screen';

/**
 * Layar masuk — ini bukan landing marketing, tapi entry utama setelah splash.
 * Memakai StyleSheet eksplisit agar teks & form selalu terlihat di device
 * (NativeWind kadang hanya menerapkan warna latar di beberapa setup Expo Go).
 */
export default function LoginScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={screenStyles.safeRoot}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={screenStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ fontSize: 48, marginBottom: 8 }} accessibilityLabel="BinGo">
            ♻️
          </Text>
          <View style={{ marginBottom: 32 }}>
            <Text style={screenStyles.brandTitle}>{t.common.appName}</Text>
            <Text style={screenStyles.brandTagline}>{t.common.tagline}</Text>
          </View>

          <Text style={screenStyles.screenTitle}>{t.auth.login}</Text>
          <LoginForm onSuccess={() => router.replace('/')} />

          <View style={screenStyles.footerRow}>
            <Text style={screenStyles.footerText}>Belum punya akun? </Text>
            <Link href="/(auth)/role-select" style={screenStyles.footerLink}>
              {t.auth.register}
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
