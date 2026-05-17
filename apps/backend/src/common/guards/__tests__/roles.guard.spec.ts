import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../roles.guard';
import { ROLES_KEY } from '../../decorators/roles.decorator';

function mockContext(user: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => () => undefined,
    getClass: () => class {},
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: Reflector;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('mengizinkan akses ketika handler tidak punya metadata @Roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(mockContext({ id: 'u1', role: 'CITIZEN' }))).toBe(true);
  });

  it('mengizinkan akses bila role user termasuk dalam daftar', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['CITIZEN', 'WASTE_AGENT']);
    expect(guard.canActivate(mockContext({ id: 'u1', role: 'WASTE_AGENT' }))).toBe(true);
  });

  it('melempar 403 ketika role user tidak sesuai', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['WASTE_AGENT']);
    expect(() => guard.canActivate(mockContext({ id: 'u1', role: 'CITIZEN' }))).toThrow(
      ForbiddenException,
    );
  });

  it('melempar 403 ketika req.user tidak ada (mis. JwtAuthGuard di-skip)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['CITIZEN']);
    expect(() => guard.canActivate(mockContext(undefined))).toThrow(ForbiddenException);
  });

  it('menggunakan kunci metadata ROLES_KEY yang benar', () => {
    const spy = jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    guard.canActivate(mockContext({ id: 'u1', role: 'CITIZEN' }));
    expect(spy.mock.calls[0]?.[0]).toBe(ROLES_KEY);
  });
});
