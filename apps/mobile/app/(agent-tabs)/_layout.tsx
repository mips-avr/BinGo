import { Tabs, Redirect } from 'expo-router';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../src/theme';
import { getAuthenticatedHome } from '../../src/lib/navigation/role-routes';
import { AgentLocationProvider } from '../../src/hooks/useAgentLocation';
import { AppSplash } from '../../src/components/ui/AppSplash';
import { useAuthStore } from '../../src/store/authStore';
import { t } from '../../src/i18n';

const ICONS = {
  home: '📊',
  nearby: '📍',
  jobs: '🚚',
  prices: '🏷️',
  reports: '📋',
  profile: '👤',
} as const;

function Icon({ name, focused }: { name: keyof typeof ICONS; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{ICONS[name]}</Text>;
}

/**
 * React Navigation menambahkan inset bawah secara otomatis ke tab bar, tetapi
 * `tabBarStyle` yang menuliskan `height`/`paddingBottom` sendiri menimpanya —
 * itulah sebabnya ikon dan label sempat duduk di bawah home indicator pada
 * perangkat tanpa tombol fisik. Inset dihitung ulang di sini.
 */
function useTabBarStyle() {
  const insets = useSafeAreaInsets();
  return {
    paddingTop: spacing.xxs,
    paddingBottom: spacing.xxs + insets.bottom,
    height: 64 + insets.bottom,
  };
}

/** Tab navigator khusus pemulung (`WASTE_AGENT`). */
export default function AgentTabsLayout() {
  const tabBarStyle = useTabBarStyle();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  if (status === 'idle' || status === 'loading') {
    return <AppSplash />;
  }
  if (status === 'unauthenticated' || !user) {
    return <Redirect href="/(auth)/login" />;
  }
  if (user.role !== 'WASTE_AGENT') {
    return <Redirect href={getAuthenticatedHome(user.role)} />;
  }

  return (
    // Satu langganan GPS untuk seluruh tab pemulung. Dashboard dan radar dulu
    // masing-masing memanggil `useAgentLocation()` sendiri, sehingga dua
    // langganan berjalan bersamaan dan dua entri cache terbentuk untuk data
    // yang persis sama.
    <AgentLocationProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.bingo700,
          tabBarInactiveTintColor: colors.neutral500,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarStyle,
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
          name="prices"
          options={{
            title: t.weighing.tabTitle,
            tabBarIcon: ({ focused }) => <Icon name="prices" focused={focused} />,
          }}
        />
        {/* Lima tab adalah batas nyaman untuk satu ibu jari; antrean laporan
            dibuka dari kartu ringkasan di Dashboard. */}
        <Tabs.Screen name="reports" options={{ href: null }} />
        {/* Stack bukti timbang tidak punya tombol tab sendiri — dibuka dari
            detail pekerjaan dan dari dashboard. */}
        <Tabs.Screen name="receipts" options={{ href: null }} />
        <Tabs.Screen
          name="profile"
          options={{
            title: t.agent.tabs.profile,
            tabBarIcon: ({ focused }) => <Icon name="profile" focused={focused} />,
          }}
        />
      </Tabs>
    </AgentLocationProvider>
  );
}
