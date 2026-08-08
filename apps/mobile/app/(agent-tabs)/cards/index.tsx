import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { isValidCardNumber, normalizeCardNumber } from '@bingo/shared-types';

import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { Input } from '../../../src/components/ui/Input';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { useNfcTag } from '../../../src/features/nfc/useNfcTag';
import { useCardLookup, useIssueCard, useIssuedCards } from '../../../src/features/member-cards/hooks';
import { useBottomInset } from '../../../src/hooks/useBottomInset';
import { t } from '../../../src/i18n';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { colors, radius, spacing, typography } from '../../../src/theme';

function rupiah(v: number): string {
  return `Rp${v.toLocaleString('id-ID')}`;
}

/**
 * Konter Kartu Mitra.
 *
 * Dua pekerjaan di satu layar karena di lapangan keduanya memang berselang-
 * seling di meja yang sama: mengenali kartu yang ditempel, dan menerbitkan
 * kartu untuk orang yang baru pertama datang.
 *
 * Entri manual nomor kartu BUKAN fitur cadangan yang disembunyikan. Ia selalu
 * terlihat, sejajar dengan tombol tempel. Chip rusak, ponsel petugas tidak
 * membaca, kartu tertinggal di rumah — dan pada hari itu seseorang tetap harus
 * bisa menjual. Sistem yang hanya bisa dipakai lewat NFC berhenti bekerja pada
 * hari perangkat kerasnya mengecewakan.
 */
