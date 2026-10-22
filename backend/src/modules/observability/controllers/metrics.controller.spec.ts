import { Test, TestingModule } from '@nestjs/testing';
import { MetricsController } from './metrics.controller';
import { MetricsService } from '../services/metrics.service';

describe('MetricsController', () => {
  let controller: MetricsController;
  let metricsService: MetricsService;

  beforeEach(async () => {
    const mockMetricsService = {
      getMetrics: jest.fn().mockResolvedValue('# HELP http_requests_total\nhttp_requests_total 10'),
      getContentType: jest.fn().mockReturnValue('text/plain; version=0.0.4; charset=utf-8'),
      getMetricsSummary: jest.fn().mockResolvedValue({
        uptimeSeconds: 120,
        dbConnections: 5,
        redisClients: 3,
        metricRegistrySize: 8,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    controller = module.get<MetricsController>(MetricsController);
    metricsService = module.get<MetricsService>(MetricsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMetricsRoot', () => {
    it('should set Content-Type header and send prometheus metrics output', async () => {
      const res: any = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await controller.getMetricsRoot(res);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/plain; version=0.0.4; charset=utf-8',
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        '# HELP http_requests_total\nhttp_requests_total 10',
      );
    });
  });

  describe('getMetricsSummary', () => {
    it('should return metrics summary JSON', async () => {
      const summary = await controller.getMetricsSummary();
      expect(summary.uptimeSeconds).toBe(120);
      expect(summary.dbConnections).toBe(5);
    });
  });
});
