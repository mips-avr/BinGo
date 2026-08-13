import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import type { UserRole } from '@bingo/shared-types';
import { AuthPage } from '../../src/components/auth/AuthPage';
import { t } from '../../src/i18n';
import { colors, screenStyles, spacing, touch } from '../../src/theme';

interface RoleOption {
  role: UserRole;
  icon: string;
  label: string;
  description: string;
}

const ROLES: RoleOption[] = [
  {
    role: 'HOUSEHOLD',
    icon: '🏡',
    label: 'Warga',
    description: 'Kelola layanan, iuran, jalur setor, dan laporan lingkungan.',
  },
  {
    role: 'MANAGER_ADMIN',
    icon: '🏢',
    label: 'Pengelola',
    description: 'Ajukan organisasi dan kelola layanan persampahan wilayah.',
  },
  {
    role: 'BUSINESS_BUYER',
    icon: '♻️',
    label: 'Business/Pengolah',
    description: 'Ajukan usaha dan temukan pasokan material non-residu.',
  },
];

export default function RoleSelectScreen() {
  const router = useRouter();

  return (
    <AuthPage contentWidth={560}>
        <Text style={screenStyles.screenTitle} accessibilityRole="header">
          {t.auth.chooseRole}
        </Text>
        <Text style={screenStyles.bodyMuted}>{t.auth.roleIntro}</Text>

        <View style={screenStyles.roleList}>
          {ROLES.map((opt) => (
            <Pressable
              key={opt.role}
              testID={`role-${opt.role}`}
              onPress={() =>
                router.push({ pathname: '/(auth)/register', params: { role: opt.role } })
              }
              accessibilityRole="button"
              accessibilityLabel={`${opt.label}. ${opt.description}`}
              style={({ pressed }) => [screenStyles.roleCard, pressed ? { opacity: 0.92 } : null]}
            >
              <Text style={screenStyles.roleIcon}>{opt.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={screenStyles.roleCardTitle}>{opt.label}</Text>
                <Text style={screenStyles.roleCardDesc}>{opt.description}</Text>
              </View>
              <Text style={{ fontSize: 20, color: colors.bingo600, marginTop: 4 }}>›</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={() => router.replace('/(auth)/login')}
          accessibilityRole="button"
          accessibilityLabel={`${t.auth.haveAccount} ${t.auth.login}`}
          testID="go-to-login"
          style={{ marginTop: spacing.md, minHeight: touch.minTarget, justifyContent: 'center' }}
        >
          <Text style={[screenStyles.footerText, { textAlign: 'center' }]}>
            {t.auth.haveAccount} <Text style={screenStyles.footerLink}>{t.auth.login}</Text>
          </Text>
        </Pressable>
    </AuthPage>
  );
}
