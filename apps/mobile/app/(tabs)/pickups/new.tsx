import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialType, type LatLng } from '@bingo/shared-types';
import { Button } from '../../../src/components/ui/Button';
import { Input } from '../../../src/components/ui/Input';
import { MaterialPicker } from '../../../src/components/pickups/MaterialPicker';
import { LocationPicker } from '../../../src/components/pickups/LocationPicker';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { useCreatePickup } from '../../../src/features/pickups/hooks';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
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
    if (!location) e.location = 'Tentukan titik penjemputan terlebih dahulu';
    if (address.trim().length < 3) e.address = 'Alamat minimal 3 karakter';
    if (!material) e.material = 'Pilih jenis material';
    const w = Number(weight.replace(',', '.'));
    if (!Number.isFinite(w) || w <= 0) e.weight = 'Estimasi berat harus lebih dari 0';
    else if (w > 9999.99) e.weight = 'Estimasi berat maksimal 9999.99 kg';
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
      Alert.alert(t.common.success, t.pickup.createSuccess, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      setSubmitError(extractApiErrorMessage(err, t.common.error));
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bingo-50" edges={['top']}>
      <ScreenHeader title={t.pickup.create} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
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
          <Text className="mb-3 text-sm text-red-600">{submitError}</Text>
        ) : null}

        <View className="mt-2">
          <Button
            label={t.pickup.create}
            onPress={onSubmit}
            loading={create.isPending}
            testID="submit-pickup"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
