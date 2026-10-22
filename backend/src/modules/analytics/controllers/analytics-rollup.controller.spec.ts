import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsRollupController } from './analytics-rollup.controller';
import { AnalyticsRollupService } from '../services/analytics-rollup.service';
import { BusinessMetricsRepository } from '../repositories/business-metrics.repository';

describe('AnalyticsRollupController', () => {
  let controller: AnalyticsRollupController;
  let rollupService: jest.Mocked<AnalyticsRollupService>;
  let metricsRepo: jest.Mocked<BusinessMetricsRepository>;

  beforeEach(async () => {
    const mockRollupService = {
      runHourlyRollup: jest.fn().mockResolvedValue({
        granularity: 'HOURLY',
        periodStart: '2026-10-10T12:00:00.000Z',
        periodEnd: '2026-10-10T12:59:59.999Z',
        metricsComputed: 5,
        durationMs: 42,
      }),
      runDailyRollup: jest.fn().mockResolvedValue({
        granularity: 'DAILY',
        periodStart: '2026-10-10T00:00:00.000Z',
        periodEnd: '2026-10-10T23:59:59.999Z',
        metricsComputed: 12,
        durationMs: 88,
      }),
    };

    const mockMetricsRepo = {
      queryMetrics: jest.fn().mockResolvedValue([
        {
          id: '01HTTESTMETRIC000000000001',
          metricName: 'DAU',
          dimensionKey: 'GLOBAL',
          dimensionValue: 'ALL',
          timeGranularity: 'DAILY',
          periodStart: new Date('2026-10-10T00:00:00.000Z'),
          periodEnd: new Date('2026-10-10T23:59:59.999Z'),
          numericValue: '1250.0000',
          metadata: { window: '24h' },
        },
      ]),
      findLatest: jest.fn().mockImplementation(async (name) => {
        if (name === 'DAU') {
          return {
            id: '01HTTESTMETRIC000000000001',
            metricName: 'DAU',
            dimensionKey: 'GLOBAL',
            dimensionValue: 'ALL',
            timeGranularity: 'DAILY',
            periodStart: new Date('2026-10-10T00:00:00.000Z'),
            periodEnd: new Date('2026-10-10T23:59:59.999Z'),
            numericValue: '1250.0000',
            metadata: null,
          };
        }
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsRollupController],
      providers: [
        {
          provide: AnalyticsRollupService,
          useValue: mockRollupService,
        },
        {
          provide: BusinessMetricsRepository,
          useValue: mockMetricsRepo,
        },
      ],
    }).compile();

    controller = module.get<AnalyticsRollupController>(AnalyticsRollupController);
    rollupService = module.get(AnalyticsRollupService);
    metricsRepo = module.get(BusinessMetricsRepository);
  });

  describe('queryMetrics', () => {
    it('queries metrics and formats response', async () => {
      const res = await controller.queryMetrics({
        metricName: 'DAU',
        timeGranularity: 'DAILY',
      });

      expect(res).toHaveLength(1);
      expect(res[0].metricName).toBe('DAU');
      expect(res[0].numericValue).toBe(1250);
      expect(metricsRepo.queryMetrics).toHaveBeenCalledWith(
        expect.objectContaining({ metricName: 'DAU', timeGranularity: 'DAILY' }),
      );
    });
  });

  describe('getLatestSnapshot', () => {
    it('returns dictionary of latest core metrics', async () => {
      const snapshot = await controller.getLatestSnapshot();
      expect(snapshot.DAU).toBe(1250);
      expect(snapshot.MRR).toBeNull();
    });
  });

  describe('triggerRollup', () => {
    it('routes HOURLY trigger to runHourlyRollup', async () => {
      const res = await controller.triggerRollup({ granularity: 'HOURLY' });
      expect(res.granularity).toBe('HOURLY');
      expect(rollupService.runHourlyRollup).toHaveBeenCalled();
    });

    it('routes DAILY trigger to runDailyRollup', async () => {
      const res = await controller.triggerRollup({ granularity: 'DAILY' });
      expect(res.granularity).toBe('DAILY');
      expect(rollupService.runDailyRollup).toHaveBeenCalled();
    });
  });
});
