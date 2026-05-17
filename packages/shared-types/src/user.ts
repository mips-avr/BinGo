/**
 * Peran pengguna dalam ekosistem BinGo.
 * Selaras dengan enum Prisma `UserRole`.
 */
export const UserRole = {
  CITIZEN: 'CITIZEN',
  WASTE_AGENT: 'WASTE_AGENT',
  MSME: 'MSME',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/** Profil publik pengguna (tanpa data sensitif). */
export interface UserProfile {
  id: string;
  nik: string | null;
  name: string;
  phone: string;
  role: UserRole;
  pointsBalance: number;
  createdAt: string;
}
