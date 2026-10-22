import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { AuthenticatedUser } from '../interfaces/auth0-payload.interface';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
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
    guard = new PermissionsGuard(reflector);
  });

  it('should allow access when no permissions are specified', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext({ permissions: [] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user possesses all required permissions', () => {
    reflector.getAllAndOverride.mockReturnValue(['story:create', 'story:publish']);
    const context = createMockContext({
      permissions: ['story:create', 'story:publish', 'story:read'],
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has SUPER_ADMIN or admin:all permission', () => {
    reflector.getAllAndOverride.mockReturnValue(['creator:payout']);
    const context = createMockContext({
      roles: ['SUPER_ADMIN'],
      permissions: [],
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException when user is missing one of the required permissions', () => {
    reflector.getAllAndOverride.mockReturnValue(['story:create', 'story:publish']);
    const context = createMockContext({
      permissions: ['story:create'], // missing story:publish
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw UnauthorizedException when request has no authenticated user', () => {
    reflector.getAllAndOverride.mockReturnValue(['story:read']);
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
