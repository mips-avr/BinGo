import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { normalizeRegionKey, type RegionSummaryDto } from '@bingo/shared-types';
import { Input } from '../ui/Input';
import { Skeleton } from '../ui/Skeleton';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useRegions } from '../../features/weighing/hooks';
import { getCurrentLocation } from '../../lib/location';
import { colors, radius, spacing, touch, typography } from '../../theme';
import { t } from '../../i18n';

export interface RegionAutocompleteProps {
  value: string;
  onChange: (region: string) => void;
  label?: string;
  /**
   * Tawarkan tombol "Pakai lokasi saya". Dimatikan pada layar publik yang
   * dibuka pengguna tanpa akun agar tidak meminta izin lokasi tanpa alasan.
   */
  allowLocation?: boolean;
  testID?: string;
}

/** Berapa banyak saran wilayah yang ditampilkan sekaligus. */
const MAX_SUGGESTIONS = 6;

/**
 * Kolom wilayah dengan saran dari wilayah yang benar-benar punya data.
 *
 * Sebelumnya kolom ini teks bebas tanpa petunjuk apa pun. Karena backend
 * mengelompokkan bukti timbang menurut `normalizeRegionKey`, mengetik "Beji"
 * ketika data tercatat sebagai "Beji, Depok" menghasilkan papan kosong, dan
 * pengguna tidak punya cara mengetahui bahwa masalahnya hanya ejaan.
 *
 * Teks bebas tetap dipertahankan: wilayah yang belum punya bukti sama sekali
 * memang tidak akan muncul di daftar, dan pengguna harus tetap bisa mencarinya
 * (hasilnya "data belum cukup" — jawaban yang benar, bukan kebuntuan).
 */
