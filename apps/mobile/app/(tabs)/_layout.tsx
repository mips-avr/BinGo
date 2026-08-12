import { Redirect, Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppSplash } from '../../src/components/ui/AppSplash';
import { getAuthenticatedHome } from '../../src/lib/navigation/role-routes';
import { useAuthStore } from '../../src/store/authStore';
import { colors, spacing } from '../../src/theme';

const ICONS = {
  index: 'home',
  services: 'calendar',
  facilities: 'map-pin',
  reports: 'alert-circle',
  profile: 'user',
} as const;

export default function HouseholdTabsLayout() {
  const insets = useSafeAreaInsets();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  if (status === 'idle' || status === 'loading') return <AppSplash />;
  if (!user) return <Redirect href="/(auth)/login" />;
  if (!['HOUSEHOLD', 'CITIZEN'].includes(user.role))
    return <Redirect href={getAuthenticatedHome(user.role)} />;
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.bingo700,
        tabBarInactiveTintColor: colors.neutral500,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarStyle: {
          height: 64 + insets.bottom,
          paddingTop: spacing.xxs,
          paddingBottom: spacing.xxs + insets.bottom,
        },
        tabBarIcon: ({ color, size }) => (
          <Feather
            name={ICONS[route.name as keyof typeof ICONS] ?? 'circle'}
            color={color}
            size={size}
          />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Beranda' }} />
      <Tabs.Screen name="services" options={{ title: 'Layanan' }} />
      <Tabs.Screen name="facilities" options={{ title: 'Jalur Setor' }} />
      <Tabs.Screen name="reports" options={{ title: 'Laporan' }} />
      <Tabs.Screen name="profile" options={{ title: 'Akun' }} />
      <Tabs.Screen name="pickups" options={{ href: null }} />
    </Tabs>
  );
}
