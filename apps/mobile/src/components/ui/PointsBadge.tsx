import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/screen';
import { t } from '../../i18n';

export function PointsBadge({ points }: { points: number }) {
  return (
    <View style={badgeStyles.container}>
      <Text style={badgeStyles.icon}>🌿</Text>
      <Text style={badgeStyles.text}>
        {points.toLocaleString('id-ID')} {t.points.label.replace('Poin ', '')}
      </Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 20,
    backgroundColor: colors.bingo100,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.bingo200,
  },
  icon: {
    fontSize: 16,
    marginRight: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.bingo800,
  },
});
