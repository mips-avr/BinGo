import { Tabs, Redirect } from 'expo-router';
import { Text } from 'react-native';
import { getAuthenticatedHome } from '../../src/lib/navigation/role-routes';
import { useAuthStore } from '../../src/store/authStore';
import { t } from '../../src/i18n';

const ICONS = {
  home: '📊',
  nearby: '📍',
  jobs: '🚚',
  reports: '📋',
  profile: '👤',
} as const;

function Icon({ name, focused }: { name: keyof typeof ICONS; focused: boolean }) {
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{ICONS[name]}</Text>
  );
}

/** Tab navigator khusus pemulung (`WASTE_AGENT`). */
export default function AgentTabsLayout() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  if (status === 'unauthenticated' || !user) {
    return <Redirect href="/(auth)/login" />;
  }
  if (user.role !== 'WASTE_AGENT') {
    return <Redirect href={getAuthenticatedHome(user.role)} />;
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
          title: t.agent.tabs.home,
          tabBarIcon: ({ focused }) => <Icon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="nearby"
        options={{
          title: t.agent.tabs.nearby,
          tabBarIcon: ({ focused }) => <Icon name="nearby" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: t.agent.tabs.jobs,
          tabBarIcon: ({ focused }) => <Icon name="jobs" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: t.agent.tabs.reports,
          tabBarIcon: ({ focused }) => <Icon name="reports" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.agent.tabs.profile,
          tabBarIcon: ({ focused }) => <Icon name="profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
