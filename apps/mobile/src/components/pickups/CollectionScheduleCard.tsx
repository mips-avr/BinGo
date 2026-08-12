import { memo, useCallback } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import type { CollectionScheduleDto } from '@bingo/shared-types';

import { t } from '../../i18n';
import { colors, radius, spacing, typography } from '../../theme';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

function formatVerified(iso: string): string {
  const date = new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return t.collectionSchedule.verifiedAt.replace('{date}', date);
}

function formatTime(schedule: CollectionScheduleDto): string {
  if (!schedule.startTime || !schedule.endTime) return t.collectionSchedule.timeNotListed;
  return t.collectionSchedule.timeRange
    .replace('{start}', schedule.startTime.replace(':', '.'))
    .replace('{end}', schedule.endTime.replace(':', '.'));
}

export interface CollectionScheduleCardProps {
  schedule: CollectionScheduleDto;
}

export const CollectionScheduleCard = memo(function CollectionScheduleCard({
  schedule,
}: CollectionScheduleCardProps) {
  const openSource = useCallback(() => {
    void Linking.openURL(schedule.sourceUrl);
  }, [schedule.sourceUrl]);

  const days =
    schedule.days.length > 0
      ? schedule.days.map((day) => t.collectionSchedule.day[day]).join(', ')
      : t.collectionSchedule.daysNotListed;

  return (
    <Card style={s.card}>
      <View style={s.header}>
        <View style={s.headerText}>
          <Text style={s.title}>{schedule.title}</Text>
          <Text style={s.publisher}>{schedule.publisherName}</Text>
        </View>
        <View style={s.modePill}>
          <Text style={s.modeText}>{t.collectionSchedule.serviceMode[schedule.serviceMode]}</Text>
        </View>
      </View>

      <View style={s.factRow}>
        <Feather name="map-pin" size={15} color={colors.neutral600} />
        <Text style={s.fact}>{schedule.area}</Text>
      </View>
      <View style={s.factRow}>
        <Feather name="calendar" size={15} color={colors.neutral600} />
        <Text style={s.fact}>{days}</Text>
      </View>
      <View style={s.factRow}>
        <Feather name="clock" size={15} color={colors.neutral600} />
        <Text style={s.fact}>{formatTime(schedule)}</Text>
      </View>

      <View style={s.materials}>
        {schedule.materials.map((material) => (
          <View key={material} style={s.materialPill}>
            <Text style={s.materialText}>{t.pickup.material_label[material]}</Text>
          </View>
        ))}
      </View>

      {schedule.scheduleNote ? <Text style={s.note}>{schedule.scheduleNote}</Text> : null}
      {schedule.preparationNote ? (
        <Text style={s.preparation}>
          {t.collectionSchedule.preparation}: {schedule.preparationNote}
        </Text>
      ) : null}

      <View style={s.footer}>
        <Text style={s.verified}>{formatVerified(schedule.verifiedAt)}</Text>
        <Button
          label={t.collectionSchedule.source}
          size="sm"
          variant="ghost"
          onPress={openSource}
        />
      </View>
    </Card>
  );
});

const s = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  headerText: { flex: 1 },
  title: { ...typography.cardTitle },
  publisher: { ...typography.caption, color: colors.neutral600, marginTop: 2 },
  modePill: {
    maxWidth: '42%',
    backgroundColor: colors.bingo50,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  modeText: { ...typography.caption, color: colors.bingo700, fontWeight: '700' },
  factRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  fact: { ...typography.bodyMuted, flex: 1 },
  materials: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xxs, marginTop: spacing.sm },
  materialPill: {
    backgroundColor: colors.neutral100,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
  },
  materialText: { ...typography.caption, color: colors.neutral800 },
  note: { ...typography.body, marginTop: spacing.sm },
  preparation: { ...typography.caption, color: colors.neutral700, marginTop: spacing.xs },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  verified: { ...typography.caption, color: colors.neutral500, flex: 1 },
});
