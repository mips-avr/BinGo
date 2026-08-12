import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { PointsBadge } from '../ui/PointsBadge';
import { VerificationBadge, verificationLevelSummary } from '../agent/VerificationBadge';
import { colors, radius, spacing, shadow, typography } from '../../theme';
import { t } from '../../i18n';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={profileS.row} accessibilityRole="text" accessibilityLabel={`${label}: ${value}`}>
      <Text style={profileS.rowLabel}>{label}</Text>
      <Text style={profileS.rowValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export interface ProfileViewProps {
  /**
   * Konten tambahan khusus peran (mis. pintasan bukti timbang milik warga),
   * dirender di dalam ScrollView yang sama.
   *
   * Sebelumnya layar profil warga membungkus komponen ini dengan ScrollView
   * kedua supaya bisa menambah kartu — dan karena `flex: 1` di dalam wadah
   * gulir tak terbatas menghasilkan tinggi 0, seluruh isi profil warga tidak
   * pernah tampil.
   */
  footer?: React.ReactNode;
}

/** Layar profil bersama untuk warga, pemulung, dan UMKM. */
export function ProfileView({ footer }: ProfileViewProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const insets = useSafeAreaInsets();

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
      contentContainerStyle={[
        profileS.scrollContent,
        { paddingBottom: spacing.xxl + insets.bottom },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={profileS.avatarSection}>
        <View style={profileS.avatar}>
          <Text style={profileS.avatarLetter}>{user.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={profileS.userName} numberOfLines={2}>
          {user.name}
        </Text>
        <Text style={profileS.userRole}>
          {user.role === 'HOUSEHOLD'
            ? 'Warga'
            : user.role === 'COLLECTOR'
              ? 'Petugas Pengumpul'
              : user.role === 'MANAGER_ADMIN' || user.role === 'MANAGER_OPERATOR'
                ? 'Pengelola'
                : user.role === 'BUSINESS_BUYER'
                  ? 'Business/Pengolah'
                  : user.role === 'PLATFORM_ADMIN'
                    ? 'Admin BinGo'
                    : t.auth.role[user.role]}
        </Text>
        {user.role === 'CITIZEN' ? (
          <View style={profileS.pointsWrap}>
            <PointsBadge points={user.pointsBalance} />
          </View>
        ) : null}
        {user.role === 'WASTE_AGENT' ? (
          <View style={profileS.pointsWrap}>
            <VerificationBadge level={user.verificationLevel} />
          </View>
        ) : null}
      </View>

      <Card>
        <Text style={profileS.sectionLabel}>{t.profile.accountInfo}</Text>
        <View style={profileS.rowsWrap}>
          <Row label={t.auth.name} value={user.name} />
          <Row label={t.auth.phone} value={user.phone ?? t.auth.phoneViaCard} />
        </View>
      </Card>

      {user.role === 'WASTE_AGENT' ? (
        <Card style={profileS.verificationCard}>
          <Text style={profileS.sectionLabel}>{t.agent.verification.sectionTitle}</Text>
          <VerificationBadge level={user.verificationLevel} style={profileS.verificationBadge} />
          <Text style={profileS.verificationSummary}>
            {verificationLevelSummary(user.verificationLevel)}
          </Text>
        </Card>
      ) : null}

      {footer ? <View style={profileS.footer}>{footer}</View> : null}

      <Button
        label={t.auth.logout}
        variant="secondary"
        onPress={confirmLogout}
        testID="logout-button"
        style={profileS.logout}
      />
    </ScrollView>
  );
}

const profileS = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg },
  avatarSection: {
    marginVertical: spacing.lg,
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
    marginTop: spacing.sm,
    textAlign: 'center',
    ...typography.headerTitle,
  },
  userRole: {
    ...typography.bodyMuted,
    marginTop: 2,
  },
  pointsWrap: {
    marginTop: spacing.sm,
  },
  sectionLabel: {
    ...typography.overline,
    letterSpacing: 0.5,
  },
  rowsWrap: {
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral100,
    paddingVertical: spacing.sm,
  },
  rowLabel: {
    ...typography.bodyMuted,
    marginRight: spacing.sm,
  },
  rowValue: {
    flexShrink: 1,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral900,
  },
  verificationCard: {
    marginTop: spacing.sm,
  },
  verificationBadge: {
    marginTop: spacing.xs,
  },
  verificationSummary: {
    marginTop: spacing.xs,
    ...typography.body,
  },
  footer: {
    marginTop: spacing.sm,
  },
  logout: {
    marginTop: spacing.xl,
    borderRadius: radius.sm,
  },
});
