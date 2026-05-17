import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { LatLng } from '@bingo/shared-types';
import { Button } from '../../../src/components/ui/Button';
import { Input } from '../../../src/components/ui/Input';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { getCurrentLocation } from '../../../src/lib/location';
import { pickFromGallery, takePhoto, type PickedImage } from '../../../src/lib/image/picker';
import { uploadImage } from '../../../src/features/uploads/api';
import { useCreateReport } from '../../../src/features/reports/hooks';
import { extractApiErrorMessage } from '../../../src/lib/api/client';
import { colors, shadow } from '../../../src/theme/screen';
import { t } from '../../../src/i18n';

export default function NewReportScreen() {
  const router = useRouter();
  const create = useCreateReport();
  const [photo, setPhoto] = useState<PickedImage | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [location, setLocation] = useState<LatLng | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Auto-tangkap koordinat begitu layar dibuka — alur paling cepat untuk warga.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLocationLoading(true);
      try {
        const res = await getCurrentLocation();
        if (!cancelled) setLocation(res.coords);
      } catch (e) {
        if (!cancelled) setLocationError(e instanceof Error ? e.message : 'Gagal mengambil lokasi');
      } finally {
        if (!cancelled) setLocationLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onTake() {
    setPhotoError(null);
    try {
      const p = await takePhoto();
      if (p) setPhoto(p);
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : 'Kamera tidak tersedia');
    }
  }

  async function onPick() {
    setPhotoError(null);
    try {
      const p = await pickFromGallery();
      if (p) setPhoto(p);
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : 'Galeri tidak tersedia');
    }
  }

  async function onSubmit() {
    setSubmitError(null);
    if (!photo) {
      setPhotoError(t.report.photoMissing);
      return;
    }
    if (!location) {
      setLocationError('Tunggu hingga koordinat terdeteksi atau aktifkan izin lokasi');
      return;
    }
    try {
      setUploading(true);
      const uploaded = await uploadImage(photo.uri);
      setUploading(false);
      await create.mutateAsync({
        location,
        imageUrl: uploaded.url,
        description: description.trim() || undefined,
      });
      Alert.alert(t.common.success, t.report.createSuccess, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      setUploading(false);
      setSubmitError(extractApiErrorMessage(err, t.common.error));
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title={t.report.create} />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.fieldLabel}>{t.report.photo}</Text>
        <View style={s.photoCard}>
          {photo ? (
            <Image source={{ uri: photo.uri }} style={s.photoImage} resizeMode="cover" />
          ) : (
            <View style={s.photoPlaceholder}>
              <Text style={s.photoIcon}>📷</Text>
              <Text style={s.photoPlaceholderText}>{t.report.photo}</Text>
            </View>
          )}
          <View style={s.photoBtnRow}>
            <View style={s.photoBtnHalf}>
              <Button label={t.report.photoTake} variant="primary" onPress={onTake} testID="photo-take" />
            </View>
            <View style={s.photoBtnHalf}>
              <Button label={t.report.photoPick} variant="secondary" onPress={onPick} />
            </View>
          </View>
        </View>
        {photoError ? <Text style={s.fieldError}>{photoError}</Text> : null}

        <View style={s.locCard}>
          <Text style={s.locLabel}>{t.pickup.locationLabel}</Text>
          {locationLoading ? (
            <View style={s.locRow}>
              <ActivityIndicator color={colors.bingo700} />
              <Text style={s.locLoading}>{t.common.loading}</Text>
            </View>
          ) : location ? (
            <Text style={s.locCoords}>
              📍 {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </Text>
          ) : (
            <Pressable
              onPress={async () => {
                setLocationError(null);
                setLocationLoading(true);
                try {
                  const res = await getCurrentLocation();
                  setLocation(res.coords);
                } catch (e) {
                  setLocationError(e instanceof Error ? e.message : 'Gagal mengambil lokasi');
                } finally {
                  setLocationLoading(false);
                }
              }}
              style={s.locRetryBtn}
            >
              <Text style={s.locRetryText}>{t.pickup.locationPick}</Text>
            </Pressable>
          )}
          {locationError ? <Text style={s.fieldError}>{locationError}</Text> : null}
        </View>

        <Input
          label={t.report.description}
          value={description}
          onChangeText={setDescription}
          placeholder={t.report.descriptionPlaceholder}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {submitError ? <Text style={s.submitError}>{submitError}</Text> : null}

        <Button
          label={t.report.submit}
          onPress={onSubmit}
          loading={uploading || create.isPending}
          testID="submit-report"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bingo50 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 32 },
  fieldLabel: { marginBottom: 8, fontSize: 14, fontWeight: '500', color: colors.neutral800 },
  photoCard: { marginBottom: 12, borderRadius: 16, backgroundColor: colors.white, overflow: 'hidden', ...shadow(2) },
  photoImage: { height: 224, width: '100%', backgroundColor: colors.neutral200 },
  photoPlaceholder: { height: 224, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.neutral100 },
  photoIcon: { fontSize: 40 },
  photoPlaceholderText: { marginTop: 8, fontSize: 14, color: colors.neutral600 },
  photoBtnRow: { flexDirection: 'row', gap: 8, padding: 12 },
  photoBtnHalf: { flex: 1 },
  fieldError: { marginBottom: 8, fontSize: 12, color: colors.red600 },
  locCard: { marginBottom: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.neutral300, backgroundColor: colors.white, padding: 12 },
  locLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', color: colors.neutral600 },
  locRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center' },
  locLoading: { marginLeft: 8, fontSize: 14, color: colors.neutral600 },
  locCoords: { marginTop: 8, fontSize: 16, fontWeight: '600', color: colors.neutral900 },
  locRetryBtn: { marginTop: 8, alignSelf: 'flex-start', borderRadius: 8, backgroundColor: colors.bingo50, paddingHorizontal: 12, paddingVertical: 8 },
  locRetryText: { fontSize: 14, fontWeight: '600', color: colors.bingo700 },
  submitError: { marginBottom: 12, fontSize: 14, color: colors.red600 },
});
