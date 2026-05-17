import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserProfile,
} from '@bingo/shared-types';
import { api } from '../../lib/api/client';
import { ENDPOINTS } from '../../lib/api/endpoints';

export async function registerApi(payload: RegisterRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>(ENDPOINTS.auth.register, payload);
  return data;
}

export async function loginApi(payload: LoginRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>(ENDPOINTS.auth.login, payload);
  return data;
}

export async function meApi(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>(ENDPOINTS.auth.me);
  return data;
}
