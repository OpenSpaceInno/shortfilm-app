import { Test, TestingModule } from '@nestjs/testing';
import { BusinessMetricsRepository } from './business-metrics.repository';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import { NewBusinessMetric } from '../../../database/schema';

describe('BusinessMetricsRepository', () => {
  let repository: BusinessMetricsRepository;
  let mockDb: any;
  let mockPool: any;

  beforeEach(async () => {
    const mockOnDuplicateKeyUpdate = jest.fn().mockResolvedValue(undefined);
    const mockValues = jest.fn().mockReturnValue({
      onDuplicateKeyUpdate: mockOnDuplicateKeyUpdate,
    });
    const mockInsert = jest.fn().mockReturnValue({
      values: mockValues,
    });

    const mockLimit = jest.fn().mockResolvedValue([]);
    const mockOrderBy = jest.fn().mockReturnValue({
      limit: mockLimit,
    });
    const mockWhere = jest.fn().mockReturnValue({
      orderBy: mockOrderBy,
      limit: mockLimit,
    });
    const mockFrom = jest.fn().mockReturnValue({
      where: mockWhere,
      orderBy: mockOrderBy,
      limit: mockLimit,
    });
    const mockSelect = jest.fn().mockReturnValue({
      from: mockFrom,
    });

    mockDb = {
      insert: mockInsert,
      select: mockSelect,
    };

    mockPool = {
      query: jest.fn().mockResolvedValue([[{ count: 42 }], []]),
    };

    const mockDbService = {
      getDb: jest.fn().mockReturnValue(mockDb),
      getPool: jest.fn().mockReturnValue(mockPool),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessMetricsRepository,
        {
          provide: DRIZZLE_DB,
          useValue: mockDbService,
        },
      ],
    }).compile();

    repository = module.get<BusinessMetricsRepository>(BusinessMetricsRepository);
  });

  describe('upsertMetric', () => {
    it('calls db.insert with onDuplicateKeyUpdate', async () => {
      const metric: NewBusinessMetric = {
        id: '01HTTEST000000000000000001',
        metricName: 'DAU',
        dimensionKey: 'GLOBAL',
        dimensionValue: 'ALL',
        timeGranularity: 'DAILY',
        periodStart: new Date('2026-10-10T00:00:00.000Z'),
        periodEnd: new Date('2026-10-10T23:59:59.999Z'),
        numericValue: '1250.0000',
      };

      await repository.upsertMetric(metric);
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe('upsertBatch', () => {
    it('returns 0 for empty array', async () => {
      const count = await repository.upsertBatch([]);
      expect(count).toBe(0);
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('upserts list of metrics', async () => {
      const items: NewBusinessMetric[] = [
        {
          id: '01HTTEST000000000000000001',
          metricName: 'DAU',
          timeGranularity: 'DAILY',
          periodStart: new Date(),
          periodEnd: new Date(),
          numericValue: '100.0000',
        },
      ];

      const count = await repository.upsertBatch(items);
      expect(count).toBe(1);
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe('executeRaw', () => {
    it('executes query via MySQL connection pool', async () => {
      const res = await repository.executeRaw('SELECT COUNT(*) as count FROM users');
      expect(res).toEqual([{ count: 42 }]);
      expect(mockPool.query).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM users', []);
    });
  });
});
