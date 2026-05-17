import * as ImagePicker from 'expo-image-picker';

export interface PickedImage {
  uri: string;
  width: number;
  height: number;
  mimeType?: string;
}

async function ensure(perm: 'camera' | 'library'): Promise<void> {
  const req =
    perm === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (req.status !== 'granted') {
    throw new Error(
      perm === 'camera'
        ? 'Izin kamera ditolak. Aktifkan di pengaturan untuk memotret bukti laporan.'
        : 'Izin galeri ditolak. Aktifkan di pengaturan untuk memilih foto.',
    );
  }
}

export async function takePhoto(): Promise<PickedImage | null> {
  await ensure('camera');
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
    allowsEditing: false,
  });
  if (result.canceled) return null;
  const a = result.assets[0];
  return a ? { uri: a.uri, width: a.width, height: a.height, mimeType: a.mimeType } : null;
}

export async function pickFromGallery(): Promise<PickedImage | null> {
  await ensure('library');
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
    allowsEditing: false,
  });
  if (result.canceled) return null;
  const a = result.assets[0];
  return a ? { uri: a.uri, width: a.width, height: a.height, mimeType: a.mimeType } : null;
}
