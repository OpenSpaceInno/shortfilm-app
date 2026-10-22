import { Test, TestingModule } from '@nestjs/testing';
import { BusinessRepository } from './business.repository';
import { DRIZZLE_DB, DatabaseService } from '../../../database/database.service';

describe('BusinessRepository', () => {
  let repository: BusinessRepository;
  let mockDbService: any;
  let mockPool: any;
  let mockDb: any;

  beforeEach(async () => {
    mockPool = {
      query: jest.fn().mockResolvedValue([[{ total_users: 12000, recent_users: 850 }]]),
    };

    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
      innerJoin: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockResolvedValue([{ insertId: 1 }]),
      }),
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ affectedRows: 1 }]),
        }),
      }),
    };

    mockDbService = {
      getDb: jest.fn().mockReturnValue(mockDb),
      getPool: jest.fn().mockReturnValue(mockPool),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessRepository,
        {
          provide: DRIZZLE_DB,
          useValue: mockDbService,
        },
      ],
    }).compile();

    repository = module.get<BusinessRepository>(BusinessRepository);
  });

  it('queries latest metrics for requested names', async () => {
    mockDb.limit.mockResolvedValueOnce([{ numericValue: '2840000.0000' }]);
    mockDb.limit.mockResolvedValueOnce([{ numericValue: '4.8000' }]);

    const result = await repository.getLatestMetrics(['MRR', 'CHURN_RATE']);

    expect(result).toHaveProperty('MRR');
    expect(result).toHaveProperty('CHURN_RATE');
    expect(mockDb.select).toHaveBeenCalled();
  });

  it('queries metric series with dimensional filters', async () => {
    mockDb.limit.mockResolvedValue([
      {
        id: '01J8TEST',
        metricName: 'DAU',
        numericValue: '25000',
        periodStart: new Date(),
        periodEnd: new Date(),
      },
    ]);

    const result = await repository.queryMetricSeries({
      metricName: 'DAU',
      timeGranularity: 'DAILY',
      limit: 10,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it('retrieves user registration statistics from MySQL connection pool', async () => {
    const stats = await repository.getUserRegistrationStats(30);

    expect(mockPool.query).toHaveBeenCalled();
    expect(stats.total).toBe(12000);
    expect(stats.recent).toBe(850);
  });

  it('persists and retrieves business signals', async () => {
    const newSignal = {
      id: '01J8TESTSIGNAL',
      category: 'SUBSCRIPTION' as const,
      signalType: 'CHURN_ALERT',
      title: 'Alert test',
      observation: 'Test observation',
      supportingData: { churn: 5.2 },
      signalStrength: 'STRONG' as const,
      severity: 'ATTENTION' as const,
      status: 'ACTIVE' as const,
      detectedAt: new Date(),
    };

    mockDb.limit.mockResolvedValueOnce([newSignal]);
    const created = await repository.createSignal(newSignal as any);
    expect(created).toBeDefined();
  });

  it('creates and lists immutable executive reports', async () => {
    const newReport = {
      id: '01J8TESTREPORT',
      reportType: 'MONTHLY_EXECUTIVE',
      title: 'Monthly Test',
      cadence: 'MONTHLY' as const,
      periodStart: new Date(),
      periodEnd: new Date(),
      status: 'GENERATED' as const,
      summary: 'Summary',
      keyStat: '₹28.4L MRR',
      data: { mrr: 2840000 },
      metadata: {},
      generatedBy: null,
      approvedBy: null,
      approvedAt: null,
    };

    mockDb.limit.mockResolvedValueOnce([newReport]);
    const created = await repository.createReport(newReport as any);
    expect(created).toBeDefined();

    mockDb.limit.mockResolvedValueOnce([newReport]);
    const list = await repository.getReports(10);
    expect(Array.isArray(list)).toBe(true);
  });
});
