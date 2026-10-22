import { ExecutionContext, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppThrottlerGuard } from './app-throttler.guard';
import { ThrottlerStorage } from '@nestjs/throttler';

describe('AppThrottlerGuard', () => {
  let guard: AppThrottlerGuard;
  let mockReflector: Reflector;
  let mockStorage: ThrottlerStorage;

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: jest.fn(),
    } as any;

    mockStorage = {
      increment: jest.fn(),
    } as any;

    guard = new AppThrottlerGuard(
      [
        { name: 'default', ttl: 60000, limit: 300 },
        { name: 'auth', ttl: 900000, limit: 10 },
      ],
      mockStorage,
      mockReflector,
    );
  });

  const createMockContext = (req: any, res: any = {}, type: string = 'http'): ExecutionContext =>
    ({
      getType: () => type,
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
      getClass: () => ({}),
      getHandler: () => ({}),
    }) as any;

  describe('shouldSkip', () => {
    it('should skip non-http execution contexts', async () => {
      const context = createMockContext({}, {}, 'rpc');
      const shouldSkip = await (guard as any).shouldSkip(context);
      expect(shouldSkip).toBe(true);
    });

    it('should skip health probe endpoints', async () => {
      const context = createMockContext({ url: '/api/v1/health' });
      const shouldSkip = await (guard as any).shouldSkip(context);
      expect(shouldSkip).toBe(true);
    });

    it('should skip metrics endpoint', async () => {
      const context = createMockContext({ originalUrl: '/metrics' });
      const shouldSkip = await (guard as any).shouldSkip(context);
      expect(shouldSkip).toBe(true);
    });
  });

  describe('getTracker', () => {
    it('should track by authenticated user ID if present', async () => {
      const req = { user: { id: 'usr_abc123' }, ip: '192.168.1.1' };
      const tracker = await (guard as any).getTracker(req);
      expect(tracker).toBe('user:usr_abc123');
    });

    it('should track by authenticated user sub if id is missing', async () => {
      const req = { user: { sub: 'auth0|12345' }, ip: '192.168.1.1' };
      const tracker = await (guard as any).getTracker(req);
      expect(tracker).toBe('user:auth0|12345');
    });

    it('should track by cf-connecting-ip when unauthenticated', async () => {
      const req = {
        headers: { 'cf-connecting-ip': '203.0.113.195' },
        ip: '10.0.0.1',
      };
      const tracker = await (guard as any).getTracker(req);
      expect(tracker).toBe('ip:203.0.113.195');
    });

    it('should parse first IP from x-forwarded-for header', async () => {
      const req = {
        headers: { 'x-forwarded-for': '198.51.100.1, 10.0.0.2' },
      };
      const tracker = await (guard as any).getTracker(req);
      expect(tracker).toBe('ip:198.51.100.1');
    });

    it('should fall back to req.ip if no proxy headers', async () => {
      const req = { ip: '172.16.0.4' };
      const tracker = await (guard as any).getTracker(req);
      expect(tracker).toBe('ip:172.16.0.4');
    });

    it('should default to 127.0.0.1 when no IP can be found', async () => {
      const req = {};
      const tracker = await (guard as any).getTracker(req);
      expect(tracker).toBe('ip:127.0.0.1');
    });
  });

  describe('throwThrottlingException', () => {
    it('should set Retry-After header and throw 429 HttpException', async () => {
      const res = { header: jest.fn() };
      const context = createMockContext({ url: '/api/v1/auth/login' }, res);

      const limitDetail = {
        totalHits: 11,
        timeToExpire: 850000,
        isBlocked: true,
        timeToBlockExpire: 15000,
        limit: 10,
        ttl: 900000,
        key: 'auth_test',
        tracker: 'ip:1.2.3.4',
      };

      await expect(
        (guard as any).throwThrottlingException(context, limitDetail),
      ).rejects.toMatchObject({
        status: HttpStatus.TOO_MANY_REQUESTS,
      });

      expect(res.header).toHaveBeenCalledWith('Retry-After', '15');
      expect(res.header).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String));
    });
  });
});
