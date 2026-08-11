import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import {
  gradesForMaterial,
  INGUB_CATEGORY_ACTION,
  INGUB_CATEGORY_LABEL,
  ingubCategoryFor,
  type MaterialGrade,
  type MaterialType,
} from '@bingo/shared-types';

import { useNearbyDropPoints } from '../../features/drop-points/hooks';
import { usePriceBoard } from '../../features/weighing/hooks';
import { t } from '../../i18n';
import { getCurrentLocation } from '../../lib/location';
import { colors, radius, spacing, typography } from '../../theme';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { DropPointCard } from '../drop-points/DropPointCard';
import { RegionAutocomplete } from '../weighing/RegionAutocomplete';

function rupiah(value: number): string {
  return `Rp${value.toLocaleString('id-ID')}`;
}

export interface ScanNextStepsProps {
  materialType: MaterialType;
  materialGrade?: MaterialGrade | null;
}

/**
 * Apa yang terjadi SETELAH sesuatu dikenali.
 *
 * Sampai sekarang TrashScan berhenti pada "ini plastik PET" — benar, tetapi
 * tidak menjawab satu pun pertanyaan yang sebenarnya dimiliki orang yang
 * memegang botol itu: berapa nilainya, dan ke mana dibawa. Blok ini menjawab
 * keduanya, dan urutannya disengaja: kewajiban dulu, harga, baru tujuan.
 *
 * Soal harga, satu hal harus jelas dan tidak boleh dikaburkan: yang ditampilkan
 * adalah **rentang dari bukti timbang nyata di wilayah itu**, bukan tarif yang
 * BinGo tetapkan. BinGo tidak menetapkan harga apa pun. Karena satu jenis
 * material dapat jatuh ke beberapa grade dengan harga berbeda jauh — botol PET
 * bening dan berwarna bisa terpaut beberapa kali lipat — yang ditampilkan
 * adalah semua grade yang mungkin, bukan satu angka tunggal yang terkesan
 * pasti padahal tidak.
 */
