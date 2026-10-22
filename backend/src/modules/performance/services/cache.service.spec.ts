import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn().mockImplementation((key: string, defaultVal: any) => defaultVal),
    } as any;

    service = new CacheService(mockConfigService);
    // Operates with in-memory fallback in test suite
  });

  afterEach(async () => {
    await service.clear();
  });

  it('should store and retrieve data with TTL', async () => {
    await service.set('test:key:1', { message: 'hello world' }, 60);

    const result = await service.get<{ message: string }>('test:key:1');
    expect(result).toEqual({ message: 'hello world' });

    const stats = service.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.sets).toBe(1);
  });

  it('should return null and increment misses for non-existent key', async () => {
    const result = await service.get('missing:key');
    expect(result).toBeNull();

    const stats = service.getStats();
    expect(stats.misses).toBe(1);
  });

  it('should delete keys individually and by pattern', async () => {
    await service.set('cache:feed:home', { data: 1 }, 60);
    await service.set('cache:feed:trending', { data: 2 }, 60);
    await service.set('cache:story:1', { data: 3 }, 60);

    const purged = await service.delPattern('cache:feed:*');
    expect(purged).toBe(2);

    expect(await service.get('cache:feed:home')).toBeNull();
    expect(await service.get('cache:feed:trending')).toBeNull();
    expect(await service.get('cache:story:1')).toEqual({ data: 3 });
  });

  it('should implement single-flight memoization to prevent cache stampedes', async () => {
    let callCount = 0;
    const slowFactory = async () => {
      callCount++;
      await new Promise((r) => setTimeout(r, 20));
      return { computeResult: 42 };
    };

    // 5 concurrent requests for same cold key
    const [r1, r2, r3, r4, r5] = await Promise.all([
      service.remember('expensive:computation', 60, slowFactory),
      service.remember('expensive:computation', 60, slowFactory),
      service.remember('expensive:computation', 60, slowFactory),
      service.remember('expensive:computation', 60, slowFactory),
      service.remember('expensive:computation', 60, slowFactory),
    ]);

    expect(callCount).toBe(1); // Factory executed only once
    expect(r1).toEqual({ computeResult: 42 });
    expect(r5).toEqual({ computeResult: 42 });
  });

  it('should track user XP counter with fast increments (P2-PERF-001)', async () => {
    const fallbackCompute = jest.fn().mockResolvedValue(100);

    const initialXp = await service.getUserXp('usr_01', fallbackCompute);
    expect(initialXp).toBe(100);
    expect(fallbackCompute).toHaveBeenCalledTimes(1);

    // Increment XP by 25 (e.g. choice made)
    const newXp = await service.incrementUserXp('usr_01', 25);
    expect(newXp).toBe(125);

    // Subsequent retrieval uses cached counter without calling DB fallback
    const cachedXp = await service.getUserXp('usr_01', fallbackCompute);
    expect(cachedXp).toBe(125);
    expect(fallbackCompute).toHaveBeenCalledTimes(1);
  });
});
