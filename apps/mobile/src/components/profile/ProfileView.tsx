import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { PointsBadge } from '../ui/PointsBadge';
import { colors, shadow } from '../../theme/screen';
import { t } from '../../i18n';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={profileS.row}>
      <Text style={profileS.rowLabel}>{label}</Text>
      <Text style={profileS.rowValue}>{value}</Text>
    </View>
  );
}

/** Layar profil bersama untuk warga, pemulung, dan UMKM. */
export function ProfileView() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  if (!user) return null;

  function confirmLogout() {
    Alert.alert(t.profile.logoutConfirmTitle, t.profile.logoutConfirmMessage, [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.auth.logout, style: 'destructive', onPress: () => logout() },
    ]);
  }

  return (
    <ScrollView
      style={profileS.scroll}
      contentContainerStyle={profileS.scrollContent}
    >
      <View style={profileS.avatarSection}>
        <View style={profileS.avatar}>
          <Text style={profileS.avatarLetter}>
            {user.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={profileS.userName}>{user.name}</Text>
        <Text style={profileS.userRole}>{t.auth.role[user.role]}</Text>
        {user.role === 'CITIZEN' ? (
          <View style={profileS.pointsWrap}>
            <PointsBadge points={user.pointsBalance} />
          </View>
        ) : null}
      </View>

      <Card>
        <Text style={profileS.sectionLabel}>
          {t.profile.accountInfo}
        </Text>
        <View style={profileS.rowsWrap}>
          <Row label={t.auth.name} value={user.name} />
          <Row label={t.auth.phone} value={user.phone} />
          {user.nik ? <Row label={t.auth.nik} value={user.nik} /> : null}
        </View>
      </Card>

      <View style={profileS.logoutWrap}>
        <Button
          label={t.auth.logout}
          variant="secondary"
          onPress={confirmLogout}
          testID="logout-button"
        />
      </View>
    </ScrollView>
  );
}

const profileS = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 32 },
  avatarSection: {
    marginVertical: 20,
    alignItems: 'center',
  },
  avatar: {
    height: 80,
    width: 80,
    borderRadius: 40,
    backgroundColor: colors.bingo100,
    borderWidth: 2,
    borderColor: colors.bingo200,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow(2),
  },
  avatarLetter: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.bingo700,
  },
  userName: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: '700',
    color: colors.neutral900,
  },
  userRole: {
    fontSize: 14,
    color: colors.neutral600,
    marginTop: 2,
  },
  pointsWrap: {
    marginTop: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: colors.neutral600,
    letterSpacing: 0.5,
  },
  rowsWrap: {
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral100,
    paddingVertical: 12,
  },
  rowLabel: {
    fontSize: 14,
    color: colors.neutral600,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral900,
  },
  logoutWrap: {
    marginTop: 24,
  },
});
