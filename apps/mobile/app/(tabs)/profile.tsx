import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { PointsBadge } from '../../src/components/ui/PointsBadge';
import { t } from '../../src/i18n';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between border-b border-neutral-100 py-3 last:border-b-0">
      <Text className="text-sm text-neutral-500">{label}</Text>
      <Text className="text-sm font-semibold text-neutral-900">{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user)!;
  const logout = useAuthStore((s) => s.logout);

  function confirmLogout() {
    Alert.alert(t.profile.logoutConfirmTitle, t.profile.logoutConfirmMessage, [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.auth.logout, style: 'destructive', onPress: () => logout() },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-bingo-50" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
      >
        <View className="my-5 items-center">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-bingo-100">
            <Text className="text-3xl font-bold text-bingo-700">
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text className="mt-3 text-xl font-bold text-neutral-900">{user.name}</Text>
          <Text className="text-sm text-neutral-500">{t.auth.role[user.role]}</Text>
          <View className="mt-3">
            <PointsBadge points={user.pointsBalance} />
          </View>
        </View>

        <Card>
          <Text className="text-xs font-semibold uppercase text-neutral-500">
            {t.profile.accountInfo}
          </Text>
          <View className="mt-2">
            <Row label={t.auth.name} value={user.name} />
            <Row label={t.auth.phone} value={user.phone} />
            {user.nik ? <Row label={t.auth.nik} value={user.nik} /> : null}
            <Row label="ID" value={user.id.slice(0, 8) + '…'} />
          </View>
        </Card>

        <View className="mt-6">
          <Button
            label={t.auth.logout}
            variant="secondary"
            onPress={confirmLogout}
            testID="logout-button"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
