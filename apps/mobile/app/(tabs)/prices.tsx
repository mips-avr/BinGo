import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { PriceBoard } from '../../src/components/weighing/PriceBoard';
import { useBottomInset } from '../../src/hooks/useBottomInset';
import { colors, radius, spacing } from '../../src/theme';
import { t } from '../../src/i18n';

/**
 * Papan harga sisi warga.
 *
 * Inilah separuh yang hilang dari klaim keadilan BinGo. Bukti timbang membuat
 * satu transaksi bisa diperiksa; papan harga membuat transaksi itu bisa
 * DIBANDINGKAN. Sebelumnya papan harga hanya ada di dalam tab pemulung, jadi
 * satu-satunya pihak yang bisa melihat rentang harga adalah pihak yang
 * menentukan harganya.
 */
export default function CitizenPriceBoardScreen() {
  const bottomInset = useBottomInset(spacing.xxl + spacing.xs);
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <PriceBoard
        title={t.weighing.citizenEntryTitle}
        subtitle={t.weighing.citizenEntrySubtitle}
        allowLocation
        bottomInset={bottomInset}
        header={
          <View style={s.notice} accessibilityRole="text">
            <Feather name="unlock" size={16} color={colors.bingo800} />
            <Text style={s.noticeText}>{t.weighing.publicNotice}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  notice: {
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.bingo100,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  noticeText: {
    marginLeft: spacing.xs,
    flex: 1,
    fontSize: 12,
    color: colors.bingo800,
    lineHeight: 18,
  },
});
