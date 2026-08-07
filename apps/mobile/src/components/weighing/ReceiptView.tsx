import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MATERIAL_GRADES, type WeighingReceiptDto } from '@bingo/shared-types';
import { formatIDR, formatWaktuID } from '@bingo/shared-utils';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { shareReceipt } from '../../features/weighing/share';
import { colors, radius, spacing, typography } from '../../theme';
import { t } from '../../i18n';

export interface ReceiptViewProps {
  receipt: WeighingReceiptDto;
  /**
   * Nama penyetor bila pemanggil mengetahuinya. Bukti timbang hanya membawa
   * `sellerId`, dan UUID mentah tidak berarti apa pun bagi manusia yang sedang
   * memeriksa apakah bukti ini benar miliknya.
   */
  sellerName?: string;
  /** Nama penerbit, bila diketahui pemanggil. */
  issuerName?: string;
}

/**
 * Tampilan bukti timbang, dipakai bersama oleh sisi pemulung dan sisi warga.
 *
 * Aturan tampilan yang tidak boleh diubah: potongan berat dan potongan rupiah
 * selalu muncul sebagai barisnya sendiri, tidak pernah dilebur ke harga per kg.
 * Justru di situ letak gunanya bukti ini — pihak yang menyetor dapat memeriksa
 * dari mana selisih antara nilai kotor dan yang dibayarkan berasal.
 */
