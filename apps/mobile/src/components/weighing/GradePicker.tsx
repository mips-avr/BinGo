import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MATERIAL_GRADES, type MaterialGrade } from '@bingo/shared-types';
import { colors } from '../../theme/screen';
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
      >
        {GRADE_ORDER.map((grade) => {
          const info = MATERIAL_GRADES[grade];
          const selected = value === grade;
          return (
            <Pressable
              key={grade}
              onPress={() => onChange(grade)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={info.label}
              testID={`grade-${grade}`}
              style={[gpS.chip, selected ? gpS.chipSelected : gpS.chipDefault]}
            >
              <Text
                style={[gpS.chipText, selected ? gpS.chipTextSelected : gpS.chipTextDefault]}
              >
                {info.label}
              </Text>
              {!info.sellable ? <Text style={gpS.notSellable}>tidak dibeli</Text> : null}
            </Pressable>
          );
        })}
      </ScrollView>

      {value && MATERIAL_GRADES[value].conditions.length > 0 ? (
        <View style={gpS.conditions}>
          <Text style={gpS.conditionsTitle}>Syarat agar diterima pada grade ini</Text>
          {MATERIAL_GRADES[value].conditions.map((c) => (
            <Text key={c} style={gpS.conditionItem}>
              • {c}
            </Text>
          ))}
        </View>
      ) : null}

      {error ? <Text style={gpS.error}>{error}</Text> : null}
    </View>
  );
}

const gpS = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { marginBottom: 6, fontSize: 14, fontWeight: '600', color: colors.neutral700 },
  scrollContent: { paddingVertical: 4 },
  chip: {
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipSelected: { borderColor: colors.bingo600, backgroundColor: colors.bingo600 },
  chipDefault: { borderColor: colors.neutral300, backgroundColor: colors.white },
  chipText: { fontSize: 14 },
  chipTextSelected: { fontWeight: '700', color: colors.white },
  chipTextDefault: { fontWeight: '500', color: colors.neutral800 },
  notSellable: { marginTop: 2, fontSize: 10, color: colors.amber700 },
  conditions: {
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: colors.bingo100,
    padding: 12,
  },
  conditionsTitle: {
    marginBottom: 4,
    fontSize: 12,
    fontWeight: '700',
    color: colors.bingo800,
  },
  conditionItem: { fontSize: 13, color: colors.neutral800, lineHeight: 19 },
  error: { marginTop: 4, fontSize: 12, color: colors.red600 },
});
