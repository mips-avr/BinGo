import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileView } from '../../src/components/profile/ProfileView';
import { t } from '../../src/i18n';
import { Text, View } from 'react-native';

export default function AgentProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bingo-50" edges={['top']}>
      <View className="px-5 py-4">
        <Text className="text-xl font-bold text-neutral-900">{t.profile.title}</Text>
      </View>
      <ProfileView />
    </SafeAreaView>
  );
}
