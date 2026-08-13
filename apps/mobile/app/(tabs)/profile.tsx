import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ProfileView } from '../../src/components/profile/ProfileView';
import { Button } from '../../src/components/ui/Button';
import { colors } from '../../src/theme';

export default function ProfileScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bingo50 }} edges={['top']}>
      <ProfileView
        footer={
          <Button
            label="Bantuan"
            variant="secondary"
            onPress={() => router.push('/(tabs)/help' as never)}
          />
        }
      />
    </SafeAreaView>
  );
}
