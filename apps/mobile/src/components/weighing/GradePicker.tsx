import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MATERIAL_GRADES, type MaterialGrade } from '@bingo/shared-types';
import { Chip } from '../ui/Chip';
import { colors, radius, spacing, typography } from '../../theme';
import { t } from '../../i18n';

export interface GradePickerProps {
  value: MaterialGrade | null;
  onChange: (next: MaterialGrade) => void;
  error?: string | null;
  testID?: string;
}

/**
 * Urutan mengikuti apa yang paling sering ditimbang di lapangan, bukan urutan
 * kode resin. Grade yang tidak dibeli titik penerima ditaruh paling akhir dan
 * ditandai supaya pemulung tidak membuang waktu mengumpulkannya.
 */
export const GRADE_ORDER: MaterialGrade[] = [
  'PET_BOTOL_BENING',
  'PET_BOTOL_WARNA',
  'PP_GELAS_BENING',
  'PP_GELAS_WARNA',
  'KERTAS_KARDUS',
  'KERTAS_KORAN',
  'KERTAS_ARSIP',
  'KERTAS_DUPLEX',
  'LOGAM_ALUMINIUM',
  'LOGAM_KALENG',
  'LOGAM_BESI',
  'LOGAM_TEMBAGA',
  'PP_PLASTIK_PUTIH',
  'LDPE_KRESEK',
  'PLASTIK_CAMPUR',
  'KACA_BELING',
  'MINYAK_JELANTAH',
  'MULTILAYER_SACHET',
];

export function GradePicker({ value, onChange, error, testID }: GradePickerProps) {
  return (
    <View style={gpS.wrap} testID={testID}>
      <Text style={gpS.label}>{t.weighing.grade}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={gpS.scrollContent}
        accessibilityRole="radiogroup"
      >
        {GRADE_ORDER.map((grade) => {
          const info = MATERIAL_GRADES[grade];
          return (
            <Chip
              key={grade}
              label={info.label}
              caption={info.sellable ? undefined : t.weighing.gradeNotSellable}
              selected={value === grade}
              onPress={() => onChange(grade)}
              accessibilityLabel={
                info.sellable ? info.label : `${info.label} — ${t.weighing.gradeNotSellable}`
              }
              testID={`grade-${grade}`}
            />
          );
        })}
      </ScrollView>

      {value && MATERIAL_GRADES[value].conditions.length > 0 ? (
        <View style={gpS.conditions}>
          <Text style={gpS.conditionsTitle}>{t.weighing.gradeConditionsTitle}</Text>
          {MATERIAL_GRADES[value].conditions.map((c) => (
            <Text key={c} style={gpS.conditionItem}>
              • {c}
            </Text>
          ))}
        </View>
      ) : null}

      {error ? (
        <Text style={gpS.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const gpS = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  label: {
    marginBottom: spacing.xxs + 2,
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral700,
  },
  scrollContent: { paddingVertical: spacing.xxs },
  conditions: {
    marginTop: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.bingo100,
    padding: spacing.sm,
  },
  conditionsTitle: {
    marginBottom: spacing.xxs,
    fontSize: 12,
    fontWeight: '700',
    color: colors.bingo800,
  },
  conditionItem: { fontSize: 13, color: colors.neutral800, lineHeight: 19 },
  error: { marginTop: spacing.xxs, ...typography.error },
});
