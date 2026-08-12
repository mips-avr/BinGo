import { Redirect, usePathname, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { UserRole } from '@bingo/shared-types';
import { AppSplash } from '../ui/AppSplash';
import { useAuthStore } from '../../store/authStore';
import { colors, radius, spacing } from '../../theme';
import { getAuthenticatedHome } from '../../lib/navigation/role-routes';

export interface NavItem { label: string; href: string; icon: React.ComponentProps<typeof Feather>['name']; }

export function WebShell({ allowedRoles, nav, title, children }: { allowedRoles: UserRole[]; nav: NavItem[]; title: string; children: React.ReactNode }) {
  const router = useRouter(); const pathname = usePathname(); const status = useAuthStore((s) => s.status); const user = useAuthStore((s) => s.user); const logout = useAuthStore((s) => s.logout);
  if (status === 'idle' || status === 'loading') return <AppSplash />;
  if (!user) return <Redirect href="/(auth)/login" />;
  if (!allowedRoles.includes(user.role)) return <Redirect href={getAuthenticatedHome(user.role)} />;
  return <View style={styles.root}><View style={styles.sidebar}><View style={styles.logoRow}><Text style={styles.logo}>BinGo</Text><Text style={styles.demo}>DEMO</Text></View><Text style={styles.workspace} numberOfLines={2}>{title}</Text><ScrollView style={{ flex: 1 }}>{nav.map((item) => { const active = pathname === item.href || (item.href !== nav[0]?.href && pathname.startsWith(item.href)); return <Pressable key={item.href} onPress={() => router.push(item.href as never)} style={[styles.nav, active && styles.navActive]}><Feather name={item.icon} size={19} color={active ? colors.bingo800 : colors.neutral500} /><Text style={[styles.navText, active && styles.navTextActive]}>{item.label}</Text></Pressable>; })}</ScrollView><Pressable style={styles.nav} onPress={async () => { await logout(); router.replace('/(auth)/login'); }}><Feather name="log-out" size={19} color={colors.neutral500} /><Text style={styles.navText}>Keluar</Text></Pressable></View><View style={styles.main}>{children}</View></View>;
}
const styles = StyleSheet.create({ root: { flex: 1, flexDirection: Platform.OS === 'web' ? 'row' : 'column', backgroundColor: colors.neutral50 }, sidebar: { width: Platform.OS === 'web' ? 250 : '100%', maxHeight: Platform.OS === 'web' ? undefined : 150, backgroundColor: colors.white, borderRightWidth: Platform.OS === 'web' ? 1 : 0, borderBottomWidth: Platform.OS === 'web' ? 0 : 1, borderColor: colors.neutral200, padding: spacing.lg }, logoRow: { flexDirection: 'row', alignItems: 'center' }, logo: { fontSize: 26, fontWeight: '900', color: colors.bingo800 }, demo: { marginLeft: spacing.xs, fontSize: 10, fontWeight: '900', backgroundColor: colors.amber100, color: colors.amber800, borderRadius: radius.xs, paddingHorizontal: 7, paddingVertical: 4 }, workspace: { marginTop: spacing.sm, marginBottom: spacing.lg, color: colors.neutral600, fontSize: 13, lineHeight: 18 }, nav: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm, borderRadius: radius.sm, marginBottom: 4 }, navActive: { backgroundColor: colors.bingo100 }, navText: { fontSize: 14, fontWeight: '600', color: colors.neutral600 }, navTextActive: { color: colors.bingo800, fontWeight: '800' }, main: { flex: 1, minWidth: 0 } });
