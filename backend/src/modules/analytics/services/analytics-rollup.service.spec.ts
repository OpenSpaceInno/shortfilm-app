import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsRollupService } from './analytics-rollup.service';
import { BusinessMetricsRepository } from '../repositories/business-metrics.repository';

describe('AnalyticsRollupService', () => {
  let service: AnalyticsRollupService;
  let metricsRepo: jest.Mocked<BusinessMetricsRepository>;

  beforeEach(async () => {
    const mockMetricsRepo = {
      upsertMetric: jest.fn().mockResolvedValue(undefined),
      upsertBatch: jest.fn().mockImplementation(async (items) => items.length),
      queryMetrics: jest.fn().mockResolvedValue([]),
      findLatest: jest.fn().mockResolvedValue(null),
      executeRaw: jest.fn().mockImplementation(async (query: string) => {
        if (query.includes('COUNT(DISTINCT user_id) as dau')) {
          return [{ dau: 1250 }];
        }
        if (query.includes('COUNT(DISTINCT user_id) as mau')) {
          return [{ mau: 5000 }];
        }
        if (query.includes('watch_hours')) {
          return [{ watch_hours: 450.5 }];
        }
        if (query.includes('total_started')) {
          return [{ total_started: 300, total_completed: 240 }];
        }
        if (query.includes('choice_count')) {
          return [{ choice_count: 55 }];
        }
        if (query.includes('active_subs')) {
          return [{ active_subs: 120, mrr: 119880.0 }];
        }
        if (query.includes('cancelled_count')) {
          return [{ cancelled_count: 5, new_active_count: 25 }];
        }
        return [];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsRollupService,
        {
          provide: BusinessMetricsRepository,
          useValue: mockMetricsRepo,
        },
      ],
    }).compile();

    service = module.get<AnalyticsRollupService>(AnalyticsRollupService);
    metricsRepo = module.get(BusinessMetricsRepository);
  });

  describe('runHourlyRollup', () => {
    it('executes hourly aggregation and upserts computed metrics', async () => {
      const targetDate = new Date('2026-10-10T15:30:00.000Z');
      const result = await service.runHourlyRollup(targetDate);

      expect(result.granularity).toBe('HOURLY');
      expect(result.metricsComputed).toBeGreaterThanOrEqual(3);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);

      expect(metricsRepo.upsertBatch).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ metricName: 'WATCH_HOURS', timeGranularity: 'HOURLY' }),
          expect.objectContaining({ metricName: 'COMPLETION_RATE', timeGranularity: 'HOURLY' }),
          expect.objectContaining({ metricName: 'CHOICE_RATE', timeGranularity: 'HOURLY' }),
        ]),
      );
    });
  });

  describe('runDailyRollup', () => {
    it('executes daily aggregation and computes DAU, MAU, Stickiness, Subs and MRR', async () => {
      const targetDate = new Date('2026-10-10T00:00:00.000Z');
      const result = await service.runDailyRollup(targetDate);

      expect(result.granularity).toBe('DAILY');
      expect(result.metricsComputed).toBeGreaterThanOrEqual(8);

      expect(metricsRepo.upsertBatch).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ metricName: 'DAU', numericValue: '1250.0000' }),
          expect.objectContaining({ metricName: 'MAU', numericValue: '5000.0000' }),
          // Stickiness = (1250 / 5000) * 100 = 25.0000%
          expect.objectContaining({ metricName: 'STICKINESS', numericValue: '25.0000' }),
          expect.objectContaining({ metricName: 'ACTIVE_SUBS', numericValue: '120.0000' }),
          expect.objectContaining({ metricName: 'MRR', numericValue: '119880.0000' }),
          // Churn rate = (5 / 120) * 100 = 4.1667%
          expect.objectContaining({ metricName: 'CHURN_RATE', numericValue: '4.1667' }),
          // Net subs = 25 - 5 = 20
          expect.objectContaining({ metricName: 'NET_SUBS', numericValue: '20.0000' }),
        ]),
      );
    });

    it('handles zero activity gracefully without division by zero errors', async () => {
      metricsRepo.executeRaw.mockResolvedValue([]);

      const result = await service.runDailyRollup();
      expect(result.granularity).toBe('DAILY');
      expect(result.metricsComputed).toBeGreaterThanOrEqual(8);

      expect(metricsRepo.upsertBatch).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ metricName: 'DAU', numericValue: '0.0000' }),
          expect.objectContaining({ metricName: 'MAU', numericValue: '0.0000' }),
          expect.objectContaining({ metricName: 'STICKINESS', numericValue: '0.0000' }),
          expect.objectContaining({ metricName: 'ACTIVE_SUBS', numericValue: '0.0000' }),
        ]),
      );
    });
  });
});
