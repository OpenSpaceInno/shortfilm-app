import { Test, TestingModule } from '@nestjs/testing';
import { AdminBusinessController } from './admin-business.controller';
import { BusinessService } from '../services/business.service';

describe('AdminBusinessController', () => {
  let controller: AdminBusinessController;
  let service: jest.Mocked<BusinessService>;

  beforeEach(async () => {
    const mockService = {
      getOverview: jest.fn().mockResolvedValue({
        kpis: [],
        snapshot: [],
        funnel: [],
        signals: [],
        attentionItems: [],
        generatedAt: new Date().toISOString(),
        isCached: true,
      }),
      getRevenueDashboard: jest.fn().mockResolvedValue({
        mrr: 2840000,
        arr: 34080000,
        arpu: 172.5,
        ltv: 3593.75,
        activeSubscribers: 16480,
        grossMonthlyRevenue: 2840000,
        grossAnnualRunRate: 34080000,
        creatorPayoutLiability: 852000,
        netSubscriberAdditions: 1420,
        grossChurnRate: 4.8,
        plans: [],
        revenueTrends: [],
        churnAnalysis: { monthlyRate: 4.8, voluntaryPct: 78.5, involuntaryPct: 21.5, primaryReason: 'None' },
        generatedAt: new Date().toISOString(),
        isCached: true,
      }),
      getSubscriberCohorts: jest.fn().mockResolvedValue({
        cohorts: [],
        overallMoMRetention: [100, 91.2],
        averageSubscriberLifetimeMonths: 9.2,
        generatedAt: new Date().toISOString(),
        isCached: true,
      }),
      getAudienceDashboard: jest.fn().mockResolvedValue({
        dau: 25700,
        mau: 148000,
        stickinessRatio: 17.36,
        totalRegisteredUsers: 420000,
        newRegistrationsPeriod: 18400,
        returningUsersPeriod: 84200,
        growthTrends: [],
        retentionCohorts: [],
        segments: [],
        generatedAt: new Date().toISOString(),
        isCached: true,
      }),
      getSignals: jest.fn().mockResolvedValue([]),
      generateReport: jest.fn().mockResolvedValue({
        id: '01J8TEST',
        reportType: 'MONTHLY_EXECUTIVE',
        title: 'Monthly report',
        cadence: 'MONTHLY',
        periodStart: '2026-09-01T00:00:00.000Z',
        periodEnd: '2026-09-30T23:59:59.999Z',
        status: 'GENERATED',
        data: {},
        createdAt: new Date().toISOString(),
      }),
      getReports: jest.fn().mockResolvedValue([]),
      getReportById: jest.fn().mockResolvedValue({
        id: '01J8TEST',
        reportType: 'MONTHLY_EXECUTIVE',
        title: 'Monthly report',
        cadence: 'MONTHLY',
        periodStart: '2026-09-01T00:00:00.000Z',
        periodEnd: '2026-09-30T23:59:59.999Z',
        status: 'GENERATED',
        data: {},
        createdAt: new Date().toISOString(),
      }),
      invalidateCache: jest.fn().mockResolvedValue({ clearedKeys: 5 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminBusinessController],
      providers: [{ provide: BusinessService, useValue: mockService }],
    }).compile();

    controller = module.get<AdminBusinessController>(AdminBusinessController);
    service = module.get(BusinessService);
  });

  it('delegates getOverview to BusinessService', async () => {
    const result = await controller.getOverview({});
    expect(service.getOverview).toHaveBeenCalled();
    expect(result.isCached).toBe(true);
  });

  it('delegates getRevenueDashboard to BusinessService', async () => {
    const result = await controller.getRevenueDashboard({});
    expect(service.getRevenueDashboard).toHaveBeenCalled();
    expect(result.mrr).toBe(2840000);
  });

  it('delegates getSubscriberCohorts to BusinessService', async () => {
    const result = await controller.getSubscriberCohorts();
    expect(service.getSubscriberCohorts).toHaveBeenCalled();
  });

  it('delegates getAudienceDashboard to BusinessService', async () => {
    const result = await controller.getAudienceDashboard({});
    expect(service.getAudienceDashboard).toHaveBeenCalled();
  });

  it('delegates getSignals to BusinessService', async () => {
    await controller.getSignals('ACTIVE');
    expect(service.getSignals).toHaveBeenCalledWith('ACTIVE');
  });

  it('delegates report generation and retrieval to BusinessService', async () => {
    await controller.generateReport(
      {
        reportType: 'MONTHLY_EXECUTIVE',
        title: 'Monthly',
        cadence: 'MONTHLY',
        periodStart: '2026-09-01T00:00:00.000Z',
        periodEnd: '2026-09-30T23:59:59.999Z',
      },
      { id: 'user-admin', email: 'admin@shortreel.test' } as any,
    );
    expect(service.generateReport).toHaveBeenCalled();

    await controller.getReports(5);
    expect(service.getReports).toHaveBeenCalledWith(5);

    await controller.getReportById('01J8TEST');
    expect(service.getReportById).toHaveBeenCalledWith('01J8TEST');
  });

  it('delegates cache invalidation', async () => {
    const res = await controller.invalidateCache();
    expect(service.invalidateCache).toHaveBeenCalled();
    expect(res.clearedKeys).toBe(5);
  });
});
