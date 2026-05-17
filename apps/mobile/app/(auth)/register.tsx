import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { UserRole } from '@bingo/shared-types';
import { RegisterForm } from '../../src/components/forms/RegisterForm';
import { t } from '../../src/i18n';

const VALID_ROLES: UserRole[] = ['CITIZEN', 'WASTE_AGENT', 'MSME'];

export default function RegisterScreen() {
  const router = useRouter();
  const { role: roleParam } = useLocalSearchParams<{ role?: string }>();
  const role: UserRole = VALID_ROLES.includes(roleParam as UserRole)
    ? (roleParam as UserRole)
    : 'CITIZEN';

  return (
    <SafeAreaView className="flex-1 bg-bingo-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 48 }}>
          <Text className="text-2xl font-semibold text-neutral-900">{t.auth.register}</Text>
          <Text className="mt-1 mb-4 text-sm text-bingo-700">
            {t.auth.role[role]}
          </Text>

          <RegisterForm role={role} onSuccess={() => router.replace('/')} />

          <View className="mt-6 flex-row items-center justify-center">
            <Text className="text-sm text-neutral-600">Sudah punya akun? </Text>
            <Link href="/(auth)/login" className="text-sm font-semibold text-bingo-700">
              {t.auth.login}
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
