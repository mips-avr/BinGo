import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, shadow, touch, typography } from '../../theme';
import { t } from '../../i18n';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  canGoBack?: boolean;
  trailing?: React.ReactNode;
  /**
   * `onDark` dipakai bila header berdiri di atas pratinjau kamera. Warna teks
   * gelap default tidak terbaca di sana, dan kecerahan gambar kamera berubah
   * terus sehingga tidak bisa diandalkan sebagai latar.
   */
  tone?: 'default' | 'onDark';
}

export function ScreenHeader({
  title,
  subtitle,
  canGoBack = true,
  trailing,
  tone = 'default',
}: ScreenHeaderProps) {
  const onDark = tone === 'onDark';
  const router = useRouter();
  return (
    <View style={[headerStyles.container, onDark ? headerStyles.containerOnDark : null]}>
      <View style={headerStyles.leading}>
        {canGoBack ? (
          // Kontrol yang paling sering dipakai di aplikasi — 44×44 penuh,
          // bukan 40×40 seperti sebelumnya.
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t.common.back}
            testID="screen-header-back"
            style={({ pressed }) => [headerStyles.backBtn, pressed ? headerStyles.pressed : null]}
          >
            <Feather name="chevron-left" size={24} color={onDark ? colors.white : colors.bingo700} />
          </Pressable>
        ) : null}
        <View style={headerStyles.titleWrap}>
          <Text
            style={[headerStyles.title, onDark ? headerStyles.titleOnDark : null]}
            numberOfLines={1}
            accessibilityRole="header"
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[headerStyles.subtitle, onDark ? headerStyles.subtitleOnDark : null]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {trailing ? <View style={headerStyles.trailing}>{trailing}</View> : null}
    </View>
  );
}

const headerStyles = StyleSheet.create({
  containerOnDark: { backgroundColor: colors.overlayDark },
  titleOnDark: { color: colors.white },
  subtitleOnDark: { color: colors.whiteAlpha85 },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  leading: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: spacing.sm,
    height: touch.minTarget,
    width: touch.minTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral200,
    ...shadow(1),
  },
  pressed: { opacity: 0.7 },
  titleWrap: {
    flex: 1,
  },
  title: typography.headerTitle,
  subtitle: {
    ...typography.bodyMuted,
    marginTop: 2,
  },
  trailing: {
    marginLeft: spacing.sm,
  },
});
