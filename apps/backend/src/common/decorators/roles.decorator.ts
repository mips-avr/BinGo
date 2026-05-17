import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@bingo/shared-types';

export const ROLES_KEY = 'bingo:roles';

/**
 * Decorator `@Roles('CITIZEN', 'WASTE_AGENT')` membatasi akses handler
 * hanya untuk peran tertentu. Wajib dipasang bersama `JwtAuthGuard` dan
 * `RolesGuard` (urutan: JWT dulu, baru Roles).
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
