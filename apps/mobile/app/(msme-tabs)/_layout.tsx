import { Tabs, Redirect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../../src/theme';
import { getAuthenticatedHome } from '../../src/lib/navigation/role-routes';
import { AppSplash } from '../../src/components/ui/AppSplash';
import { useAuthStore } from '../../src/store/authStore';
import { useCartStore } from '../../src/store/cartStore';
import { t } from '../../src/i18n';

const ICONS = {
  shop: '🛒',
  cart: '🧺',
  orders: '📦',
  profile: '👤',
} as const;

function Icon({ name, focused }: { name: keyof typeof ICONS; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{ICONS[name]}</Text>;
}

function CartBadge() {
  const count = useCartStore((s) => s.itemCount());
  if (count === 0) return null;
  return (
    <View style={badgeS.dot} accessibilityRole="text" accessibilityLabel={`${count}`}>
      <Text style={badgeS.dotText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
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

/** Tab navigator khusus UMKM (`MSME`) — belanja, keranjang, pesanan. */
export default function MsmeTabsLayout() {
  const tabBarStyle = useTabBarStyle();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  if (status === 'idle' || status === 'loading') {
    return <AppSplash />;
  }
  if (status === 'unauthenticated' || !user) {
    return <Redirect href="/(auth)/login" />;
  }
  if (user.role !== 'MSME') {
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
        name="marketplace"
        options={{
          title: t.msme.tabs.shop,
          tabBarIcon: ({ focused }) => <Icon name="shop" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: t.msme.tabs.cart,
          tabBarIcon: ({ focused }) => (
            <View>
              <Icon name="cart" focused={focused} />
              <CartBadge />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t.msme.tabs.orders,
          tabBarIcon: ({ focused }) => <Icon name="orders" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.msme.tabs.profile,
          tabBarIcon: ({ focused }) => <Icon name="profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const badgeS = StyleSheet.create({
  dot: {
    position: 'absolute',
    right: -4,
    top: -4,
    minWidth: 16,
    borderRadius: radius.xs,
    backgroundColor: colors.red500,
    paddingHorizontal: spacing.xxs,
    alignItems: 'center',
  },
  dotText: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
});
