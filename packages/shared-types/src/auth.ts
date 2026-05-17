import type { UserProfile, UserRole } from './user';

export interface RegisterRequest {
  /** NIK 16 digit (opsional untuk peran MSME). */
  nik?: string;
  name: string;
  phone: string;
  password: string;
  role: UserRole;
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
  iat?: number;
  exp?: number;
}
