import { Alert, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useTapCard } from '../../src/features/pivot/hooks';
import { useNfcTag } from '../../src/features/nfc/useNfcTag';
import { DemoCardReader, ManualCardNumberReader } from '../../src/features/nfc/CardReaderAdapter';
import { screenStyles, spacing } from '../../src/theme';

export default function Screen() {
  const [card, setCard] = useState('BG-DEMO-0001');
  const mutation = useTapCard();
  const nfc = useNfcTag();
  const submit = (credential: string, source: string) =>
    mutation.mutate(
      { credential, source },
      {
        onSuccess: (result: any) =>
          Alert.alert(
            result.result === 'accepted'
              ? 'Kartu dikenali'
              : result.result === 'queued'
                ? 'Disimpan offline'
                : 'Tap tidak diproses',
            result.result === 'accepted'
              ? `Petugas ${result.collector.employeeNo} tercatat.`
              : (result.reason ?? result.result),
          ),
      },
    );
  return (
    <SafeAreaView style={styles.root}>
      <Text style={screenStyles.screenTitle}>Kartu Petugas</Text>
      <Text style={styles.body}>
        Gunakan NFC atau masukkan nomor yang tercetak pada kartu Petugas.
      </Text>
      <Button
        label={
          nfc.reading
            ? 'Membaca NFC...'
            : nfc.availability === 'siap'
              ? 'Tap NFC Android'
              : 'NFC tidak tersedia'
        }
        disabled={nfc.availability !== 'siap'}
        loading={nfc.reading}
        onPress={async () => {
          const credential = await nfc.readTag();
          if (credential) submit(credential, 'ANDROID_NFC');
        }}
      />
      <Text style={styles.divider}>atau gunakan nomor kartu</Text>
      <Input label="Nomor kartu" value={card} onChangeText={setCard} />
      <Button
        label="Catat Nomor Kartu"
        variant="secondary"
        loading={mutation.isPending}
        onPress={async () => {
          const value = await new ManualCardNumberReader(card).read();
          if (value) submit(value.credential, value.source);
        }}
      />
      <Button
        label="Gunakan Kartu Contoh"
        variant="ghost"
        loading={mutation.isPending}
        onPress={async () => {
          const value = await new DemoCardReader().read();
          if (value) submit(value.credential, value.source);
        }}
        style={{ marginTop: spacing.sm }}
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.lg },
  body: { marginVertical: spacing.md, fontSize: 15, lineHeight: 22 },
  divider: { textAlign: 'center', marginVertical: spacing.md, fontSize: 13 },
});
