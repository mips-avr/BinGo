import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
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
    <SafeAreaView className="flex-1 bg-bingo-50" edges={['top']}>
      <ScreenHeader title={t.report.create} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="mb-2 text-sm font-medium text-neutral-700">{t.report.photo}</Text>
        <View className="mb-3 overflow-hidden rounded-2xl bg-white">
          {photo ? (
            <Image
              source={{ uri: photo.uri }}
              className="h-56 w-full bg-neutral-200"
              resizeMode="cover"
            />
          ) : (
            <View className="h-56 items-center justify-center bg-neutral-100">
              <Text className="text-4xl">📷</Text>
              <Text className="mt-2 text-sm text-neutral-500">{t.report.photo}</Text>
            </View>
          )}
          <View className="flex-row gap-2 p-3">
            <View className="flex-1">
              <Button label={t.report.photoTake} variant="primary" onPress={onTake} testID="photo-take" />
            </View>
            <View className="flex-1">
              <Button label={t.report.photoPick} variant="secondary" onPress={onPick} />
            </View>
          </View>
        </View>
        {photoError ? <Text className="mb-2 text-xs text-red-600">{photoError}</Text> : null}

        <View className="mb-3 rounded-xl border border-neutral-300 bg-white p-3">
          <Text className="text-xs font-semibold uppercase text-neutral-500">
            {t.pickup.locationLabel}
          </Text>
          {locationLoading ? (
            <View className="mt-2 flex-row items-center">
              <ActivityIndicator color="#15803D" />
              <Text className="ml-2 text-sm text-neutral-500">{t.common.loading}</Text>
            </View>
          ) : location ? (
            <Text className="mt-2 text-base font-semibold text-neutral-900">
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
              className="mt-2 self-start rounded-lg bg-bingo-50 px-3 py-2 active:opacity-70"
            >
              <Text className="text-sm font-semibold text-bingo-700">{t.pickup.locationPick}</Text>
            </Pressable>
          )}
          {locationError ? (
            <Text className="mt-2 text-xs text-red-600">{locationError}</Text>
          ) : null}
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

        {submitError ? <Text className="mb-3 text-sm text-red-600">{submitError}</Text> : null}

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
