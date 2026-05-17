import { Image, Text, View } from 'react-native';
import type { ReportDto } from '@bingo/shared-types';
import { formatRelativeId } from '@bingo/shared-utils';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { t } from '../../i18n';

export function ReportCard({
  report,
  onPress,
}: {
  report: ReportDto;
  onPress?: () => void;
}) {
  return (
    <Card onPress={onPress} className="mb-3" padded={false}>
      <Image
        source={{ uri: report.imageUrl }}
        className="h-40 w-full rounded-t-2xl bg-neutral-200"
        resizeMode="cover"
      />
      <View className="p-4">
        <View className="flex-row items-center justify-between">
          <Text className="flex-1 text-base font-semibold text-neutral-900" numberOfLines={2}>
            {report.description ?? '(Tanpa deskripsi)'}
          </Text>
          <StatusBadge status={report.status} />
        </View>
        <Text className="mt-2 text-xs text-neutral-500">
          {t.report.verifyCount.replace('{count}', String(report.verificationCount))}
          {' · '}
          {formatRelativeId(report.createdAt)}
        </Text>
      </View>
    </Card>
  );
}
