import { ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, screenStyles, spacing } from '../../theme';
import { t } from '../../i18n';

/**
 * Layar tunggu saat sesi masih dimuat dari penyimpanan aman.
 *
 * Dipakai bersama oleh router root dan ketiga tab layout. Sebelumnya hanya
 * router root yang menunggu hidrasi, sementara tab layout langsung mengalihkan
 * ke halaman masuk begitu `user` masih null — sehingga tautan dalam (deep link)
 * ke sebuah tab, atau pemulihan rute oleh sistem, memantulkan pengguna yang
 * sesinya masih sah ke layar masuk.
 */
export function AppSplash({ systemFont = false }: { systemFont?: boolean }) {
  return (
    <SafeAreaView style={screenStyles.splash} edges={['top', 'bottom']}>
      <Text style={{ fontSize: 56 }} accessibilityElementsHidden>
        ♻️
      </Text>
      <Text
        style={[screenStyles.brandTitle, systemFont ? { fontFamily: undefined, fontWeight: '800' } : null]}
        accessibilityRole="header"
      >
        {t.common.appName}
      </Text>
      <ActivityIndicator
        color={colors.bingo700}
        style={{ marginTop: spacing.xl }}
        accessibilityLabel={t.common.loadingLabel}
      />
      <Text
        style={[screenStyles.splashText, systemFont ? { fontFamily: undefined } : null]}
      >
        {t.common.loading}
      </Text>
    </SafeAreaView>
  );
}
