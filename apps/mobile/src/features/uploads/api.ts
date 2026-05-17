import { Platform } from 'react-native';
import { api } from '../../lib/api/client';
import { ENDPOINTS } from '../../lib/api/endpoints';

export interface UploadedImage {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

/**
 * Mengunggah foto lokal (URI dari expo-image-picker) ke endpoint
 * `/api/v1/uploads/image`. Mengembalikan URL publik untuk disimpan
 * ke field seperti `Report.imageUrl`.
 */
export async function uploadImage(localUri: string): Promise<UploadedImage> {
  const filename = localUri.split('/').pop() ?? `photo-${Date.now()}.jpg`;
  const match = /\.(\w+)$/.exec(filename);
  const ext = (match?.[1] ?? 'jpg').toLowerCase();
  const mimeType =
    ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext === 'heic' ? 'image/heic' : 'image/jpeg';

  const form = new FormData();
  form.append('file', {
    uri: Platform.OS === 'android' ? localUri : localUri.replace('file://', ''),
    name: filename,
    type: mimeType,
  } as unknown as Blob);

  const { data } = await api.post<UploadedImage>(ENDPOINTS.uploads.image, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    transformRequest: (d) => d,
  });
  return data;
}
