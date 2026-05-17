import { Pressable, ScrollView, Text, View } from 'react-native';
import { MaterialType } from '@bingo/shared-types';
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
    <View className="mb-3">
      <Text className="mb-1 text-sm font-medium text-neutral-700">{t.pickup.material}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 4 }}
      >
        {ORDER.map((mat) => {
          const selected = value === mat;
          return (
            <Pressable
              key={mat}
              onPress={() => onChange(mat)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              className={`mr-2 rounded-full border px-3 py-2 ${
                selected
                  ? 'border-bingo-600 bg-bingo-600'
                  : 'border-neutral-300 bg-white'
              }`}
            >
              <Text className={`text-sm ${selected ? 'font-semibold text-white' : 'text-neutral-700'}`}>
                {t.pickup.material_label[mat]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {error ? <Text className="mt-1 text-xs text-red-600">{error}</Text> : null}
    </View>
  );
}
