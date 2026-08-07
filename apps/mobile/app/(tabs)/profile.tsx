import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ProfileView } from '../../src/components/profile/ProfileView';
import { Card } from '../../src/components/ui/Card';
import { colors, spacing, typography } from '../../src/theme';
import { t } from '../../src/i18n';

export default function ProfileScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title} accessibilityRole="header">
          {t.profile.title}
        </Text>
      </View>
      {/*
        `ProfileView` sudah berupa ScrollView dengan `flex: 1`. Membungkusnya
        lagi dengan ScrollView lain (seperti sebelumnya) membuat tingginya
        mengecil menjadi nol, sehingga seluruh isi profil warga — termasuk
        satu-satunya pintu masuk ke daftar bukti timbang — tidak pernah tampil.
        Kartu tambahan sekarang dititipkan lewat prop `footer`.
      */}
      <ProfileView
        footer={
          <Card
            onPress={() => router.push('/(tabs)/receipts')}
            accessibilityLabel={t.weighing.receiptListTitle}
            testID="profile-receipts-link"
          >
            <View style={s.linkRow}>
              <Text style={s.linkIcon}>🧾</Text>
              <View style={s.linkTextWrap}>
                <Text style={s.linkTitle}>{t.weighing.receiptListTitle}</Text>
                <Text style={s.linkSubtitle} numberOfLines={2}>
                  {t.weighing.emptyMessage}
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.neutral400} />
            </View>
          </Card>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  title: typography.headerTitle,
  linkRow: { flexDirection: 'row', alignItems: 'center' },
  linkIcon: { fontSize: 22, marginRight: spacing.sm },
  linkTextWrap: { flex: 1, marginRight: spacing.xs },
  linkTitle: typography.cardTitle,
  linkSubtitle: { marginTop: 2, ...typography.caption },
});
