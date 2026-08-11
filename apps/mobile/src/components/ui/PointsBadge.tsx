import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { t } from '../../i18n';

export function PointsBadge({ points }: { points: number }) {
  const formatted = points.toLocaleString('id-ID');
  return (
    <View
      style={badgeStyles.container}
      accessibilityRole="text"
      accessibilityLabel={`${formatted} ${t.points.label}`}
    >
      <Text style={badgeStyles.icon}>🌿</Text>
      {/* `t.points.short` memang ada untuk ini; sebelumnya kata "poin"
          diturunkan lewat `t.points.label.replace('Poin ', '')`, yang langsung
          rusak begitu label diterjemahkan. */}
      <Text style={badgeStyles.text}>
        {formatted} {t.points.short}
      </Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.lg,
    backgroundColor: colors.bingo100,
    paddingHorizontal: 14,
    paddingVertical: spacing.xxs + 2,
    borderWidth: 1,
    borderColor: colors.bingo200,
  },
  icon: {
    fontSize: 16,
    marginRight: spacing.xxs + 2,
  },
  text: {
    ...typography.numeric,
    fontSize: 14,
    color: colors.bingo800,
  },
});