export function ScanNextSteps({ materialType, materialGrade = null }: ScanNextStepsProps) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [region, setRegion] = useState('');
  const [locating, setLocating] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);

  const category = ingubCategoryFor(materialType);
  const candidateGrades = useMemo(() => {
    const grades = gradesForMaterial(materialType);
    return materialGrade ? grades.filter((grade) => grade.grade === materialGrade) : grades;
  }, [materialGrade, materialType]);

  const askLocation = useCallback(async () => {
    setLocating(true);
    try {
      const result = await getCurrentLocation();
      setCoords({ lat: result.coords.lat, lng: result.coords.lng });
      const address = result.address;
      if (address) {
        // Segmen pertama alamat adalah nama jalan; papan harga bekerja di
        // tingkat kecamatan/kota, jadi segmen itu dibuang. Pola yang sama
        // dipakai tombol "Pakai lokasi saya" pada papan harga.
        const parts = address
          .split(',')
          .map((part: string) => part.trim())
          .filter(Boolean);
        setRegion(parts.slice(1).join(', ') || address);
      }
    } catch {
      setLocationDenied(true);
    } finally {
      setLocating(false);
    }
  }, []);

  useEffect(() => {
    void askLocation();
  }, [askLocation]);

  const priceQuery = usePriceBoard(region, 7, null);
  const dropQuery = useNearbyDropPoints(coords, materialType);

  const bands = useMemo(() => {
    const wanted = new Set(candidateGrades.map((g) => g.grade));
    return (priceQuery.data?.bands ?? []).filter((b) => wanted.has(b.grade));
  }, [priceQuery.data, candidateGrades]);

  return (
    <View>
      {/* 1 — Kewajiban pilah. Ini berlaku bagi semua orang di Jakarta sejak
          10 Mei 2026, terlepas dari apakah materialnya bernilai jual. */}
      <Card style={s.mt12}>
        <Text style={s.overline}>{t.scanNext.ingubTitle}</Text>
        <View style={s.categoryRow}>
          <View style={s.categoryPill}>
            <Text style={s.categoryText}>{INGUB_CATEGORY_LABEL[category]}</Text>
          </View>
        </View>
        <Text style={s.body}>{INGUB_CATEGORY_ACTION[category]}</Text>
        <Text style={s.footnote}>{t.scanNext.ingubSource}</Text>
      </Card>

      {/* 2 — Harga. */}
      <Card style={s.mt12}>
        <Text style={s.overline}>{t.scanNext.priceTitle}</Text>

        {!region ? (
          <>
            {/*
              Tiga keadaan berbeda, dan membedakannya penting.

              Lokasi belum diminta, lokasi ditolak, dan lokasi DIDAPAT tetapi
              nama wilayahnya tidak terbaca — yang terakhir ini sering terjadi
              karena geocoding terbalik butuh jaringan dan kerap gagal. Dulu
              ketiganya sama-sama menampilkan "izinkan lokasi", sehingga
              pengguna yang sudah mengizinkan lokasi diminta mengizinkannya
              lagi dan tidak pernah bisa keluar dari keadaan itu. Ketika
              koordinatnya sudah ada, yang kurang tinggal nama wilayahnya —
              jadi yang ditawarkan adalah mengetiknya, bukan mengulang izin.
            */}
            <Text style={s.body}>
              {coords
                ? t.scanNext.priceRegionUnknown
                : locationDenied
                  ? t.scanNext.priceNeedsLocationDenied
                  : t.scanNext.priceNeedsLocation}
            </Text>
            {coords ? (
              <View style={s.mt8}>
                <RegionAutocomplete value={region} onChange={setRegion} allowLocation={false} />
              </View>
            ) : (
              <Button
                label={locating ? t.dropPoint.locating : t.dropPoint.useLocation}
                variant="secondary"
                onPress={() => void askLocation()}
                loading={locating}
                style={s.mt8}
              />
            )}
          </>
        ) : priceQuery.isLoading ? (
          <ActivityIndicator color={colors.bingo600} style={s.mt8} />
        ) : bands.length === 0 ? (
          <Text style={s.body}>
            {t.scanNext.priceInsufficient.replace('{region}', region)}
          </Text>
        ) : (
          <>
            <Text style={s.footnote}>{t.scanNext.priceRegionNote.replace('{region}', region)}</Text>
            {bands.map((b) => (
              <View key={b.grade} style={s.bandRow}>
                <View style={s.bandLabel}>
                  <Text style={s.bandName}>{b.label}</Text>
                  <Text style={s.bandMeta}>
                    {t.scanNext.priceSample
                      .replace('{samples}', String(b.sampleCount))
                      .replace('{partners}', String(b.partnerCount))}
                  </Text>
                </View>
                <View style={s.bandValue}>
                  <Text style={s.bandMedian}>{rupiah(b.median)}</Text>
                  <Text style={s.bandRange}>
                    {rupiah(b.p25)}–{rupiah(b.p75)}
                  </Text>
                </View>
              </View>
            ))}
            <Text style={s.footnote}>{t.scanNext.priceDisclaimer}</Text>
          </>
        )}

        {candidateGrades.length > 1 ? (
          <View style={s.warnRow}>
            <Feather name="alert-circle" size={14} color={colors.amber700} />
            <Text style={s.warnText}>{t.scanNext.priceGradeWarning}</Text>
          </View>
        ) : null}
      </Card>

      {/* 3 — Ke mana dibawa. Termasuk titik milik operator lain: mengirim orang
          ke tempat yang paling tepat lebih berguna daripada menahannya di
          jaringan sendiri. */}
      <Card style={s.mt12}>
        <Text style={s.overline}>{t.dropPoint.nearbyTitle}</Text>
        {!coords ? (
          <Text style={s.body}>{t.scanNext.dropNeedsLocation}</Text>
        ) : dropQuery.isLoading ? (
          <ActivityIndicator color={colors.bingo600} style={s.mt8} />
        ) : dropQuery.isError ? (
          <Text style={s.body}>{t.dropPoint.loadError}</Text>
        ) : (dropQuery.data?.length ?? 0) === 0 ? (
          <>
            <Text style={s.body}>{t.dropPoint.empty}</Text>
            <Text style={s.footnote}>{t.dropPoint.emptyHint}</Text>
          </>
        ) : (
          <Text style={s.footnote}>{t.dropPoint.disclaimer}</Text>
        )}
      </Card>

      {(dropQuery.data ?? []).map((p) => (
        <DropPointCard key={p.id} point={p} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  mt8: { marginTop: spacing.xs },
  mt12: { marginTop: spacing.sm },
  overline: { ...typography.overline, color: colors.neutral600, marginBottom: spacing.xxs },
  body: { ...typography.body, marginTop: spacing.xxs },
  footnote: { ...typography.caption, color: colors.neutral500, marginTop: spacing.xs },
  categoryRow: { flexDirection: 'row', marginTop: spacing.xxs },
  categoryPill: {
    backgroundColor: colors.bingo100,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  categoryText: { ...typography.caption, color: colors.bingo800, fontWeight: '700' },
  bandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral100,
  },
  bandLabel: { flex: 1 },
  bandName: { ...typography.body, fontWeight: '600' },
  bandMeta: { ...typography.caption, color: colors.neutral500, marginTop: 2 },
  bandValue: { alignItems: 'flex-end' },
  bandMedian: { ...typography.numeric, color: colors.bingo700, fontWeight: '700' },
  bandRange: { ...typography.caption, color: colors.neutral600 },
  warnRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.sm,
    backgroundColor: colors.amber50,
    borderRadius: radius.sm,
    padding: spacing.xs,
  },
  warnText: { ...typography.caption, color: colors.amber800, flex: 1 },
});
