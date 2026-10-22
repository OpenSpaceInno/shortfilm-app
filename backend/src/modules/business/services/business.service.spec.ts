import { Test, TestingModule } from '@nestjs/testing';
import { BusinessService } from './business.service';
import { BusinessRepository } from '../repositories/business.repository';
import { DashboardCacheService } from './dashboard-cache.service';
import { NotFoundException } from '@nestjs/common';

describe('BusinessService', () => {
  let service: BusinessService;
  let repo: jest.Mocked<BusinessRepository>;
  let cache: jest.Mocked<DashboardCacheService>;

  beforeEach(async () => {
    const mockRepo = {
      getLatestMetrics: jest.fn().mockResolvedValue({
        DAU: 25700,
        MAU: 148000,
        STICKINESS: 17.36,
        WATCH_HOURS: 42800,
        COMPLETION_RATE: 84.6,
        CHOICE_RATE: 94.2,
        ACTIVE_SUBS: 16480,
        MRR: 2840000,
        CHURN_RATE: 4.8,
        NET_SUBS: 1420,
      }),
      getActiveSubscriptionsWithPlans: jest.fn().mockResolvedValue([
        {
          id: 'sub-1',
          userId: 'user-1',
          planId: 'plan-1',
          tier: 'VIP',
          name: 'VIP Monthly',
          priceMonthly: 149.0,
          priceAnnually: null,
          billingInterval: 'MONTHLY',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(),
          createdAt: new Date(),
        },
      ]),
      getSubscriptionCohortRawData: jest.fn().mockResolvedValue([
        {
          userId: 'user-1',
          planTier: 'VIP',
          startMonth: '2026-05',
          status: 'ACTIVE',
          createdAt: new Date('2026-05-10'),
          cancelledAt: null,
          priceMonthly: 149.0,
        },
        {
          userId: 'user-2',
          planTier: 'VIP',
          startMonth: '2026-05',
          status: 'CANCELLED',
          createdAt: new Date('2026-05-12'),
          cancelledAt: new Date('2026-07-01'),
          priceMonthly: 149.0,
        },
      ]),
      getUserRegistrationStats: jest.fn().mockResolvedValue({ total: 420000, recent: 18400 }),
      queryMetricSeries: jest.fn().mockResolvedValue([
        {
          id: 'metric-1',
          metricName: 'DAU',
          dimensionKey: 'GLOBAL',
          dimensionValue: 'ALL',
          timeGranularity: 'DAILY',
          periodStart: new Date('2026-10-01'),
          periodEnd: new Date('2026-10-01T23:59:59'),
          numericValue: '25700.0000',
          metadata: {},
        },
      ]),
      getSignals: jest.fn().mockResolvedValue([
        {
          id: 'sig-1',
          category: 'SUBSCRIPTION',
          signalType: 'CHURN_DECELERATION',
          title: 'Churn dropped',
          observation: 'Observation',
          supportingData: {},
          signalStrength: 'STRONG',
          severity: 'INFO',
          status: 'ACTIVE',
          detectedAt: new Date(),
        },
      ]),
      createSignal: jest.fn().mockImplementation(async (data) => ({ ...data })),
      updateSignalStatus: jest.fn().mockResolvedValue(null),
      getReports: jest.fn().mockResolvedValue([]),
      getReportById: jest.fn().mockResolvedValue(null),
      createReport: jest.fn().mockImplementation(async (data) => ({ ...data, createdAt: new Date() })),
      executeRaw: jest.fn().mockResolvedValue([]),
    };

    const mockCache = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
      invalidateNamespace: jest.fn().mockResolvedValue(4),
      getOrCompute: jest.fn().mockImplementation(async (_key, computeFn) => computeFn()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessService,
        { provide: BusinessRepository, useValue: mockRepo },
        { provide: DashboardCacheService, useValue: mockCache },
      ],
    }).compile();

    service = module.get<BusinessService>(BusinessService);
    repo = module.get(BusinessRepository);
    cache = module.get(DashboardCacheService);
  });

  describe('getOverview', () => {
    it('returns executive KPI scorecard, funnels, snapshots, and signals', async () => {
      const overview = await service.getOverview();

      expect(overview).toBeDefined();
      expect(overview.kpis.length).toBeGreaterThanOrEqual(8);
      expect(overview.kpis.some((k) => k.id === 'kpi-mrr')).toBe(true);
      expect(overview.kpis.some((k) => k.id === 'kpi-arr')).toBe(true);
      expect(overview.kpis.some((k) => k.id === 'kpi-dau')).toBe(true);
      expect(overview.kpis.some((k) => k.id === 'kpi-churn')).toBe(true);

      expect(overview.snapshot.length).toBe(4);
      expect(overview.funnel.length).toBe(5);
      expect(overview.signals.length).toBeGreaterThanOrEqual(1);
      expect(overview.attentionItems.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getRevenueDashboard', () => {
    it('computes MRR, ARR, ARPU, LTV, and plan breakdowns', async () => {
      const revenue = await service.getRevenueDashboard();

      expect(revenue).toBeDefined();
      expect(revenue.mrr).toBeGreaterThan(0);
      expect(revenue.arr).toBe(revenue.mrr * 12);
      expect(revenue.arpu).toBeGreaterThan(0);
      expect(revenue.ltv).toBeGreaterThan(0);
      expect(revenue.creatorPayoutLiability).toBe(Number((revenue.mrr * 0.3).toFixed(2)));
      expect(revenue.plans.length).toBeGreaterThan(0);
      expect(revenue.revenueTrends.length).toBe(6);
      expect(revenue.churnAnalysis.monthlyRate).toBe(4.8);
    });
  });

  describe('getSubscriberCohorts', () => {
    it('computes acquisition month subscriber cohorts with MoM retention', async () => {
      const cohortData = await service.getSubscriberCohorts();

      expect(cohortData).toBeDefined();
      expect(cohortData.cohorts.length).toBeGreaterThan(0);
      const firstCohort = cohortData.cohorts[0];
      expect(firstCohort.cohortMonth).toBeDefined();
      expect(firstCohort.retentionByMonth.length).toBeGreaterThan(0);
      expect(firstCohort.retentionByMonth[0].monthIndex).toBe(0);
      expect(firstCohort.retentionByMonth[0].retentionRate).toBe(100);
      expect(cohortData.overallMoMRetention.length).toBeGreaterThan(0);
    });
  });

  describe('getAudienceDashboard', () => {
    it('computes DAU, MAU, stickiness, retention cohorts D1..D90, and segments', async () => {
      const audience = await service.getAudienceDashboard();

      expect(audience).toBeDefined();
      expect(audience.dau).toBe(25700);
      expect(audience.mau).toBe(148000);
      expect(audience.stickinessRatio).toBeGreaterThan(0);
      expect(audience.growthTrends.length).toBe(6);
      expect(audience.retentionCohorts.length).toBe(5);
      expect(audience.segments.length).toBe(3);
    });
  });

  describe('queryMetrics', () => {
    it('queries dimensional metric time series matching 21_BUSINESS_INTELLIGENCE', async () => {
      const metrics = await service.queryMetrics({
        metric: 'DAU',
        period: '30d',
        granularity: 'DAILY',
      });

      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics.length).toBe(1);
      expect(metrics[0].metricName).toBe('DAU');
      expect(metrics[0].numericValue).toBe(25700);
    });
  });

  describe('generateReport & getReports', () => {
    it('generates immutable report and saves to business_reports table', async () => {
      const report = await service.generateReport({
        reportType: 'MONTHLY_EXECUTIVE',
        title: 'September Financial Review',
        cadence: 'MONTHLY',
        periodStart: '2026-09-01T00:00:00.000Z',
        periodEnd: '2026-09-30T23:59:59.999Z',
        summary: 'Monthly summary',
      });

      expect(report).toBeDefined();
      expect(report.title).toBe('September Financial Review');
      expect(report.status).toBe('GENERATED');
      expect(report.data.executiveSummary.mrr).toBeDefined();
      expect(repo.createReport).toHaveBeenCalled();
    });

    it('throws NotFoundException when report ID does not exist', async () => {
      await expect(service.getReportById('missing-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('invalidateCache', () => {
    it('purges dashboard cache namespace', async () => {
      const result = await service.invalidateCache();
      expect(cache.invalidateNamespace).toHaveBeenCalled();
      expect(result.clearedKeys).toBe(4);
    });
  });
});
