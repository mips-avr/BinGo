import { create } from 'zustand';
import type { AuthResponse, LoginRequest, RegisterRequest, UserProfile } from '@bingo/shared-types';
import { loginApi, meApi, registerApi } from '../features/auth/api';
import { STORAGE_KEYS, secureStorage } from '../lib/storage/secure';
import { setOnUnauthorized } from '../lib/api/client';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  user: UserProfile | null;
  accessToken: string | null;
  hydrate: () => Promise<void>;
  /**
   * Menyegarkan profil yang tersimpan tanpa menyentuh token atau status.
   *
   * Dipakai `useMe()` setelah `/auth/me` dimuat ulang: saldo poin warga berubah
   * di server ketika penjemputan selesai atau laporan diverifikasi, dan tanpa
   * ini nilai di layar tetap nilai saat aplikasi pertama kali dibuka.
   */
  setUser: (user: UserProfile) => void;
  login: (input: LoginRequest) => Promise<void>;
  register: (input: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

async function persistAuth(auth: AuthResponse): Promise<void> {
  await secureStorage.set(STORAGE_KEYS.accessToken, auth.token.accessToken);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'idle',
  user: null,
  accessToken: null,

  /**
   * Dipanggil sekali saat app boot. Memuat token dari SecureStore lalu
   * memanggil `/auth/me` untuk memastikan token masih valid. Bila tidak,
   * status menjadi `unauthenticated`.
   */
  async hydrate() {
    set({ status: 'loading' });
    const timeoutMs = 8_000;
    try {
      await Promise.race([
        (async () => {
          const token = await secureStorage.get(STORAGE_KEYS.accessToken);
          if (!token) {
            set({ status: 'unauthenticated', user: null, accessToken: null });
            return;
          }
          const user = await meApi();
          set({ status: 'authenticated', user, accessToken: token });
        })(),
        new Promise<void>((_, reject) => {
          setTimeout(() => reject(new Error('hydrate_timeout')), timeoutMs);
        }),
      ]);
    } catch {
      await secureStorage.remove(STORAGE_KEYS.accessToken);
      set({ status: 'unauthenticated', user: null, accessToken: null });
    }
  },

  setUser(user) {
    // Hanya diterapkan bila sesi masih hidup; menulis profil ke sesi yang sudah
    // logout akan menghidupkan kembali nama pengguna lama di layar.
    if (get().status !== 'authenticated') return;
    set({ user });
  },

  async login(input) {
    set({ status: 'loading' });
    try {
      const auth = await loginApi(input);
      await persistAuth(auth);
      set({ status: 'authenticated', user: auth.user, accessToken: auth.token.accessToken });
    } catch (err) {
      set({ status: 'unauthenticated' });
      throw err;
    }
  },

  async register(input) {
    set({ status: 'loading' });
    try {
      const auth = await registerApi(input);
      await persistAuth(auth);
      set({ status: 'authenticated', user: auth.user, accessToken: auth.token.accessToken });
    } catch (err) {
      set({ status: 'unauthenticated' });
      throw err;
    }
  },

  async logout() {
    await secureStorage.remove(STORAGE_KEYS.accessToken);
    set({ status: 'unauthenticated', user: null, accessToken: null });
  },
}));

// Sinkronkan auto-logout dari interceptor axios saat menerima 401.
setOnUnauthorized(() => useAuthStore.getState().logout());
