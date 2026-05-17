import { Image, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { ReportDto } from '@bingo/shared-types';
import { formatRelativeId } from '@bingo/shared-utils';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { colors } from '../../theme/screen';
import { t } from '../../i18n';

export function ReportCard({
  report,
  onPress,
}: {
  report: ReportDto;
  onPress?: () => void;
}) {
  return (
    <Card onPress={onPress} style={cardS.mb} padded={false}>
      <Image
        source={{ uri: report.imageUrl }}
        style={cardS.image}
        resizeMode="cover"
      />
      <View style={cardS.body}>
        <View style={cardS.row}>
          {/* Icon indicator */}
          <View style={cardS.iconCircle}>
            <Feather name="flag" size={13} color={colors.red600} />
          </View>
          <Text style={cardS.desc} numberOfLines={2}>
            {report.description ?? '(Tanpa deskripsi)'}
          </Text>
          <StatusBadge status={report.status} />
        </View>
        {/* Divider */}
        <View style={cardS.divider} />
        <Text style={cardS.meta}>
          {t.report.verifyCount.replace('{count}', String(report.verificationCount))}
          {' · '}
          {formatRelativeId(report.createdAt)}
        </Text>
      </View>
    </Card>
  );
}

const cardS = StyleSheet.create({
  mb: { marginBottom: 12 },
  image: {
    height: 160,
    width: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: colors.neutral200,
  },
  body: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2', // red-100
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  desc: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.neutral900,
    marginRight: 8,
  },
  divider: {
    marginTop: 12,
    marginBottom: 10,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.neutral200,
  },
  meta: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.neutral500,
  },
});