export default function CardsScreen() {
  const bottomInset = useBottomInset();
  const nfc = useNfcTag();

  const [cardNumber, setCardNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [holderPhone, setHolderPhone] = useState('');
  const [region, setRegion] = useState('');
  const [pendingUid, setPendingUid] = useState<string | null>(null);
  const [issuing, setIssuing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const lookup = useCardLookup();
  const issue = useIssueCard();
  const cards = useIssuedCards();

  const tapToLookup = useCallback(async () => {
    setMessage(null);
    const uid = await nfc.readTag();
    if (!uid) return;
    lookup.mutate({ uid });
  }, [nfc, lookup]);

  const lookupByNumber = useCallback(() => {
    setMessage(null);
    const normalized = normalizeCardNumber(cardNumber);
    if (!isValidCardNumber(normalized)) {
      setMessage('Nomor kartu tidak sesuai format BG-XXXX-XXXX');
      return;
    }
    lookup.mutate({ cardNumber: normalized });
  }, [cardNumber, lookup]);

  const tapForNewCard = useCallback(async () => {
    setMessage(null);
    const uid = await nfc.readTag();
    if (uid) setPendingUid(uid);
  }, [nfc]);

  const submitIssue = useCallback(() => {
    setMessage(null);
    issue.mutate(
      {
        holderName: holderName.trim(),
        holderPhone: holderPhone.trim() || undefined,
        region: region.trim(),
        cardUid: pendingUid ?? undefined,
      },
      {
        onSuccess: (created) => {
          setMessage(`${t.card.printHint} ${created.cardNumber}`);
          setHolderName('');
          setHolderPhone('');
          setPendingUid(null);
          setIssuing(false);
        },
      },
    );
  }, [issue, holderName, holderPhone, region, pendingUid]);

  const tap = lookup.data;
  const nfcUsable = nfc.availability === 'siap';

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScreenHeader title={t.card.title} />
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: bottomInset }]}>
        <Text style={s.subtitle}>{t.card.subtitle}</Text>

        {/* Keadaan NFC dinyatakan terus terang, bukan disembunyikan. Petugas
            perlu tahu mengapa tombol tempel tidak ada, supaya tidak mengira
            aplikasinya rusak. */}
        {nfc.availability === 'tidak-didukung' ? (
          <Card style={[s.mt12, s.infoCard]}>
            <Text style={s.infoTitle}>{t.card.nfcUnavailable}</Text>
            <Text style={s.infoBody}>{t.card.nfcUnavailableHelp}</Text>
          </Card>
        ) : nfc.availability === 'mati' ? (
          <Card style={[s.mt12, s.infoCard]}>
            <Text style={s.infoBody}>{t.card.nfcDisabled}</Text>
          </Card>
        ) : null}

        {/* ── Mengenali kartu ── */}
        <Card style={s.mt12}>
          <Text style={s.overline}>{t.card.lookupTitle}</Text>
          {nfcUsable ? (
            <Button
              label={nfc.reading ? t.card.reading : t.card.tapToRead}
              onPress={() => void tapToLookup()}
              loading={nfc.reading}
              style={s.mt8}
            />
          ) : null}
          {nfc.reading ? <Text style={s.hint}>{t.card.tapPrompt}</Text> : null}

          <Text style={[s.overline, s.mt16]}>{t.card.manualEntry}</Text>
          <Text style={s.hint}>{t.card.manualEntryHint}</Text>
          <Input
            label={t.card.cardNumber}
            placeholder={t.card.cardNumberPlaceholder}
            value={cardNumber}
            onChangeText={setCardNumber}
            autoCapitalize="characters"
          />
          <Button
            label={t.card.lookupCta}
            variant="secondary"
            onPress={lookupByNumber}
            loading={lookup.isPending}
          />
          {lookup.isError ? (
            <Text style={s.error}>
              {extractApiErrorMessage(lookup.error, t.common.errorMessage)}
            </Text>
          ) : null}
        </Card>

        {/* ── Hasil pembacaan ── */}
        {tap ? (
          <Card style={[s.mt12, s.resultCard]}>
            <Text style={s.holderName}>{tap.card.holderName}</Text>
            <Text style={s.cardNo}>{tap.card.cardNumber}</Text>
            <View style={s.badgeRow}>
              <View style={s.levelBadge}>
                <Feather name="shield" size={12} color={colors.bingo800} />
                <Text style={s.levelText}>Tingkat {tap.card.verificationLevel}</Text>
              </View>
              {!tap.card.claimed ? (
                <View style={s.unclaimedBadge}>
                  <Text style={s.unclaimedText}>{t.card.unclaimed}</Text>
                </View>
              ) : null}
            </View>

            <View style={s.statRow}>
              <Stat label={t.card.receiptCount} value={String(tap.receiptCount)} />
              <Stat label={t.card.totalWeight} value={`${tap.totalWeightKg.toFixed(1)} kg`} />
              <Stat label={t.card.totalNet} value={rupiah(tap.totalNetAmount)} />
            </View>

            <Text style={s.meta}>
              {t.card.issuedBy}: {tap.card.issuedByName}
            </Text>
            {!tap.card.claimed ? <Text style={s.meta}>{t.card.unclaimedHelp}</Text> : null}
          </Card>
        ) : null}

        {/* ── Menerbitkan kartu ── */}
        <Card style={s.mt12}>
          <Text style={s.overline}>{t.card.issueTitle}</Text>
          {!issuing ? (
            <Button
              label={t.card.issueCta}
              variant="secondary"
              onPress={() => setIssuing(true)}
              style={s.mt8}
            />
          ) : (
            <>
              <Input
                label={t.card.holderName}
                placeholder={t.card.holderNamePlaceholder}
                value={holderName}
                onChangeText={setHolderName}
              />
              <Input
                label={t.card.holderPhoneOptional}
                value={holderPhone}
                onChangeText={setHolderPhone}
                keyboardType="phone-pad"
              />
              <Text style={s.hint}>{t.card.holderPhoneHelp}</Text>
              <Input label={t.card.region} value={region} onChangeText={setRegion} />

              <Text style={s.hint}>
                {t.card.uidLabel}: {pendingUid ?? t.card.uidPending}
              </Text>
              {nfcUsable ? (
                <Button
                  label={nfc.reading ? t.card.reading : t.card.tapToRead}
                  variant="ghost"
                  onPress={() => void tapForNewCard()}
                  loading={nfc.reading}
                />
              ) : null}

              <View style={s.ktpNote}>
                <Feather name="info" size={14} color={colors.bingo800} />
                <Text style={s.ktpText}>{t.card.whyNoKtp}</Text>
              </View>

              <Button label={t.card.issueCta} onPress={submitIssue} loading={issue.isPending} />
              <Button label={t.common.cancel} variant="ghost" onPress={() => setIssuing(false)} />
              {issue.isError ? (
                <Text style={s.error}>
                  {extractApiErrorMessage(issue.error, t.common.errorMessage)}
                </Text>
              ) : null}
            </>
          )}
          {message ? <Text style={s.success}>{message}</Text> : null}
        </Card>

        {/* ── Kartu yang sudah diterbitkan ── */}
        <Card style={s.mt12}>
          <Text style={s.overline}>{t.card.listTitle}</Text>
          {cards.isLoading ? (
            <ActivityIndicator color={colors.bingo600} style={s.mt8} />
          ) : (cards.data?.length ?? 0) === 0 ? (
            <>
              <Text style={s.body}>{t.card.listEmpty}</Text>
              <Text style={s.hint}>{t.card.listEmptyHint}</Text>
            </>
          ) : (
            (cards.data ?? []).map((c) => (
              <View key={c.id} style={s.listRow}>
                <View style={s.listMain}>
                  <Text style={s.listName}>{c.holderName}</Text>
                  <Text style={s.listMeta}>
                    {c.cardNumber} · {c.cardUidMasked ?? t.card.uidPending}
                  </Text>
                </View>
                <Text style={s.listStatus}>
                  {c.status === 'AKTIF'
                    ? t.card.statusActive
                    : c.status === 'DIBEKUKAN'
                      ? t.card.statusSuspended
                      : t.card.statusLost}
                </Text>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.neutral50 },
  content: { padding: spacing.lg },
  subtitle: { ...typography.bodyMuted },
  mt8: { marginTop: spacing.xs },
  mt12: { marginTop: spacing.sm },
  mt16: { marginTop: spacing.md },
  overline: { ...typography.overline, color: colors.neutral600 },
  body: { ...typography.body, marginTop: spacing.xxs },
  hint: { ...typography.caption, color: colors.neutral500, marginTop: spacing.xxs },
  error: { ...typography.error, marginTop: spacing.xs },
  success: { ...typography.caption, color: colors.bingo700, marginTop: spacing.xs, fontWeight: '600' },
  infoCard: { backgroundColor: colors.amber50 },
  infoTitle: { ...typography.cardTitle, color: colors.amber800 },
  infoBody: { ...typography.caption, color: colors.amber800, marginTop: spacing.xxs },
  resultCard: { backgroundColor: colors.bingo50 },
  holderName: { ...typography.sectionTitle },
  cardNo: { ...typography.numeric, color: colors.neutral600, marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs, flexWrap: 'wrap' },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.bingo100,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
  },
  levelText: { ...typography.caption, color: colors.bingo800, fontWeight: '700' },
  unclaimedBadge: {
    backgroundColor: colors.amber100,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
  },
  unclaimedText: { ...typography.caption, color: colors.amber800, fontWeight: '600' },
  statRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  stat: { flex: 1 },
  statValue: { ...typography.numeric, fontWeight: '700' },
  statLabel: { ...typography.caption, color: colors.neutral600 },
  meta: { ...typography.caption, color: colors.neutral600, marginTop: spacing.xs },
  ktpNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.bingo50,
    borderRadius: radius.sm,
    padding: spacing.xs,
    marginVertical: spacing.xs,
  },
  ktpText: { ...typography.caption, color: colors.bingo800, flex: 1 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral100,
  },
  listMain: { flex: 1 },
  listName: { ...typography.body, fontWeight: '600' },
  listMeta: { ...typography.caption, color: colors.neutral500, marginTop: 2 },
  listStatus: { ...typography.caption, color: colors.neutral700 },
});
