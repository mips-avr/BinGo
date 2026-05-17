import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { AuthenticatedRequest, AuthenticatedUser } from '../types/authenticated-request';

/**
 * Decorator parameter `@CurrentUser()` mengambil objek user yang sudah
 * di-attach oleh `JwtAuthGuard`/`JwtStrategy`. Bila controller dipanggil
 * tanpa guard, nilainya `undefined` (jangan dipakai sebagai pengaman utama).
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser | undefined => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
