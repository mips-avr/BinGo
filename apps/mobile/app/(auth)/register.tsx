import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import type { UserRole } from '@bingo/shared-types';
import { AuthPage } from '../../src/components/auth/AuthPage';
import { RegisterForm } from '../../src/components/forms/RegisterForm';
import { t } from '../../src/i18n';
import { colors, screenStyles, spacing } from '../../src/theme';

const VALID_ROLES: UserRole[] = ['HOUSEHOLD', 'MANAGER_ADMIN', 'BUSINESS_BUYER'];

const ROLE_ICON: Record<UserRole, string> = {
  CITIZEN: '🏡',
  WASTE_AGENT: '🚚',
  MSME: '🏪',
  PLATFORM_ADMIN: '🛡️',
  MANAGER_ADMIN: '🏢',
  MANAGER_OPERATOR: '🏢',
  COLLECTOR: '🚚',
  HOUSEHOLD: '🏡',
  BUSINESS_BUYER: '♻️',
};

export default function RegisterScreen() {
  const router = useRouter();
  const { role: roleParam } = useLocalSearchParams<{ role?: string }>();
  const role: UserRole = VALID_ROLES.includes(roleParam as UserRole)
    ? (roleParam as UserRole)
    : 'HOUSEHOLD';

  return (
    <AuthPage contentWidth={500}>
          <Pressable
            onPress={() => router.back()}
            style={screenStyles.backRow}
            accessibilityRole="button"
            accessibilityLabel={t.auth.changeRole}
            testID="register-back"
          >
            <Text style={{ fontSize: 18, color: colors.bingo700 }}>←</Text>
            <Text style={screenStyles.backText}>{t.auth.changeRole}</Text>
          </Pressable>

          <Text style={{ fontSize: 40, marginBottom: spacing.xs }}>{ROLE_ICON[role]}</Text>
          <Text style={screenStyles.screenTitle} accessibilityRole="header">
            {t.auth.register}
          </Text>
          <Text style={screenStyles.screenSubtitle}>
            {role === 'HOUSEHOLD'
              ? 'Warga'
              : role === 'MANAGER_ADMIN'
                ? 'Pengelola'
                : 'Business/Pengolah'}
          </Text>

          <RegisterForm role={role} onSuccess={() => router.replace('/')} />

          <View style={screenStyles.footerRow}>
            <Text style={screenStyles.footerText}>{t.auth.haveAccount} </Text>
            <Link href="/(auth)/login" style={screenStyles.footerLink} accessibilityRole="link">
              {t.auth.login}
            </Link>
          </View>
    </AuthPage>
  );
}
