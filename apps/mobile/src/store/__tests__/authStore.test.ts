jest.mock('expo-secure-store');
jest.mock('../../features/auth/api');

import type { AuthResponse, UserProfile } from '@bingo/shared-types';
import { useAuthStore } from '../authStore';
import { loginApi, meApi, registerApi } from '../../features/auth/api';
import { STORAGE_KEYS, secureStorage } from '../../lib/storage/secure';

const profile: UserProfile = {
  id: 'u1',
  nik: null,
  name: 'Budi',
  phone: '+628123456789',
  role: 'CITIZEN',
  pointsBalance: 0,
  createdAt: new Date('2026-05-17T00:00:00Z').toISOString(),
};

const authResponse: AuthResponse = {
  user: profile,
  token: { accessToken: 'jwt.token.value', expiresIn: 3600 },
};

beforeEach(async () => {
  jest.clearAllMocks();
  await secureStorage.remove(STORAGE_KEYS.accessToken);
  useAuthStore.setState({ status: 'idle', user: null, accessToken: null });
});

describe('useAuthStore', () => {
  it('login menyimpan token ke SecureStore dan menjadi authenticated', async () => {
    (loginApi as jest.Mock).mockResolvedValue(authResponse);
    await useAuthStore.getState().login({ phone: '08123456789', password: 'rahasia123' });

    const state = useAuthStore.getState();
    expect(state.status).toBe('authenticated');
    expect(state.user?.phone).toBe(profile.phone);
    expect(state.accessToken).toBe(authResponse.token.accessToken);
    expect(await secureStorage.get(STORAGE_KEYS.accessToken)).toBe(authResponse.token.accessToken);
  });

  it('register juga menyimpan token & profile', async () => {
    (registerApi as jest.Mock).mockResolvedValue(authResponse);
    await useAuthStore.getState().register({
      name: 'Budi',
      phone: '08123456789',
      password: 'rahasia123',
      role: 'CITIZEN',
    });
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('login gagal mengembalikan status unauthenticated & melempar error', async () => {
    (loginApi as jest.Mock).mockRejectedValue(new Error('401'));
    await expect(
      useAuthStore.getState().login({ phone: '08123456789', password: 'salah' }),
    ).rejects.toThrow('401');
    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });

  it('hydrate memuat token, memanggil /me, lalu menjadi authenticated', async () => {
    await secureStorage.set(STORAGE_KEYS.accessToken, 'jwt.token.value');
    (meApi as jest.Mock).mockResolvedValue(profile);

    await useAuthStore.getState().hydrate();

    const state = useAuthStore.getState();
    expect(state.status).toBe('authenticated');
    expect(state.user?.phone).toBe(profile.phone);
  });

  it('hydrate menghapus token & menjadi unauthenticated saat /me gagal', async () => {
    await secureStorage.set(STORAGE_KEYS.accessToken, 'expired');
    (meApi as jest.Mock).mockRejectedValue(new Error('401'));

    await useAuthStore.getState().hydrate();

    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(await secureStorage.get(STORAGE_KEYS.accessToken)).toBeNull();
  });

  it('logout menghapus token dan mengubah state', async () => {
    (loginApi as jest.Mock).mockResolvedValue(authResponse);
    await useAuthStore.getState().login({ phone: '08123456789', password: 'rahasia123' });

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.status).toBe('unauthenticated');
    expect(state.user).toBeNull();
    expect(await secureStorage.get(STORAGE_KEYS.accessToken)).toBeNull();
  });
});
