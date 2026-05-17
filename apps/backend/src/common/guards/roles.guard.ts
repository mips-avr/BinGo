import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@bingo/shared-types';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedRequest } from '../types/authenticated-request';

/**
 * Guard RBAC sederhana berbasis metadata `@Roles(...)`.
 * - Bila handler tidak memiliki metadata roles, akses diizinkan
 *   (autentikasi tetap ditangani oleh `JwtAuthGuard`).
 * - Bila ada metadata, peran user harus termasuk di dalamnya.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk operasi ini');
    }
    return true;
  }
}
