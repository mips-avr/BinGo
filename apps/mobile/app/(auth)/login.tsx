import { Link, useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoginForm } from '../../src/components/forms/LoginForm';
import { t } from '../../src/i18n';

export default function LoginScreen() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-bingo-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}>
          <View className="mb-8">
            <Text className="text-3xl font-bold text-bingo-700">{t.common.appName}</Text>
            <Text className="mt-1 text-sm text-bingo-600">{t.common.tagline}</Text>
          </View>

          <Text className="mb-4 text-2xl font-semibold text-neutral-900">{t.auth.login}</Text>
          <LoginForm onSuccess={() => router.replace('/')} />

          <View className="mt-6 flex-row items-center justify-center">
            <Text className="text-sm text-neutral-600">Belum punya akun? </Text>
            <Link href="/(auth)/role-select" className="text-sm font-semibold text-bingo-700">
              {t.auth.register}
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
