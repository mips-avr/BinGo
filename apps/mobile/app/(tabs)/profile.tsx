import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ProfileView } from '../../src/components/profile/ProfileView';
import { Card } from '../../src/components/ui/Card';
import { colors } from '../../src/theme/screen';
import { t } from '../../src/i18n';

export default function ProfileScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>{t.profile.title}</Text>
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <ProfileView />
        <Card style={s.linkCard} onPress={() => router.push('/(tabs)/receipts')}>
          <View style={s.linkRow}>
            <Text style={s.linkIcon}>🧾</Text>
            <View style={s.linkTextWrap}>
              <Text style={s.linkTitle}>{t.weighing.receiptListTitle}</Text>
              <Text style={s.linkSubtitle}>{t.weighing.emptyMessage}</Text>
            </View>
            <Text style={s.chevron}>›</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 20, fontWeight: '700', color: colors.neutral900 },
  content: { paddingBottom: 32 },
  linkCard: { marginHorizontal: 20, marginTop: 12 },
  linkRow: { flexDirection: 'row', alignItems: 'center' },
  linkIcon: { fontSize: 22, marginRight: 12 },
  linkTextWrap: { flex: 1 },
  linkTitle: { fontSize: 15, fontWeight: '700', color: colors.neutral900 },
  linkSubtitle: { marginTop: 2, fontSize: 12, color: colors.neutral600 },
  chevron: { fontSize: 24, color: colors.neutral400, marginLeft: 8 },
});
