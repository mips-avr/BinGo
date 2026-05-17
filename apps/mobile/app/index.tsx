import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { t } from '../src/i18n';
import { appConfig } from '../src/lib/config';

/**
 * Layar landing sementara (Phase 1).
 * Phase 2 akan menggantikannya dengan splash + redirect berdasarkan
 * status autentikasi & peran pengguna.
 */
export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bingo-50">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-4xl font-bold text-bingo-700">{t.common.appName}</Text>
        <Text className="mt-2 text-center text-base text-bingo-600">{t.common.tagline}</Text>
        <Text className="mt-8 text-sm text-neutral-500">API: {appConfig.apiBaseUrl}</Text>
        <Text className="mt-1 text-xs text-neutral-400">Phase 1 — Inisialisasi proyek</Text>
      </View>
    </SafeAreaView>
  );
}