export function ReceiptView({ receipt, sellerName, issuerName }: ReceiptViewProps) {
  const [sharing, setSharing] = useState(false);

  async function onShare() {
    setSharing(true);
    const ok = await shareReceipt(receipt, sellerName);
    setSharing(false);
    if (!ok) Alert.alert(t.common.error, t.weighing.shareFailed);
  }

  return (
    <View>
      <Card>
        <View style={s.headerRow}>
          <Text style={s.receiptNo} numberOfLines={1}>
            {receipt.receiptNo}
          </Text>
          <View style={[s.teraBadge, receipt.scaleVerified ? s.teraOk : s.teraMissing]}>
            <Text style={[s.teraText, receipt.scaleVerified ? s.teraTextOk : s.teraTextMissing]}>
              {receipt.scaleVerified ? t.weighing.scaleVerified : t.weighing.scaleUnverified}
            </Text>
          </View>
        </View>
        <Text style={s.partner}>{receipt.partnerName}</Text>
        <Text style={s.meta}>{receipt.region}</Text>
        {receipt.scaleTeraNo ? (
          <Text style={s.meta}>
            {t.weighing.scaleTeraNo}: {receipt.scaleTeraNo}
          </Text>
        ) : null}

        {/* Dua pihak bukti ini. Tanpa keduanya, "bukti" hanyalah selembar
            angka: tidak jelas siapa menyerahkan apa kepada siapa. */}
        <View style={s.partiesRow}>
          <View style={s.partyCol}>
            <Text style={s.partyLabel}>{t.weighing.seller}</Text>
            <Text style={s.partyValue} numberOfLines={2}>
              {sellerName ?? receipt.sellerId}
            </Text>
          </View>
          <View style={s.partyCol}>
            <Text style={s.partyLabel}>{t.weighing.issuedBy}</Text>
            <Text style={s.partyValue} numberOfLines={2}>
              {issuerName ?? receipt.issuedById}
            </Text>
          </View>
        </View>

        <Text style={s.meta}>
          {t.weighing.issuedAt}: {formatWaktuID(receipt.createdAt)}
        </Text>

        {/* Bukti walk-in tetap sah, tetapi harus terlihat berbeda: ia tidak
            menyumbang ke papan harga dan pembacanya berhak tahu itu. */}
        {receipt.walkIn ? (
          <View style={s.walkInBanner} accessibilityRole="text">
            <Feather name="alert-circle" size={16} color={colors.amber800} />
            <View style={s.walkInTextWrap}>
              <Text style={s.walkInTitle}>{t.weighing.walkInBadge}</Text>
              <Text style={s.walkInBody}>{t.weighing.walkInExplain}</Text>
            </View>
          </View>
        ) : null}

        <Button
          label={t.weighing.share}
          variant="secondary"
          size="sm"
          loading={sharing}
          onPress={onShare}
          testID="share-receipt"
          style={s.shareBtn}
        />
      </Card>

      <Text style={s.sectionTitle}>{t.weighing.lines}</Text>

      {receipt.lines.map((line) => {
        const info = MATERIAL_GRADES[line.grade];
        const hasDeduction = line.deductionKg > 0 || line.deductionAmount > 0;
        return (
          <Card key={line.id} style={s.lineCard}>
            <Text style={s.lineGrade}>{info?.label ?? line.grade}</Text>

            <View style={s.kv}>
              <Text style={s.k}>{t.weighing.weightKg}</Text>
              <Text style={s.v}>{line.weightKg} kg</Text>
            </View>

            {line.deductionKg > 0 ? (
              <View style={s.kv}>
                <Text style={s.kDeduction}>{t.weighing.deductionKg}</Text>
                <Text style={s.vDeduction}>−{line.deductionKg} kg</Text>
              </View>
            ) : null}

            <View style={s.kv}>
              <Text style={s.k}>{t.weighing.netWeight}</Text>
              <Text style={s.vStrong}>{line.netWeightKg} kg</Text>
            </View>

            <View style={s.kv}>
              <Text style={s.k}>{t.weighing.pricePerKg}</Text>
              <Text style={s.v}>{formatIDR(line.pricePerKg)} / kg</Text>
            </View>

            <View style={s.divider} />

            <View style={s.kv}>
              <Text style={s.k}>{t.weighing.grossAmount}</Text>
              <Text style={s.v}>{formatIDR(line.grossAmount)}</Text>
            </View>

            {line.deductionAmount > 0 ? (
              <View style={s.kv}>
                <Text style={s.kDeduction}>{t.weighing.deductionAmount}</Text>
                <Text style={s.vDeduction}>−{formatIDR(line.deductionAmount)}</Text>
              </View>
            ) : null}

            <View style={s.kv}>
              <Text style={s.kStrong}>{t.weighing.subtotal}</Text>
              <Text style={s.vStrong}>{formatIDR(line.subtotal)}</Text>
            </View>

            {hasDeduction && line.deductionReason ? (
              <Text style={s.deductionReason}>
                {t.weighing.deductionReason}: {line.deductionReason}
              </Text>
            ) : null}

            {!hasDeduction ? <Text style={s.noDeduction}>{t.weighing.noDeduction}</Text> : null}
          </Card>
        );
      })}

      <Card style={s.totalCard}>
        <View style={s.kv}>
          <Text style={s.k}>{t.weighing.totalWeight}</Text>
          <Text style={s.v}>{receipt.totalWeightKg} kg</Text>
        </View>
        {receipt.totalDeductionKg > 0 ? (
          <View style={s.kv}>
            <Text style={s.kDeduction}>{t.weighing.deductionKg}</Text>
            <Text style={s.vDeduction}>−{receipt.totalDeductionKg} kg</Text>
          </View>
        ) : null}
        <View style={s.kv}>
          <Text style={s.k}>{t.weighing.netWeight}</Text>
          <Text style={s.v}>{receipt.totalNetWeightKg} kg</Text>
        </View>

        <View style={s.divider} />

        <View style={s.kv}>
          <Text style={s.k}>{t.weighing.grossAmount}</Text>
          <Text style={s.v}>{formatIDR(receipt.totalGrossAmount)}</Text>
        </View>
        {receipt.totalDeductionAmount > 0 ? (
          <View style={s.kv}>
            <Text style={s.kDeduction}>{t.weighing.totalDeduction}</Text>
            <Text style={s.vDeduction}>−{formatIDR(receipt.totalDeductionAmount)}</Text>
          </View>
        ) : null}
        <View style={s.kv}>
          <Text style={s.totalLabel}>{t.weighing.totalNet}</Text>
          <Text style={s.totalValue}>{formatIDR(receipt.totalNetAmount)}</Text>
        </View>
      </Card>

      {receipt.notes ? (
        <Card style={s.lineCard}>
          <Text style={s.k}>{t.weighing.notes}</Text>
          <Text style={s.notes}>{receipt.notes}</Text>
        </Card>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  receiptNo: {
    flexShrink: 1,
    marginRight: spacing.xs,
    fontSize: 18,
    fontWeight: '800',
    color: colors.neutral900,
    letterSpacing: 0.5,
  },
  teraBadge: {
    flexShrink: 0,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: spacing.xxs,
  },
  teraOk: { backgroundColor: colors.emerald100 },
  teraMissing: { backgroundColor: colors.amber100 },
  teraText: { fontSize: 11, fontWeight: '700' },
  teraTextOk: { color: colors.emerald800 },
  teraTextMissing: { color: colors.amber800 },
  partner: { marginTop: 10, fontSize: 16, fontWeight: '700', color: colors.neutral900 },
  meta: { marginTop: 4, fontSize: 13, color: colors.neutral600 },
  partiesRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.neutral100,
    paddingTop: spacing.xs,
  },
  partyCol: { flex: 1, paddingRight: spacing.xs },
  partyLabel: typography.overline,
  partyValue: { marginTop: 2, fontSize: 14, fontWeight: '600', color: colors.neutral900 },
  walkInBanner: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radius.sm,
    backgroundColor: colors.amber50,
    borderWidth: 1,
    borderColor: colors.amber100,
    padding: spacing.sm,
  },
  walkInTextWrap: { flex: 1, marginLeft: spacing.xs },
  walkInTitle: { fontSize: 13, fontWeight: '800', color: colors.amber800 },
  walkInBody: { marginTop: 2, fontSize: 12, color: colors.neutral700, lineHeight: 18 },
  shareBtn: { marginTop: spacing.sm },
  sectionTitle: {
    marginTop: spacing.lg,
    marginBottom: 10,
    ...typography.sectionTitle,
  },
  lineCard: { marginBottom: spacing.sm },
  lineGrade: { marginBottom: 10, ...typography.cardTitle },
  kv: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  k: { flex: 1, fontSize: 14, color: colors.neutral600, marginRight: 12 },
  kStrong: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.neutral800, marginRight: 12 },
  kDeduction: { flex: 1, fontSize: 14, color: colors.red600, marginRight: 12 },
  v: { ...typography.numeric, fontSize: 14, fontWeight: '400' },
  vStrong: { ...typography.numeric, fontSize: 14 },
  vDeduction: { ...typography.numeric, fontSize: 14, fontWeight: '600', color: colors.red600 },
  divider: { marginVertical: 8, height: 1, backgroundColor: colors.neutral200 },
  deductionReason: {
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: colors.amber50,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: colors.amber800,
  },
  noDeduction: { marginTop: 8, fontSize: 12, color: colors.neutral500 },
  totalCard: { marginTop: 4 },
  totalLabel: { flex: 1, fontSize: 16, fontWeight: '800', color: colors.neutral900 },
  totalValue: { ...typography.numeric, fontSize: 18, fontWeight: '800', color: colors.bingo700 },
  notes: { marginTop: 6, fontSize: 14, color: colors.neutral800, lineHeight: 20 },
});
