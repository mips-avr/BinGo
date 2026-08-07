import { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radius, spacing, shadow } from '../../theme';
import { t } from '../../i18n';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Blok abu berdenyut sebagai pengganti konten yang sedang dimuat.
 *
 * Dipakai agar layar tidak sempat menampilkan state kosong ("Belum ada
 * permintaan") pada saat data sebenarnya masih dalam perjalanan — itu pesan
 * yang salah dan membuat pengguna mengira datanya hilang.
 */
export function Skeleton({ width = '100%', height = 16, borderRadius, style }: SkeletonProps) {
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        skeletonStyles.block,
        { width, height, borderRadius: borderRadius ?? radius.xs, opacity: pulse },
        style,
      ]}
    />
  );
}

export interface SkeletonCardProps {
  /** Jumlah baris teks palsu di dalam kartu. */
  lines?: number;
  style?: StyleProp<ViewStyle>;
}

/** Kerangka satu kartu daftar (judul + beberapa baris meta). */
export function SkeletonCard({ lines = 2, style }: SkeletonCardProps) {
  return (
    <View
      style={[skeletonStyles.card, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={t.common.loadingLabel}
    >
      <Skeleton height={18} width="60%" />
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={12}
          width={index === lines - 1 ? '45%' : '85%'}
          style={skeletonStyles.line}
        />
      ))}
    </View>
  );
}

export interface SkeletonListProps {
  count?: number;
  lines?: number;
}

/** Beberapa `SkeletonCard` berurutan untuk placeholder daftar. */
export function SkeletonList({ count = 3, lines = 2 }: SkeletonListProps) {
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={t.common.loadingLabel}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} lines={lines} />
      ))}
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  block: {
    backgroundColor: colors.neutral200,
  },
  card: {
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral100,
    padding: spacing.md,
    ...shadow(1),
  },
  line: {
    marginTop: spacing.xs,
  },
});
