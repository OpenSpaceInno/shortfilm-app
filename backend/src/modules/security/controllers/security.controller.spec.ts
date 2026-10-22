import { Test, TestingModule } from '@nestjs/testing';
import { SecurityController } from './security.controller';
import { SecurityAuditService } from '../services/security-audit.service';

describe('SecurityController', () => {
  let controller: SecurityController;
  let service: SecurityAuditService;

  const mockAuditReport = {
    timestamp: '2026-10-12T18:00:00.000Z',
    environment: 'development',
    overallStatus: 'PASS',
    score: 100,
    summary: { passed: 8, warnings: 0, failed: 0, total: 8 },
    checks: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SecurityController],
      providers: [
        {
          provide: SecurityAuditService,
          useValue: {
            runAudit: jest.fn().mockResolvedValue(mockAuditReport),
            getHeaderConfiguration: jest.fn().mockReturnValue({ helmet: {} }),
            getRateLimitConfiguration: jest.fn().mockReturnValue({ tiers: {} }),
          },
        },
      ],
    }).compile();

    controller = module.get<SecurityController>(SecurityController);
    service = module.get<SecurityAuditService>(SecurityAuditService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return security audit report', async () => {
    const report = await controller.getAudit();
    expect(report).toEqual(mockAuditReport);
    expect(service.runAudit).toHaveBeenCalled();
  });

  it('should return header configuration metadata', () => {
    const headers = controller.getHeaders();
    expect(headers).toEqual({ helmet: {} });
    expect(service.getHeaderConfiguration).toHaveBeenCalled();
  });

  it('should return rate limit configuration metadata', () => {
    const limits = controller.getRateLimits();
    expect(limits).toEqual({ tiers: {} });
    expect(service.getRateLimitConfiguration).toHaveBeenCalled();
  });
});
