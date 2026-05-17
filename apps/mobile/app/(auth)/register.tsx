import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { UserRole } from '@bingo/shared-types';
import { RegisterForm } from '../../src/components/forms/RegisterForm';
import { t } from '../../src/i18n';
import { colors, screenStyles } from '../../src/theme/screen';

const VALID_ROLES: UserRole[] = ['CITIZEN', 'WASTE_AGENT', 'MSME'];

const ROLE_ICON: Record<UserRole, string> = {
  CITIZEN: '🏡',
  WASTE_AGENT: '🚚',
  MSME: '🏪',
};

export default function RegisterScreen() {
  const router = useRouter();
  const { role: roleParam } = useLocalSearchParams<{ role?: string }>();
  const role: UserRole = VALID_ROLES.includes(roleParam as UserRole)
    ? (roleParam as UserRole)
    : 'CITIZEN';

  return (
    <SafeAreaView style={screenStyles.safeRoot}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={screenStyles.scrollContentForm}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={() => router.back()}
            style={screenStyles.backRow}
            accessibilityRole="button"
            accessibilityLabel="Kembali"
          >
            <Text style={{ fontSize: 18, color: colors.bingo700 }}>←</Text>
            <Text style={screenStyles.backText}>Ganti peran</Text>
          </Pressable>

          <Text style={{ fontSize: 40, marginBottom: 8 }}>{ROLE_ICON[role]}</Text>
          <Text style={screenStyles.screenTitle}>{t.auth.register}</Text>
          <Text style={screenStyles.screenSubtitle}>{t.auth.role[role]}</Text>

          <RegisterForm role={role} onSuccess={() => router.replace('/')} />

          <View style={screenStyles.footerRow}>
            <Text style={screenStyles.footerText}>Sudah punya akun? </Text>
            <Link href="/(auth)/login" style={screenStyles.footerLink}>
              {t.auth.login}
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
