import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import type { LatLng } from '@bingo/shared-types';
import { getCurrentLocation } from '../../lib/location';
import { t } from '../../i18n';

export interface LocationPickerProps {
  value: LatLng | null;
  onChange: (next: LatLng, address?: string) => void;
  error?: string | null;
}

export function LocationPicker({ value, onChange, error }: LocationPickerProps) {
  const [loading, setLoading] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  async function pick() {
    setLoading(true);
    setPermissionError(null);
    try {
      const res = await getCurrentLocation();
      onChange(res.coords, res.address);
    } catch (e) {
      setPermissionError(e instanceof Error ? e.message : 'Gagal mengambil lokasi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="mb-3">
      <Text className="mb-1 text-sm font-medium text-neutral-700">{t.pickup.locationLabel}</Text>
      <View className="rounded-xl border border-neutral-300 bg-white p-3">
        <Text className="text-xs text-neutral-500">{t.pickup.locationHint}</Text>
        {value ? (
          <Text className="mt-2 text-base font-semibold text-neutral-900">
            📍 {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
          </Text>
        ) : (
          <Text className="mt-2 text-base text-neutral-400">—</Text>
        )}
        <Pressable
          onPress={pick}
          accessibilityRole="button"
          disabled={loading}
          className="mt-3 flex-row items-center justify-center rounded-lg bg-bingo-50 px-3 py-2 active:opacity-70"
        >
          {loading ? (
            <ActivityIndicator color="#15803D" />
          ) : (
            <Text className="text-sm font-semibold text-bingo-700">{t.pickup.locationPick}</Text>
          )}
        </Pressable>
      </View>
      {permissionError ? (
        <Text className="mt-1 text-xs text-red-600">{permissionError}</Text>
      ) : error ? (
        <Text className="mt-1 text-xs text-red-600">{error}</Text>
      ) : null}
    </View>
  );
}
