import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ResourceOwnershipGuard } from './resource-ownership.guard';
import { DatabaseService } from '../../../database/database.service';
import { AuthenticatedUser } from '../interfaces/auth0-payload.interface';

describe('ResourceOwnershipGuard', () => {
  let guard: ResourceOwnershipGuard;
  let reflector: jest.Mocked<Reflector>;
  let dbService: jest.Mocked<DatabaseService>;
  let mockDb: any;

  const createMockContext = (
    user?: Partial<AuthenticatedUser>,
    params: Record<string, string> = {},
    body: Record<string, string> = {},
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user, params, body }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;

    mockDb = {
      execute: jest.fn(),
    };

    dbService = {
      getDb: jest.fn().mockReturnValue(mockDb),
    } as any;

    guard = new ResourceOwnershipGuard(reflector, dbService);
  });

  it('should allow access when no ownership check is requested', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext({ id: '01HVG7J0000000000000000001' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should allow platform Admins to bypass ownership checks', async () => {
    reflector.getAllAndOverride.mockReturnValue({ resourceType: 'story', paramName: 'id' });
    const context = createMockContext(
      { id: '01HVG7J0000000000000000001', roles: ['CONTENT_ADMIN'] },
      { id: '01HVG7J0000000000000000099' },
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should allow user when resourceType is user and resourceId matches user.id', async () => {
    reflector.getAllAndOverride.mockReturnValue({ resourceType: 'user', paramName: 'userId' });
    const userId = '01HVG7J0000000000000000001';
    const context = createMockContext(
      { id: userId, roles: ['USER'] },
      { userId },
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should reject when resourceType is user and resourceId does not match user.id', async () => {
    reflector.getAllAndOverride.mockReturnValue({ resourceType: 'user', paramName: 'userId' });
    const context = createMockContext(
      { id: '01HVG7J0000000000000000001', roles: ['USER'] },
      { userId: '01HVG7J0000000000000000002' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should verify story ownership against database records', async () => {
    reflector.getAllAndOverride.mockReturnValue({ resourceType: 'story', paramName: 'storyId' });
    const userId = '01HVG7J0000000000000000001';
    const storyId = '01HVG7J0000000000000000055';

    // Mock DB returning matching row
    mockDb.execute.mockResolvedValue([[{ id: storyId }]]);

    const context = createMockContext(
      { id: userId, roles: ['CREATOR'] },
      { storyId },
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(mockDb.execute).toHaveBeenCalled();
  });

  it('should reject story modification when creator does not own the story in DB', async () => {
    reflector.getAllAndOverride.mockReturnValue({ resourceType: 'story', paramName: 'storyId' });
    const userId = '01HVG7J0000000000000000001';
    const storyId = '01HVG7J0000000000000000055';

    // Mock DB returning 0 rows (not owner)
    mockDb.execute.mockResolvedValue([[]]);

    const context = createMockContext(
      { id: userId, roles: ['CREATOR'] },
      { storyId },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
