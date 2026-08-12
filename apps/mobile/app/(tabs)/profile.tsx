import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileView } from '../../src/components/profile/ProfileView';
import { colors } from '../../src/theme';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bingo50 }} edges={['top']}>
      <ProfileView />
    </SafeAreaView>
  );
}
