import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialType } from '@bingo/shared-types';
import { colors, shadow } from '../../theme/screen';
import { t } from '../../i18n';

export interface MaterialPickerProps {
  value: MaterialType | null;
  onChange: (next: MaterialType) => void;
  error?: string | null;
}

const ORDER: MaterialType[] = [
  MaterialType.PET,
  MaterialType.HDPE,
  MaterialType.PP,
  MaterialType.LDPE,
  MaterialType.OTHER_PLASTIC,
  MaterialType.PAPER,
  MaterialType.METAL,
  MaterialType.GLASS,
  MaterialType.ORGANIC,
  MaterialType.PS,
  MaterialType.PVC,
  MaterialType.MIXED,
];

export function MaterialPicker({ value, onChange, error }: MaterialPickerProps) {
  return (
    <View style={mpS.wrap}>
      <Text style={mpS.label}>{t.pickup.material}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={mpS.scrollContent}
      >
        {ORDER.map((mat) => {
          const selected = value === mat;
          return (
            <Pressable
              key={mat}
              onPress={() => onChange(mat)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={[mpS.chip, selected ? mpS.chipSelected : mpS.chipDefault]}
            >
              <Text style={[mpS.chipText, selected ? mpS.chipTextSelected : mpS.chipTextDefault]}>
                {t.pickup.material_label[mat]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {error ? <Text style={mpS.error}>{error}</Text> : null}
    </View>
  );
}

const mpS = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { marginBottom: 6, fontSize: 14, fontWeight: '600', color: colors.neutral700 },
  scrollContent: { paddingVertical: 4 },
  chip: {
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipSelected: {
    borderColor: colors.bingo600,
    backgroundColor: colors.bingo600,
  },
  chipDefault: {
    borderColor: colors.neutral300,
    backgroundColor: colors.white,
  },
  chipText: { fontSize: 14 },
  chipTextSelected: { fontWeight: '700', color: colors.white },
  chipTextDefault: { fontWeight: '500', color: colors.neutral800 },
  error: { marginTop: 4, fontSize: 12, color: colors.red600 },
});