export function RegionAutocomplete({
  value,
  onChange,
  label,
  allowLocation = false,
  testID,
}: RegionAutocompleteProps) {
  const regions = useRegions();
  const [focused, setFocused] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  // Menyaring daftar lokal juga dibuat debounce supaya baris saran tidak
  // menyusun ulang dirinya pada setiap ketukan tombol.
  const debouncedValue = useDebouncedValue(value, 250);

  const suggestions = useMemo<RegionSummaryDto[]>(() => {
    const all = regions.data ?? [];
    const needle = normalizeRegionKey(debouncedValue);
    if (!needle) {
      // Belum mengetik apa-apa: tawarkan wilayah dengan data terbanyak, yang
      // hampir selalu wilayah tempat pengguna berada.
      return [...all].sort((a, b) => b.receiptCount - a.receiptCount).slice(0, MAX_SUGGESTIONS);
    }
    return all
      .filter((region) => region.regionKey.includes(needle) || needle.includes(region.regionKey))
      .sort((a, b) => b.receiptCount - a.receiptCount)
      .slice(0, MAX_SUGGESTIONS);
  }, [regions.data, debouncedValue]);

  const exactMatch = suggestions.some(
    (region) => region.regionKey === normalizeRegionKey(debouncedValue),
  );

  async function useMyLocation() {
    setLocating(true);
    setLocationError(null);
    try {
      const result = await getCurrentLocation();
      // `getCurrentLocation` menyusun alamat sebagai "jalan, kecamatan, provinsi".
      // Papan harga bekerja pada tingkat kecamatan/kota, jadi bagian jalannya
      // dibuang — memasukkannya hanya membuat kunci wilayah tidak pernah cocok.
      const parts = (result.address ?? '').split(',').map((part) => part.trim());
      const region = parts.length > 1 ? parts.slice(1).join(', ') : parts[0];
      if (region) onChange(region);
      else setLocationError(t.pickup.locationFailed);
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : t.pickup.locationFailed);
    } finally {
      setLocating(false);
    }
  }

  const showSuggestions = focused || value.trim().length === 0;

  return (
    <View testID={testID}>
      <Input
        label={label ?? t.weighing.priceBoardRegion}
        placeholder={t.weighing.regionPlaceholder}
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize="words"
        autoCorrect={false}
        testID="price-region"
      />

      {allowLocation ? (
        <Pressable
          onPress={useMyLocation}
          accessibilityRole="button"
          accessibilityLabel={t.weighing.regionUseMyLocation}
          accessibilityState={{ busy: locating }}
          disabled={locating}
          testID="region-use-location"
          style={({ pressed }) => [raS.locationBtn, pressed ? raS.pressed : null]}
        >
          <Feather name="crosshair" size={15} color={colors.bingo700} />
          <Text style={raS.locationText}>
            {locating ? t.weighing.regionLocating : t.weighing.regionUseMyLocation}
          </Text>
        </Pressable>
      ) : null}

      {locationError ? (
        <Text style={raS.error} accessibilityLiveRegion="polite">
          {locationError}
        </Text>
      ) : null}

      {showSuggestions ? (
        <View style={raS.panel}>
          <Text style={raS.panelTitle}>{t.weighing.regionSuggestTitle}</Text>
          <Text style={raS.panelHint}>{t.weighing.regionSuggestHint}</Text>

          {regions.isLoading ? (
            <View style={raS.skeletonWrap}>
              <Skeleton height={18} width="70%" />
              <Skeleton height={18} width="55%" style={raS.skeletonLine} />
            </View>
          ) : suggestions.length === 0 ? (
            <Text style={raS.empty}>{t.weighing.regionNoSuggestion}</Text>
          ) : (
            suggestions.map((region) => (
              <Pressable
                key={region.regionKey}
                onPress={() => onChange(region.label)}
                accessibilityRole="button"
                accessibilityLabel={`${region.label}, ${t.weighing.regionReceiptCount.replace(
                  '{count}',
                  String(region.receiptCount),
                )}`}
                testID={`region-suggestion-${region.regionKey}`}
                style={({ pressed }) => [raS.row, pressed ? raS.pressed : null]}
              >
                <Text style={raS.rowLabel} numberOfLines={1}>
                  {region.label}
                </Text>
                <Text style={raS.rowCount}>
                  {t.weighing.regionReceiptCount.replace('{count}', String(region.receiptCount))}
                </Text>
              </Pressable>
            ))
          )}

          {/* Jalan keluar untuk wilayah yang belum punya bukti sama sekali. */}
          {value.trim().length >= 3 && !exactMatch ? (
            <View style={raS.freeTextRow}>
              <Feather name="edit-3" size={13} color={colors.neutral500} />
              <Text style={raS.freeText} numberOfLines={1}>
                {t.weighing.regionFreeText.replace('{region}', value.trim())}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const raS = StyleSheet.create({
  locationBtn: {
    marginTop: -6,
    marginBottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: touch.minTarget,
    paddingRight: spacing.sm,
  },
  locationText: {
    marginLeft: spacing.xxs + 2,
    fontSize: 13,
    fontWeight: '600',
    color: colors.bingo700,
  },
  pressed: { opacity: 0.7 },
  error: { marginBottom: spacing.xs, ...typography.error },
  panel: {
    marginBottom: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral200,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  panelTitle: { fontSize: 12, fontWeight: '700', color: colors.neutral800 },
  panelHint: { marginTop: 2, marginBottom: spacing.xxs, ...typography.caption },
  skeletonWrap: { paddingVertical: spacing.xs },
  skeletonLine: { marginTop: spacing.xs },
  empty: { paddingVertical: spacing.xs, ...typography.caption },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: touch.minTarget,
    borderTopWidth: 1,
    borderTopColor: colors.neutral100,
  },
  rowLabel: { flex: 1, marginRight: spacing.xs, fontSize: 14, color: colors.neutral900 },
  rowCount: { fontSize: 11, color: colors.neutral500 },
  freeTextRow: {
    marginTop: spacing.xxs,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.neutral100,
    paddingTop: spacing.xs,
  },
  freeText: { marginLeft: spacing.xxs + 2, flex: 1, ...typography.caption },
});
