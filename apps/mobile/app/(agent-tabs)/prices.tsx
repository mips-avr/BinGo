import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PriceBoard } from '../../src/components/weighing/PriceBoard';
import { useBottomInset } from '../../src/hooks/useBottomInset';
import { colors, spacing } from '../../src/theme';
import { t } from '../../src/i18n';

/**
 * Papan harga sisi pemulung.
 *
 * Seluruh isinya kini hidup di `components/weighing/PriceBoard` supaya warga
 * melihat papan yang persis sama — angka yang sama, metodologi yang sama, dan
 * pengecualian yang sama. Papan harga yang berbeda untuk pembeli dan penjual
 * akan menghancurkan alasan keberadaannya.
 */
export default function AgentPriceBoardScreen() {
  const bottomInset = useBottomInset(spacing.xxl + spacing.xs);
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <PriceBoard
        title={t.weighing.priceBoardTitle}
        subtitle={t.weighing.priceBoardSubtitle}
        allowLocation
        bottomInset={bottomInset}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bingo50 },
});
