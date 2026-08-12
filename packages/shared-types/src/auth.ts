import type { UserProfile, UserRole } from './user';

export interface RegisterRequest {
  name: string;
  phone: string;
  password: string;
  role: Extract<UserRole, 'HOUSEHOLD' | 'MANAGER_ADMIN' | 'BUSINESS_BUYER'>;
  organizationName?: string;
}

export interface LoginRequest {
  /** Bisa menggunakan nomor telepon (+62…) sebagai pengenal utama. */
  phone: string;
  password: string;
}

export interface AuthTokenPair {
  accessToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: UserProfile;
  token: AuthTokenPair;
}

export interface JwtPayload {
  sub: string;
  role: UserRole;
  platformRoles?: UserRole[];
  iat?: number;
  exp?: number;
}
