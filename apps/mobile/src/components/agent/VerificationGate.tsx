import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { VerificationLevel } from '@bingo/shared-types';
import { HIGH_VALUE_MIN_WEIGHT_KG } from '@bingo/shared-types';
import { Button } from '../ui/Button';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import { t } from '../../i18n';

/** Alasan sebuah pekerjaan tidak dapat diambil. */
export type VerificationGateReason =
  | { kind: 'needsAttestation' }
  | { kind: 'highValue'; weightKg: number; level: VerificationLevel };

export interface VerificationGateProps {
  reason: VerificationGateReason | null;
  onClose: () => void;
}

/**
 * Layar penjelasan yang muncul ketika pemulung menekan "Ambil" tetapi belum
 * boleh mengambilnya.
 *
 * Sengaja bukan `Alert.alert` dengan pesan galat mentah dari server. Pemulung
 * yang menekan tombol dan mendapat kalimat "403 Forbidden" — atau bahkan
 * kalimat Indonesia yang panjang di dalam kotak dialog sistem — akan
 * menyimpulkan aplikasinya rusak, bukan bahwa ia perlu meminta penjaminan.
 * Yang perlu ia lihat justru tiga hal: mengapa ditolak, apa langkah
 * berikutnya, dan apa yang tetap boleh ia lakukan sekarang.
 *
 * Bagian terakhir penting: papan harga dan radar tetap terbuka untuk Tingkat 0,
 * dan itulah inti rancangannya. Menutup layar ini tanpa menyebutkannya akan
 * membuat penolakan terasa seperti pintu tertutup.
 */
export function VerificationGate({ reason, onClose }: VerificationGateProps) {
  const visible = reason !== null;
  const isHighValue = reason?.kind === 'highValue';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      testID="verification-gate"
    >
      <Pressable style={gateS.backdrop} onPress={onClose} accessibilityLabel={t.common.close}>
        {/* Pressable dalam tanpa onPress menahan ketukan supaya isi kartu tidak
            ikut menutup layar ini. */}
        <Pressable style={gateS.sheet} onPress={() => {}}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={gateS.iconWrap}>
              <Feather
                name={isHighValue ? 'trending-up' : 'shield'}
                size={26}
                color={colors.bingo700}
              />
            </View>

            <Text style={gateS.title} accessibilityRole="header">
              {isHighValue ? t.agent.verification.highValueTitle : t.agent.verification.gateTitle}
            </Text>

            <Text style={gateS.body}>
              {isHighValue && reason
                ? t.agent.verification.highValueBody
                    .replace('{weight}', String(reason.weightKg))
                    .replace('{level}', String(reason.level))
                : t.agent.verification.gateBody}
            </Text>

            {isHighValue ? (
              <>
                <Text style={gateS.sectionTitle}>{t.agent.verification.criteriaTitle}</Text>
                <Bullet text={t.agent.verification.criteriaSecondInstitution} />
                <Bullet text={t.agent.verification.criteriaDisputeless} />
                <Bullet text={t.agent.verification.criteriaPeer} />
                <Text style={gateS.footnote}>
                  {t.agent.verification.highValueBadge} ≥ {HIGH_VALUE_MIN_WEIGHT_KG} kg
                </Text>
              </>
            ) : (
              <Text style={gateS.steps}>{t.agent.verification.gateSteps}</Text>
            )}

            <Button
              label={t.agent.verification.gateCta}
              onPress={onClose}
              testID="verification-gate-close"
              style={gateS.cta}
            />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={gateS.bulletRow}>
      <Text style={gateS.bulletDot}>•</Text>
      <Text style={gateS.bulletText}>{text}</Text>
    </View>
  );
}

const gateS = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlayDark,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  sheet: {
    maxHeight: '85%',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow(4),
  },
  iconWrap: {
    alignSelf: 'flex-start',
    height: 46,
    width: 46,
    borderRadius: 23,
    backgroundColor: colors.bingo100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { ...typography.sectionTitle },
  body: { marginTop: spacing.xs, ...typography.body },
  steps: { marginTop: spacing.sm, ...typography.body, fontWeight: '600' },
  sectionTitle: { marginTop: spacing.md, ...typography.overline },
  bulletRow: { flexDirection: 'row', marginTop: spacing.xxs },
  bulletDot: { marginRight: spacing.xs, ...typography.body },
  bulletText: { flex: 1, ...typography.body },
  footnote: { marginTop: spacing.sm, ...typography.caption },
  cta: { marginTop: spacing.lg },
});
