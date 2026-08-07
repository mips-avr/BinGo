import { Tabs, Redirect } from 'expo-router';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../src/theme';
import { getAuthenticatedHome } from '../../src/lib/navigation/role-routes';
import { AppSplash } from '../../src/components/ui/AppSplash';
import { useAuthStore } from '../../src/store/authStore';
import { t } from '../../src/i18n';

/**
 * Tab bar warga (Phase 4). Tab pemulung (Phase 5) dan UMKM (Phase 6+)
 * akan menggunakan layout group terpisah sehingga setiap peran punya
 * navigasi yang berbeda.
 */
const ICONS = {
  home: '🏠',
  scanner: '♻️',
  pickups: '🚚',
  prices: '🏷️',
  reports: '📷',
  marketplace: '🛒',
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

export default function TabsLayout() {
  const tabBarStyle = useTabBarStyle();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  if (status === 'idle' || status === 'loading') {
    return <AppSplash />;
  }
  if (status === 'unauthenticated' || !user) {
    return <Redirect href="/(auth)/login" />;
  }
  if (user.role === 'WASTE_AGENT') {
    return <Redirect href={getAuthenticatedHome(user.role)} />;
  }
  if (user.role === 'MSME') {
    return <Redirect href={getAuthenticatedHome(user.role)} />;
  }
  return (
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
          title: t.tabs.home,
          tabBarIcon: ({ focused }) => <Icon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: t.tabs.scanner,
          tabBarIcon: ({ focused }) => <Icon name="scanner" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="pickups"
        options={{
          title: t.tabs.pickups,
          tabBarIcon: ({ focused }) => <Icon name="pickups" focused={focused} />,
        }}
      />
      {/* Papan harga ada di tab warga, bukan hanya di tab pemulung: warga yang
          menjual harus bisa melihat rentang harga yang dipakai membayarnya. */}
      <Tabs.Screen
        name="prices"
        options={{
          title: t.weighing.tabTitle,
          tabBarIcon: ({ focused }) => <Icon name="prices" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.tabs.profile,
          tabBarIcon: ({ focused }) => <Icon name="profile" focused={focused} />,
        }}
      />
      {/* Lima tab adalah batas yang nyaman untuk satu ibu jari pada layar 5–6
          inci; tab keenam dan seterusnya membuat label terpotong dan target
          sentuh menyempit di bawah 44 dp. Laporan dan WasteMart karena itu
          dibuka dari kartu aksi di Beranda, bukan dari tombol tab tersendiri,
          dan Bukti Timbang dibuka dari Profil. */}
      <Tabs.Screen name="reports" options={{ href: null }} />
      <Tabs.Screen name="marketplace" options={{ href: null }} />
      <Tabs.Screen name="receipts" options={{ href: null }} />
    </Tabs>
  );
}
