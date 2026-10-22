import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DashboardCacheService } from './dashboard-cache.service';

describe('DashboardCacheService', () => {
  let cacheService: DashboardCacheService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'REDIS_HOST') return 'localhost';
        if (key === 'REDIS_PORT') return 6379;
        if (key === 'REDIS_PASSWORD') return '';
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardCacheService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    cacheService = module.get<DashboardCacheService>(DashboardCacheService);
    // Don't call onModuleInit to test fallback in-memory mode safely without external Redis
  });

  afterEach(async () => {
    await cacheService.onModuleDestroy();
  });

  it('stores and retrieves cached data using in-memory fallback', async () => {
    const key = 'test:key';
    const payload = { mrr: 150000, subs: 1200 };

    await cacheService.set(key, payload, 60);
    const retrieved = await cacheService.get<typeof payload>(key);

    expect(retrieved).toEqual(payload);
  });

  it('returns null for nonexistent keys', async () => {
    const result = await cacheService.get('nonexistent');
    expect(result).toBeNull();
  });

  it('deletes cached keys', async () => {
    const key = 'test:delete';
    await cacheService.set(key, { foo: 'bar' }, 60);
    await cacheService.del(key);
    const result = await cacheService.get(key);
    expect(result).toBeNull();
  });

  it('executes atomic getOrCompute on cache miss', async () => {
    const key = 'test:compute';
    const computeFn = jest.fn().mockResolvedValue({ calculated: 42 });

    const first = await cacheService.getOrCompute(key, computeFn, 60);
    expect(first).toEqual({ calculated: 42 });
    expect(computeFn).toHaveBeenCalledTimes(1);

    // Second call should return cached result without re-executing computeFn
    const second = await cacheService.getOrCompute(key, computeFn, 60);
    expect(second).toEqual({ calculated: 42 });
    expect(computeFn).toHaveBeenCalledTimes(1);
  });

  it('invalidates namespace keys by prefix', async () => {
    await cacheService.set('cache:dashboard:one', { a: 1 }, 60);
    await cacheService.set('cache:dashboard:two', { b: 2 }, 60);
    await cacheService.set('other:prefix', { c: 3 }, 60);

    const cleared = await cacheService.invalidateNamespace('cache:dashboard:');
    expect(cleared).toBeGreaterThanOrEqual(2);

    expect(await cacheService.get('cache:dashboard:one')).toBeNull();
    expect(await cacheService.get('cache:dashboard:two')).toBeNull();
    expect(await cacheService.get('other:prefix')).toEqual({ c: 3 });
  });
});
