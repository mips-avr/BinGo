import type { ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoider } from '../ui/KeyboardAvoider';
import { colors, fonts, radius, spacing } from '../../theme';

interface AuthPageProps {
  children: ReactNode;
  contentWidth?: number;
}

/** Ponsel memakai satu kolom; web desktop memakai panel identitas dan kartu form. */
export function AuthPage({ children, contentWidth = 460 }: AuthPageProps) {
  const { width } = useWindowDimensions();
  const desktop = Platform.OS === 'web' && width >= 900;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={[styles.layout, desktop ? styles.layoutDesktop : null]}>
        {desktop ? <DesktopIntro /> : null}
        <KeyboardAvoider style={styles.formRegion}>
          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              desktop ? styles.scrollDesktop : styles.scrollMobile,
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.formCard,
                desktop ? styles.formCardDesktop : null,
                { maxWidth: contentWidth },
              ]}
            >
              {!desktop ? (
                <View style={styles.mobileBrand}>
                  <Text style={styles.mobileMark} accessibilityLabel="BinGo">♻️</Text>
                  <View>
                    <Text style={styles.mobileName}>BinGo</Text>
                    <Text style={styles.mobileTagline}>Layanan sampah yang lebih tertata</Text>
                  </View>
                </View>
              ) : null}
              {children}
            </View>
          </ScrollView>
        </KeyboardAvoider>
      </View>
    </SafeAreaView>
  );
}

function DesktopIntro() {
  return (
    <View style={styles.intro}>
      <View style={styles.brandRow}>
        <Text style={styles.brandMark}>♻️</Text>
        <Text style={styles.brandName}>BinGo</Text>
      </View>
      <View style={styles.introBody}>
        <Text style={styles.eyebrow}>PLATFORM PENGELOLAAN SAMPAH</Text>
        <Text style={styles.headline}>Satu ruang kerja untuk layanan, material, dan dampak.</Text>
        <Text style={styles.introCopy}>
          Hubungkan warga, petugas, pengelola, dan pengolah melalui proses yang tercatat.
        </Text>
        <View style={styles.featureList}>
          <Feature icon="01" text="Kelola layanan wilayah dan jadwal pengumpulan" />
          <Feature icon="02" text="Catat hasil timbang dan persediaan material" />
          <Feature icon="03" text="Temukan pasokan untuk diolah kembali" />
        </View>
      </View>
      <Text style={styles.demoLabel}>LINGKUNGAN DEMO KOMPETISI</Text>
    </View>
  );
}

function Feature({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.feature}>
      <View style={styles.featureIcon}>
        <Text style={styles.featureIconText}>{icon}</Text>
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.neutral50 },
  layout: { flex: 1 },
  layoutDesktop: { flexDirection: 'row', minHeight: 700 },
  intro: {
    width: '42%',
    minWidth: 390,
    maxWidth: 620,
    padding: 48,
    backgroundColor: colors.bingo800,
    justifyContent: 'space-between',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  brandMark: { fontSize: 34 },
  brandName: { color: colors.white, fontSize: 29, fontFamily: fonts.extraBold },
  introBody: { maxWidth: 460 },
  eyebrow: { color: colors.bingo200, fontSize: 12, fontFamily: fonts.bold, letterSpacing: 1.1 },
  headline: {
    marginTop: spacing.md,
    color: colors.white,
    fontSize: 38,
    lineHeight: 46,
    fontFamily: fonts.extraBold,
  },
  introCopy: { marginTop: spacing.md, color: colors.whiteAlpha85, fontSize: 16, lineHeight: 25, fontFamily: fonts.regular },
  featureList: { marginTop: spacing.xxl, gap: spacing.md },
  feature: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.whiteAlpha20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIconText: { color: colors.white, fontSize: 11, fontFamily: fonts.extraBold },
  featureText: { flex: 1, color: colors.whiteAlpha90, fontSize: 14, lineHeight: 20, fontFamily: fonts.semiBold },
  demoLabel: { color: colors.bingo200, fontSize: 11, fontFamily: fonts.bold, letterSpacing: 0.8 },
  formRegion: { flex: 1 },
  scroll: { flexGrow: 1, width: '100%' },
  scrollDesktop: { padding: 48, justifyContent: 'center', alignItems: 'center' },
  scrollMobile: { padding: spacing.lg, justifyContent: 'center' },
  formCard: { width: '100%' },
  formCardDesktop: {
    padding: 36,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral200,
    boxShadow: '0 20px 60px rgba(23, 23, 23, 0.10)',
  },
  mobileBrand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xxl },
  mobileMark: { fontSize: 40 },
  mobileName: { color: colors.bingo800, fontSize: 28, fontFamily: fonts.extraBold },
  mobileTagline: { marginTop: 2, color: colors.neutral600, fontSize: 13, fontFamily: fonts.regular },
});
