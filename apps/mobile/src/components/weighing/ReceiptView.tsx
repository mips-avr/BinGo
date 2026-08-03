import { StyleSheet, Text, View } from 'react-native';
import { MATERIAL_GRADES, type WeighingReceiptDto } from '@bingo/shared-types';
import { formatIDR, formatWaktuID } from '@bingo/shared-utils';
import { Card } from '../ui/Card';
import { colors } from '../../theme/screen';
import { t } from '../../i18n';

export interface ReceiptViewProps {
  receipt: WeighingReceiptDto;
}

/**
 * Tampilan bukti timbang, dipakai bersama oleh sisi pemulung dan sisi warga.
 *
 * Aturan tampilan yang tidak boleh diubah: potongan berat dan potongan rupiah
 * selalu muncul sebagai barisnya sendiri, tidak pernah dilebur ke harga per kg.
 * Justru di situ letak gunanya bukti ini — pihak yang menyetor dapat memeriksa
 * dari mana selisih antara nilai kotor dan yang dibayarkan berasal.
 */
export function ReceiptView({ receipt }: ReceiptViewProps) {
  return (
    <View>
      <Card>
        <View style={s.headerRow}>
          <Text style={s.receiptNo}>{receipt.receiptNo}</Text>
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
        <Text style={s.meta}>
          {t.weighing.issuedAt}: {formatWaktuID(receipt.createdAt)}
        </Text>
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
  receiptNo: { fontSize: 18, fontWeight: '800', color: colors.neutral900, letterSpacing: 0.5 },
  teraBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  teraOk: { backgroundColor: colors.emerald100 },
  teraMissing: { backgroundColor: colors.amber100 },
  teraText: { fontSize: 11, fontWeight: '700' },
  teraTextOk: { color: colors.emerald800 },
  teraTextMissing: { color: colors.amber800 },
  partner: { marginTop: 10, fontSize: 16, fontWeight: '700', color: colors.neutral900 },
  meta: { marginTop: 4, fontSize: 13, color: colors.neutral600 },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral900,
  },
  lineCard: { marginBottom: 12 },
  lineGrade: { marginBottom: 10, fontSize: 15, fontWeight: '700', color: colors.neutral900 },
  kv: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  k: { flex: 1, fontSize: 14, color: colors.neutral600, marginRight: 12 },
  kStrong: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.neutral800, marginRight: 12 },
  kDeduction: { flex: 1, fontSize: 14, color: colors.red600, marginRight: 12 },
  v: { fontSize: 14, color: colors.neutral900 },
  vStrong: { fontSize: 14, fontWeight: '700', color: colors.neutral900 },
  vDeduction: { fontSize: 14, fontWeight: '600', color: colors.red600 },
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
  totalValue: { fontSize: 18, fontWeight: '800', color: colors.bingo700 },
  notes: { marginTop: 6, fontSize: 14, color: colors.neutral800, lineHeight: 20 },
});
