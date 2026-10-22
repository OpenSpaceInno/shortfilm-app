import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService } from '@nestjs/terminus';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: jest.Mocked<HealthCheckService>;

  beforeEach(async () => {
    const mockHealthService = {
      check: jest.fn().mockImplementation((indicators) => {
        return Promise.resolve({
          status: 'ok',
          info: { app: { status: 'up' } },
          error: {},
          details: { app: { status: 'up' } },
        });
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get(HealthCheckService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('liveness', () => {
    it('should return status ok with uptime and timestamp', () => {
      const result = controller.liveness();
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('timestamp');
      expect(typeof result.uptime).toBe('number');
    });
  });

  describe('readiness', () => {
    it('should invoke health check service and report ready', async () => {
      const result = await controller.readiness();
      expect(result.status).toBe('ok');
      expect(healthCheckService.check).toHaveBeenCalled();
    });
  });
});
