import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { UserRole } from '@bingo/shared-types';
import { t } from '../../src/i18n';

interface RoleOption {
  role: UserRole;
  label: string;
  description: string;
}

const ROLES: RoleOption[] = [
  {
    role: 'CITIZEN',
    label: t.auth.role.CITIZEN,
    description: 'Pindai sampah, ajukan penjemputan, dan laporkan pembuangan ilegal.',
  },
  {
    role: 'WASTE_AGENT',
    label: t.auth.role.WASTE_AGENT,
    description: 'Temukan permintaan penjemputan terdekat & kumpulkan pendapatan.',
  },
  {
    role: 'MSME',
    label: t.auth.role.MSME,
    description: 'Akses katalog kemasan ramah lingkungan di WasteMart.',
  },
];

export default function RoleSelectScreen() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-bingo-50">
      <View className="flex-1 px-6 pt-12">
        <Text className="text-2xl font-bold text-neutral-900">{t.auth.chooseRole}</Text>
        <Text className="mt-1 text-sm text-neutral-600">
          Pilih peran Anda untuk melanjutkan pendaftaran.
        </Text>

        <View className="mt-6">
          {ROLES.map((opt) => (
            <Pressable
              key={opt.role}
              testID={`role-${opt.role}`}
              onPress={() =>
                router.push({ pathname: '/(auth)/register', params: { role: opt.role } })
              }
              className="mb-3 rounded-2xl border border-bingo-100 bg-white p-4 active:bg-bingo-50"
            >
              <Text className="text-lg font-semibold text-bingo-700">{opt.label}</Text>
              <Text className="mt-1 text-sm text-neutral-600">{opt.description}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
