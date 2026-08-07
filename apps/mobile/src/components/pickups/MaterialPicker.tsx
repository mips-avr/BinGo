import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialType } from '@bingo/shared-types';
import { Chip } from '../ui/Chip';
import { spacing, typography, colors } from '../../theme';
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
        accessibilityRole="radiogroup"
      >
        {ORDER.map((mat) => (
          <Chip
            key={mat}
            label={t.pickup.material_label[mat]}
            selected={value === mat}
            onPress={() => onChange(mat)}
            testID={`material-${mat}`}
          />
        ))}
      </ScrollView>
      {error ? (
        <Text style={mpS.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const mpS = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  label: {
    marginBottom: spacing.xxs + 2,
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral700,
  },
  scrollContent: { paddingVertical: spacing.xxs },
  error: { marginTop: spacing.xxs, ...typography.error },
});
