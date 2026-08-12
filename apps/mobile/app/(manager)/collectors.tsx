import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DataCard } from '../../src/components/pivot/DataListView';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import {
  useCreateCollector,
  useIssueCollectorCard,
  useManagerOperations,
} from '../../src/features/pivot/hooks';
import { extractApiErrorMessage } from '../../src/lib/api/client';
import { colors, screenStyles, spacing } from '../../src/theme';

export default function CollectorsScreen() {
  const query = useManagerOperations();
  const create = useCreateCollector();
  const issueCard = useIssueCollectorCard();
  const [name, setName] = useState('Petugas Demo Baru');
  const [phone, setPhone] = useState('081290000099');
  const [employeeNo, setEmployeeNo] = useState('PG-099');
  const [password, setPassword] = useState('demo12345678');
  const [collectorId, setCollectorId] = useState('');
  const [cardNumber, setCardNumber] = useState('BG-DEMO-099');
  async function submit() {
    const collector = await create.mutateAsync({
      name,
      phone,
      employeeNo,
      initialPassword: password,
    });
    setCollectorId(collector.id);
    Alert.alert('Petugas dibuat', 'Akun Petugas siap masuk ke APK.');
  }
  async function submitCard() {
    if (!collectorId)
      return Alert.alert('Pilih Petugas', 'Pilih Petugas yang akan menerima kartu.');
    await issueCard.mutateAsync({ collectorId, cardNumber });
    Alert.alert(
      'Kartu diterbitkan',
      'Nomor kartu dapat digunakan pada simulator dan pembacaan manual.',
    );
  }
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={screenStyles.screenTitle}>Petugas dan Kartu</Text>
      <Text style={styles.subtitle}>Buat akun Petugas dan hubungkan kartu operasionalnya.</Text>
      <Card style={styles.panel}>
        <Text style={styles.heading}>Petugas baru</Text>
        <Input label="Nama" value={name} onChangeText={setName} />
        <Input
          label="Nomor telepon"
          value={phone}
          keyboardType="phone-pad"
          onChangeText={setPhone}
        />
        <Input label="Nomor petugas" value={employeeNo} onChangeText={setEmployeeNo} />
        <Input
          label="Kata sandi awal"
          value={password}
          secureTextEntry
          onChangeText={setPassword}
        />
        <Button
          label="Buat akun Petugas"
          loading={create.isPending}
          onPress={() =>
            submit().catch((error) => Alert.alert('Belum dibuat', extractApiErrorMessage(error)))
          }
        />
      </Card>
      <Card style={styles.panel}>
        <Text style={styles.heading}>Terbitkan kartu</Text>
        <View style={styles.choices}>
          {query.data?.collectors?.map((collector: any) => (
            <Button
              key={collector.id}
              size="sm"
              label={collector.user.name}
              variant={collectorId === collector.id ? 'primary' : 'secondary'}
              onPress={() => setCollectorId(collector.id)}
            />
          ))}
        </View>
        <Input label="Nomor kartu" value={cardNumber} onChangeText={setCardNumber} />
        <Button
          label="Terbitkan kartu"
          loading={issueCard.isPending}
          onPress={() =>
            submitCard().catch((error) =>
              Alert.alert('Belum diterbitkan', extractApiErrorMessage(error)),
            )
          }
        />
      </Card>
      <Text style={styles.heading}>Petugas aktif</Text>
      {query.data?.collectors?.map((collector: any) => (
        <DataCard
          key={collector.id}
          title={collector.user.name}
          detail={collector.employeeNo}
          meta={`${collector.cards.filter((card: any) => card.active).length} kartu aktif`}
        />
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    paddingBottom: 100,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  subtitle: { color: colors.neutral600, marginTop: spacing.xs, marginBottom: spacing.xl },
  panel: { marginBottom: spacing.xl },
  heading: { fontSize: 18, fontWeight: '800', color: colors.neutral900, marginBottom: spacing.md },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
});
