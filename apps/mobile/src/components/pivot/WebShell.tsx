import { useState } from 'react';
import { Redirect, usePathname, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { UserRole } from '@bingo/shared-types';
import { AppSplash } from '../ui/AppSplash';
import { useAuthStore } from '../../store/authStore';
import { colors, radius, spacing } from '../../theme';
import { getAuthenticatedHome } from '../../lib/navigation/role-routes';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentProps<typeof Feather>['name'];
}

export function WebShell({
  allowedRoles,
  nav,
  title,
  children,
}: {
  allowedRoles: UserRole[];
  nav: NavItem[];
  title: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [loggingOut, setLoggingOut] = useState(false);

  if (status === 'idle' || status === 'loading') return <AppSplash />;
  if (!user) return <Redirect href="/(auth)/login" />;
  if (!allowedRoles.includes(user.role)) return <Redirect href={getAuthenticatedHome(user.role)} />;

  return (
    <View style={styles.root}>
      <View style={styles.sidebar}>
        <View style={styles.logoRow}>
          <View style={styles.logoMark}><Text style={styles.logoMarkText}>♻️</Text></View>
          <Text style={styles.logo}>BinGo</Text>
          <Text style={styles.demo}>DEMO</Text>
        </View>
        <Text style={styles.workspace} numberOfLines={2}>{title}</Text>
        <ScrollView style={styles.navScroll} contentContainerStyle={styles.navContent}>
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== nav[0]?.href && pathname.startsWith(item.href));
            return (
              <NavigationItem
                key={item.href}
                item={item}
                active={active}
                onPress={() => router.push(item.href as never)}
              />
            );
          })}
        </ScrollView>
        <NavigationItem
          item={{ label: loggingOut ? 'Keluar...' : 'Keluar', href: '#logout', icon: 'log-out' }}
          active={false}
          disabled={loggingOut}
          onPress={async () => {
            setLoggingOut(true);
            await logout();
            router.replace('/(auth)/login');
          }}
        />
      </View>
      <View style={styles.contentColumn}>
        <View style={styles.topbar}>
          <View>
            <Text style={styles.topbarContext}>{title}</Text>
            <Text style={styles.topbarTitle}>{currentPageLabel(nav, pathname)}</Text>
          </View>
          <View style={styles.userBlock}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initials(user.name)}</Text></View>
            <View>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userRole}>{roleLabel(user.role)}</Text>
            </View>
          </View>
        </View>
        <View style={styles.main}>{children}</View>
      </View>
    </View>
  );
}

function NavigationItem({
  item,
  active,
  disabled,
  onPress,
}: {
  item: NavItem;
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled }}
      disabled={disabled}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        styles.nav,
        hovered && !active ? styles.navHovered : null,
        active ? styles.navActive : null,
        disabled ? styles.navDisabled : null,
      ]}
    >
      <Feather name={item.icon} size={18} color={active ? colors.bingo800 : colors.neutral500} />
      <Text style={[styles.navText, active ? styles.navTextActive : null]}>{item.label}</Text>
      {active ? <View style={styles.activeDot} /> : null}
    </Pressable>
  );
}

function currentPageLabel(nav: NavItem[], pathname: string) {
  return nav.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.label ?? nav[0]?.label ?? 'Ringkasan';
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function roleLabel(role: UserRole) {
  const labels: Partial<Record<UserRole, string>> = {
    PLATFORM_ADMIN: 'Admin Platform',
    MANAGER_ADMIN: 'Admin Pengelola',
    MANAGER_OPERATOR: 'Operator Pengelola',
    BUSINESS_BUYER: 'Business/Pengolah',
  };
  return labels[role] ?? role.replaceAll('_', ' ');
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: Platform.OS === 'web' ? 'row' : 'column', backgroundColor: colors.neutral50 },
  sidebar: {
    width: Platform.OS === 'web' ? 276 : '100%',
    maxHeight: Platform.OS === 'web' ? undefined : 150,
    backgroundColor: colors.white,
    borderRightWidth: Platform.OS === 'web' ? 1 : 0,
    borderBottomWidth: Platform.OS === 'web' ? 0 : 1,
    borderColor: colors.neutral200,
    padding: spacing.lg,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoMark: { width: 34, height: 34, borderRadius: radius.sm, backgroundColor: colors.bingo100, alignItems: 'center', justifyContent: 'center', marginRight: spacing.xs },
  logoMarkText: { fontSize: 20 },
  logo: { fontSize: 24, fontWeight: '900', color: colors.bingo800 },
  demo: { marginLeft: spacing.xs, fontSize: 10, fontWeight: '900', backgroundColor: colors.amber100, color: colors.amber800, borderRadius: radius.xs, paddingHorizontal: 7, paddingVertical: 4 },
  workspace: { marginTop: spacing.sm, marginBottom: spacing.lg, color: colors.neutral500, fontSize: 13, lineHeight: 18 },
  navScroll: { flex: 1 },
  navContent: { paddingBottom: spacing.md },
  nav: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm, borderRadius: radius.sm, marginBottom: 4, cursor: 'pointer' },
  navHovered: { backgroundColor: colors.neutral100 },
  navActive: { backgroundColor: colors.bingo100 },
  navDisabled: { opacity: 0.55 },
  navText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.neutral600 },
  navTextActive: { color: colors.bingo800, fontWeight: '800' },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.bingo600 },
  contentColumn: { flex: 1, minWidth: 0 },
  topbar: { minHeight: 76, paddingHorizontal: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.neutral200, backgroundColor: colors.white, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topbarContext: { color: colors.neutral500, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  topbarTitle: { marginTop: 2, color: colors.neutral900, fontSize: 20, fontWeight: '800' },
  userBlock: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bingo100 },
  avatarText: { color: colors.bingo800, fontSize: 12, fontWeight: '900' },
  userName: { color: colors.neutral900, fontSize: 13, fontWeight: '800' },
  userRole: { marginTop: 2, color: colors.neutral500, fontSize: 11 },
  main: { flex: 1, minWidth: 0 },
});
