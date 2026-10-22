import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { ResponseCacheInterceptor } from './response-cache.interceptor';
import { CacheService } from '../services/cache.service';
import { ConfigService } from '@nestjs/config';

describe('ResponseCacheInterceptor', () => {
  let interceptor: ResponseCacheInterceptor;
  let cacheService: CacheService;
  let reflector: Reflector;

  beforeEach(() => {
    const mockConfig: any = { get: jest.fn().mockReturnValue('localhost') };
    cacheService = new CacheService(mockConfig);
    reflector = new Reflector();
    interceptor = new ResponseCacheInterceptor(cacheService, reflector);
  });

  afterEach(async () => {
    await cacheService.clear();
  });

  it('should ignore non-GET requests', async () => {
    const mockReq: any = { method: 'POST', path: '/stories' };
    const mockRes: any = { setHeader: jest.fn() };
    const mockContext: ExecutionContext = {
      switchToHttp: () => ({ getRequest: () => mockReq, getResponse: () => mockRes }),
      getHandler: () => () => {},
    } as any;

    const mockHandler: CallHandler = {
      handle: () => of({ created: true }),
    };

    const obs = await interceptor.intercept(mockContext, mockHandler);
    obs.subscribe((val) => {
      expect(val).toEqual({ created: true });
      expect(mockRes.setHeader).not.toHaveBeenCalled();
    });
  });

  it('should serve from cache and set X-Cache: HIT on subsequent requests', async () => {
    const mockReq: any = { method: 'GET', path: '/api/v1/stories', query: { page: '1' } };
    const mockRes: any = { setHeader: jest.fn() };
    const mockContext: ExecutionContext = {
      switchToHttp: () => ({ getRequest: () => mockReq, getResponse: () => mockRes }),
      getHandler: () => () => {},
    } as any;

    jest.spyOn(reflector, 'get').mockReturnValue({ ttlSeconds: 60, keyPrefix: 'cache:feed' });

    let handlerCalls = 0;
    const mockHandler: CallHandler = {
      handle: () => {
        handlerCalls++;
        return of({ items: [{ id: 'sty_1' }] });
      },
    };

    // First request: cache miss
    const firstObs = await interceptor.intercept(mockContext, mockHandler);
    await new Promise<void>((resolve) => {
      firstObs.subscribe((val) => {
        expect(val).toEqual({ items: [{ id: 'sty_1' }] });
        expect(mockRes.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
        resolve();
      });
    });

    expect(handlerCalls).toBe(1);

    // Second request: cache hit
    const secondObs = await interceptor.intercept(mockContext, mockHandler);
    await new Promise<void>((resolve) => {
      secondObs.subscribe((val) => {
        expect(val).toEqual({ items: [{ id: 'sty_1' }] });
        expect(mockRes.setHeader).toHaveBeenCalledWith('X-Cache', 'HIT');
        resolve();
      });
    });

    // Handler should not be invoked on second request
    expect(handlerCalls).toBe(1);
  });
});
