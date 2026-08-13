import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialType, type LatLng } from '@bingo/shared-types';
import { Button } from '../../../src/components/ui/Button';
import { KeyboardAvoider } from '../../../src/components/ui/KeyboardAvoider';
import { useBottomInset } from '../../../src/hooks/useBottomInset';
import { Input } from '../../../src/components/ui/Input';
import { MaterialPicker } from '../../../src/components/pickups/MaterialPicker';
import { LocationPicker } from '../../../src/components/pickups/LocationPicker';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { useCreatePickup } from '../../../src/features/pickups/hooks';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { colors, spacing, typography } from '../../../src/theme';
import { t } from '../../../src/i18n';

interface FormErrors {
  location?: string;
  address?: string;
  material?: string;
  weight?: string;
}

const MATERIAL_VALUES = Object.values(MaterialType) as MaterialType[];

export default function NewPickupScreen() {
  const router = useRouter();
  const bottomInset = useBottomInset();
  const params = useLocalSearchParams<{ materialType?: string }>();
  const create = useCreatePickup();

  const initialMaterial =
    params.materialType && MATERIAL_VALUES.includes(params.materialType as MaterialType)
      ? (params.materialType as MaterialType)
      : null;

  const [location, setLocation] = useState<LatLng | null>(null);
  const [address, setAddress] = useState('');
  const [material, setMaterial] = useState<MaterialType | null>(initialMaterial);
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!location) e.location = t.pickup.errors.locationRequired;
    if (address.trim().length < 3) e.address = t.pickup.errors.addressMin;
    if (!material) e.material = t.pickup.errors.materialRequired;
    const w = Number(weight.replace(',', '.'));
    if (!Number.isFinite(w) || w <= 0) e.weight = t.pickup.errors.weightPositive;
    else if (w > 9999.99) e.weight = t.pickup.errors.weightMax;
    return e;
  }

  async function onSubmit() {
    setSubmitError(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    try {
      await create.mutateAsync({
        location: location as LatLng,
        address: address.trim(),
        materialType: material as MaterialType,
        estimatedWeightKg: Number(weight.replace(',', '.')),
        notes: notes.trim() || undefined,
      });
      router.back();
    } catch (err) {
      setSubmitError(extractApiErrorMessage(err, t.common.error));
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title={t.pickup.create} />
      {/* Formulir ini dulu sama sekali tidak menghindari papan ketik: kolom
          catatan berada di bawah dan tertutup keyboard saat diisi. */}
      <KeyboardAvoider>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[s.scrollContent, { paddingBottom: bottomInset }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <LocationPicker
            value={location}
            onChange={(coords, autoAddress) => {
              setLocation(coords);
              if (autoAddress && !address) setAddress(autoAddress);
            }}
            error={errors.location}
          />

          <Input
            label={t.pickup.address}
            value={address}
            onChangeText={setAddress}
            placeholder={t.pickup.addressPlaceholder}
            error={errors.address}
          />

          <MaterialPicker value={material} onChange={setMaterial} error={errors.material} />

          <Input
            label={t.pickup.weight}
            value={weight}
            onChangeText={setWeight}
            placeholder={t.pickup.weightPlaceholder}
            keyboardType="decimal-pad"
            error={errors.weight}
          />

          <Input
            label={t.pickup.notes}
            value={notes}
            onChangeText={setNotes}
            placeholder={t.pickup.notesPlaceholder}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {submitError ? (
            <Text style={s.errorText} accessibilityLiveRegion="polite">
              {submitError}
            </Text>
          ) : null}

          <Button
            label={t.pickup.create}
            onPress={onSubmit}
            loading={create.isPending}
            testID="submit-pickup"
            style={s.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoider>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg },
  errorText: { marginBottom: spacing.sm, ...typography.body, color: colors.red600 },
  submitBtn: { marginTop: spacing.xs },
});
