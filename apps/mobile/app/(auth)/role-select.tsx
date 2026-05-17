import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { UserRole } from '@bingo/shared-types';
import { t } from '../../src/i18n';
import { colors, screenStyles } from '../../src/theme/screen';

interface RoleOption {
  role: UserRole;
  icon: string;
  label: string;
  description: string;
}

const ROLES: RoleOption[] = [
  {
    role: 'CITIZEN',
    icon: '🏡',
    label: t.auth.role.CITIZEN,
    description: 'Pindai sampah, ajukan penjemputan, dan laporkan pembuangan ilegal.',
  },
  {
    role: 'WASTE_AGENT',
    icon: '🚚',
    label: t.auth.role.WASTE_AGENT,
    description: 'Temukan permintaan penjemputan terdekat & kumpulkan pendapatan.',
  },
  {
    role: 'MSME',
    icon: '🏪',
    label: t.auth.role.MSME,
    description: 'Akses katalog kemasan ramah lingkungan di WasteMart.',
  },
];

export default function RoleSelectScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={screenStyles.safeRoot}>
      <ScrollView contentContainerStyle={screenStyles.scrollContentForm} keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 48, marginBottom: 8 }}>♻️</Text>
        <Text style={screenStyles.screenTitle}>{t.auth.chooseRole}</Text>
        <Text style={screenStyles.bodyMuted}>Pilih peran Anda untuk melanjutkan pendaftaran.</Text>

        <View style={screenStyles.roleList}>
          {ROLES.map((opt) => (
            <Pressable
              key={opt.role}
              testID={`role-${opt.role}`}
              onPress={() =>
                router.push({ pathname: '/(auth)/register', params: { role: opt.role } })
              }
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

        <Pressable onPress={() => router.replace('/(auth)/login')} style={{ marginTop: 16 }}>
          <Text style={[screenStyles.footerText, { textAlign: 'center' }]}>
            Sudah punya akun?{' '}
            <Text style={screenStyles.footerLink}>{t.auth.login}</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
