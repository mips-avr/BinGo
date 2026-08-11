import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { LatLng } from '@bingo/shared-types';
import { getCurrentLocation } from '../../lib/location';
import { colors, radius, spacing, touch, typography } from '../../theme';
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
      setPermissionError(e instanceof Error ? e.message : t.pickup.locationFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={lpS.wrap}>
      <Text style={lpS.label}>{t.pickup.locationLabel}</Text>
      <View style={lpS.card}>
        <Text style={lpS.hint}>{t.pickup.locationHint}</Text>
        {value ? (
          <Text style={lpS.coords}>
            📍 {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
          </Text>
        ) : (
          <Text style={lpS.placeholder}>—</Text>
        )}
        <Pressable
          onPress={pick}
          accessibilityRole="button"
          accessibilityLabel={t.pickup.locationPick}
          accessibilityState={{ disabled: loading, busy: loading }}
          disabled={loading}
          testID="location-pick"
          style={({ pressed }) => [lpS.pickBtn, pressed ? lpS.pickBtnPressed : null]}
        >
          {loading ? (
            <ActivityIndicator color={colors.bingo700} />
          ) : (
            <Text style={lpS.pickBtnText}>{t.pickup.locationPick}</Text>
          )}
        </Pressable>
      </View>
      {permissionError ? (
        <Text style={lpS.error}>{permissionError}</Text>
      ) : error ? (
        <Text style={lpS.error}>{error}</Text>
      ) : null}
    </View>
  );
}

const lpS = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  label: {
    marginBottom: spacing.xxs + 2,
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral700,
  },
  card: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.neutral300,
    backgroundColor: colors.white,
    padding: 12,
  },
  hint: { fontSize: 12, color: colors.neutral600 },
  coords: { marginTop: 8, fontSize: 16, fontWeight: '600', color: colors.neutral900 },
  placeholder: { marginTop: 8, fontSize: 16, color: colors.neutral400 },
  pickBtn: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xs,
    backgroundColor: colors.bingo100,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    minHeight: touch.minTarget,
  },
  pickBtnPressed: { opacity: 0.7 },
  pickBtnText: { fontSize: 14, fontWeight: '700', color: colors.bingo700 },
  error: { marginTop: spacing.xxs, ...typography.error },
});
