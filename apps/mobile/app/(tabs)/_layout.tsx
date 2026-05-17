import { Tabs, Redirect } from 'expo-router';
import { Text } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';
import { t } from '../../src/i18n';

/**
 * Tab bar warga (Phase 4). Tab pemulung (Phase 5) dan UMKM (Phase 6+)
 * akan menggunakan layout group terpisah sehingga setiap peran punya
 * navigasi yang berbeda.
 */
const ICONS = {
  home: '🏠',
  pickups: '🚚',
  reports: '📷',
  marketplace: '🛒',
  profile: '👤',
} as const;

function Icon({ name, focused }: { name: keyof typeof ICONS; focused: boolean }) {
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{ICONS[name]}</Text>
  );
}

export default function TabsLayout() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  if (status === 'unauthenticated' || !user) {
    return <Redirect href="/(auth)/login" />;
  }
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#15803D',
        tabBarInactiveTintColor: '#737373',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: { paddingTop: 4, paddingBottom: 4, height: 64 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabs.home,
          tabBarIcon: ({ focused }) => <Icon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="pickups"
        options={{
          title: t.tabs.pickups,
          tabBarIcon: ({ focused }) => <Icon name="pickups" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: t.tabs.reports,
          tabBarIcon: ({ focused }) => <Icon name="reports" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: t.tabs.marketplace,
          tabBarIcon: ({ focused }) => <Icon name="marketplace" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.tabs.profile,
          tabBarIcon: ({ focused }) => <Icon name="profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
