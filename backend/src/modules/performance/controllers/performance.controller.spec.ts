import { Test, TestingModule } from '@nestjs/testing';
import { PerformanceController } from './performance.controller';
import { CacheService } from '../services/cache.service';
import { CacheInvalidationService } from '../services/cache-invalidation.service';
import { QueryPlanService } from '../services/query-plan.service';

describe('PerformanceController', () => {
  let controller: PerformanceController;
  let cacheService: jest.Mocked<CacheService>;
  let cacheInvalidationService: jest.Mocked<CacheInvalidationService>;
  let queryPlanService: jest.Mocked<QueryPlanService>;

  beforeEach(async () => {
    const mockCacheService = {
      getStats: jest.fn().mockReturnValue({
        hits: 150,
        misses: 20,
        hitRatio: 0.8824,
        sets: 40,
        dels: 10,
        backend: 'REDIS',
        inMemoryKeyCount: 0,
      }),
      delPattern: jest.fn().mockResolvedValue(5),
    };

    const mockInvalidationService = {
      invalidateStory: jest.fn().mockResolvedValue(undefined),
      invalidateUser: jest.fn().mockResolvedValue(undefined),
      purgeAll: jest.fn().mockResolvedValue(25),
    };

    const mockQueryPlanService = {
      auditIndexes: jest.fn().mockResolvedValue({
        timestamp: new Date().toISOString(),
        totalIndexesAudited: 7,
        verifiedCount: 7,
        missingCount: 0,
        allVerified: true,
        indexes: [],
      }),
      explainQuery: jest.fn().mockResolvedValue({
        query: 'SELECT * FROM stories',
        accessType: 'ref',
        usedIndex: 'idx_stories_status_published',
        possibleIndexes: ['idx_stories_status_published'],
        rowsExamined: 10,
        filteredPercentage: 100,
        grade: 'OPTIMAL',
        meetsSla: true,
        recommendations: [],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PerformanceController],
      providers: [
        { provide: CacheService, useValue: mockCacheService },
        { provide: CacheInvalidationService, useValue: mockInvalidationService },
        { provide: QueryPlanService, useValue: mockQueryPlanService },
      ],
    }).compile();

    controller = module.get<PerformanceController>(PerformanceController);
    cacheService = module.get(CacheService);
    cacheInvalidationService = module.get(CacheInvalidationService);
    queryPlanService = module.get(QueryPlanService);
  });

  it('should return cache stats', () => {
    const stats = controller.getCacheStats();
    expect(stats.hits).toBe(150);
    expect(stats.backend).toBe('REDIS');
  });

  it('should purge cache by storyId', async () => {
    const result = await controller.purgeCache({ storyId: 'sty_01' });
    expect(result.success).toBe(true);
    expect(cacheInvalidationService.invalidateStory).toHaveBeenCalledWith('sty_01');
  });

  it('should purge cache by pattern', async () => {
    const result = await controller.purgeCache({ pattern: 'cache:feed:*' });
    expect(result.success).toBe(true);
    expect(result.purgedCount).toBe(5);
    expect(cacheService.delPattern).toHaveBeenCalledWith('cache:feed:*');
  });

  it('should audit schema indexes', async () => {
    const audit = await controller.getIndexAudit();
    expect(audit.allVerified).toBe(true);
    expect(queryPlanService.auditIndexes).toHaveBeenCalled();
  });

  it('should explain query execution plan', async () => {
    const plan = await controller.explainQuery({ querySql: 'SELECT * FROM stories' });
    expect(plan.grade).toBe('OPTIMAL');
    expect(queryPlanService.explainQuery).toHaveBeenCalledWith('SELECT * FROM stories');
  });
});
