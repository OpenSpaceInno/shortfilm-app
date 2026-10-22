import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { AuthenticatedUser } from '../interfaces/auth0-payload.interface';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  const createMockContext = (user?: Partial<AuthenticatedUser>): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    guard = new RolesGuard(reflector);
  });

  it('should allow access when no roles are specified on the route', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext({ roles: ['USER'] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has the required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['CREATOR', 'CONTENT_ADMIN']);
    const context = createMockContext({ roles: ['CREATOR'] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should always allow SUPER_ADMIN access regardless of required roles', () => {
    reflector.getAllAndOverride.mockReturnValue(['CREATOR_MANAGER']);
    const context = createMockContext({ roles: ['SUPER_ADMIN'] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException when user lacks the required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['CONTENT_ADMIN']);
    const context = createMockContext({ roles: ['USER'] });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw UnauthorizedException when request has no user', () => {
    reflector.getAllAndOverride.mockReturnValue(['USER']);
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
