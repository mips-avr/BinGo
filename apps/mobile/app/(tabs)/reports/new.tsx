import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ReportPhoto } from '../../../src/components/pivot/ReportPhoto';
import { Button } from '../../../src/components/ui/Button';
import { Input } from '../../../src/components/ui/Input';
import { useCreateReport } from '../../../src/features/pivot/hooks';
import { uploadImage } from '../../../src/features/uploads/api';
import { pickFromGallery, takePhoto } from '../../../src/lib/image/picker';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { colors, screenStyles, spacing } from '../../../src/theme';

export default function Screen() {
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  const [uploading, setUploading] = useState(false);
  const mutation = useCreateReport();
  const router = useRouter();

  async function choosePhoto(source: 'camera' | 'gallery') {
    try {
      const image = source === 'camera' ? await takePhoto() : await pickFromGallery();
      if (image) setPhotoUri(image.uri);
    } catch (error) {
      Alert.alert('Foto belum dipilih', extractApiErrorMessage(error));
    }
  }
  async function submit() {
    if (!photoUri) {
      Alert.alert(
        'Foto diperlukan',
        'Ambil atau pilih foto kondisi sampah sebelum mengirim laporan.',
      );
      return;
    }
    try {
      setUploading(true);
      const uploaded = await uploadImage(photoUri);
      await mutation.mutateAsync({
        description,
        address,
        lat: -6.205,
        lng: 106.941,
        photoKey: uploaded.url,
      });
      Alert.alert('Laporan terkirim', 'Pengelola dapat memantau dan menindaklanjuti laporan ini.');
      router.back();
    } catch (error) {
      Alert.alert('Laporan belum terkirim', extractApiErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={screenStyles.screenTitle}>Buat Laporan</Text>
        <Text style={styles.lead}>
          Sertakan foto, lokasi, dan kondisi yang mudah dikenali Pengelola.
        </Text>
        <View style={styles.photoBlock}>
          <Text style={styles.label}>Foto kondisi sampah *</Text>
          {photoUri ? (
            <ReportPhoto uri={photoUri} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.placeholderText}>Belum ada foto</Text>
            </View>
          )}
          <View style={styles.photoActions}>
            <Button size="sm" label="Ambil Foto" onPress={() => choosePhoto('camera')} />
            <Button
              size="sm"
              variant="secondary"
              label="Pilih Galeri"
              onPress={() => choosePhoto('gallery')}
            />
          </View>
        </View>
        <Input
          label="Kondisi di lokasi"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <Input label="Alamat atau patokan" value={address} onChangeText={setAddress} />
        <Button
          label="Kirim Laporan"
          loading={mutation.isPending || uploading}
          disabled={description.length < 5 || address.length < 5 || !photoUri}
          onPress={submit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 100 },
  lead: { marginVertical: spacing.md, fontSize: 15, lineHeight: 22, color: colors.neutral600 },
  photoBlock: { marginBottom: spacing.lg },
  label: { fontSize: 14, fontWeight: '700', color: colors.neutral800, marginBottom: spacing.sm },
  photoPlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.neutral300,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.neutral50,
  },
  placeholderText: { color: colors.neutral500 },
  photoActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
});
