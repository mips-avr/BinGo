import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { appConfig } from '../config';
import { STORAGE_KEYS, secureStorage } from '../storage/secure';

/**
 * Axios instance dasar BinGo.
 * - baseURL diambil dari `app.config.ts` (env `EXPO_PUBLIC_API_BASE_URL`).
 * - Token JWT (jika ada) di-inject otomatis lewat interceptor.
 * - Saat menerima 401, interceptor memanggil `onUnauthorized` (mis. logout).
 */
let apiBaseUrl = appConfig.apiBaseUrl;
let onUnauthorizedHandler: (() => void | Promise<void>) | null = null;

export function setApiBaseUrl(url: string): void {
  apiBaseUrl = url;
  api.defaults.baseURL = url;
}

export function setOnUnauthorized(handler: () => void | Promise<void>): void {
  onUnauthorizedHandler = handler;
}

export const api: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await secureStorage.get(STORAGE_KEYS.accessToken);
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error?.response?.status === 401 && onUnauthorizedHandler) {
      await onUnauthorizedHandler();
    }
    return Promise.reject(error);
  },
);

/**
 * Helper untuk mengangkat pesan error backend BinGo (yang dibungkus
 * `AllExceptionsFilter`) menjadi pesan readable dalam Bahasa Indonesia.
 */
export function extractApiErrorMessage(error: unknown, fallback = 'Terjadi kesalahan'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string | string[]; error?: string }
      | undefined;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(', ') : data.message;
    }
    return error.message ?? fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
