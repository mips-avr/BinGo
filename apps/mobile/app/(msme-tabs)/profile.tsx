import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileView } from '../../src/components/profile/ProfileView';
import { colors, spacing, typography } from '../../src/theme';
import { t } from '../../src/i18n';

export default function MsmeProfileScreen() {
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title} accessibilityRole="header">
          {t.profile.title}
        </Text>
      </View>
      <ProfileView />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  title: typography.headerTitle,
});
