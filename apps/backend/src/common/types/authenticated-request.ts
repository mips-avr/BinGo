import type { Request } from 'express';
import type { UserRole } from '@bingo/shared-types';

/**
 * Payload yang ditempelkan oleh `JwtStrategy` ke `req.user` setelah token
 * berhasil diverifikasi.
 */
export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
