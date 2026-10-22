import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SecurityAuditService } from './security-audit.service';
import { CorsConfigService } from './cors-config.service';

describe('SecurityAuditService', () => {
  let service: SecurityAuditService;
  let corsConfigService: CorsConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityAuditService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              if (key === 'NODE_ENV') return 'development';
              return defaultValue;
            }),
          },
        },
        {
          provide: CorsConfigService,
          useValue: {
            getAllowedOrigins: jest.fn().mockReturnValue(['https://shortreel.io', 'http://localhost:5173']),
            getCorsOptions: jest.fn().mockReturnValue({
              exposedHeaders: ['X-Correlation-Id', 'X-RateLimit-Limit'],
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SecurityAuditService>(SecurityAuditService);
    corsConfigService = module.get<CorsConfigService>(CorsConfigService);
  });

  it('should run comprehensive security audit successfully', async () => {
    const report = await service.runAudit();

    expect(report).toBeDefined();
    expect(report.overallStatus).toBe('PASS');
    expect(report.score).toBe(100);
    expect(report.summary.total).toBeGreaterThan(0);
    expect(report.summary.failed).toBe(0);

    const categories = new Set(report.checks.map((c) => c.category));
    expect(categories.has('HEADERS')).toBe(true);
    expect(categories.has('CORS')).toBe(true);
    expect(categories.has('THROTTLING')).toBe(true);
    expect(categories.has('VALIDATION')).toBe(true);
    expect(categories.has('DATA_PROTECTION')).toBe(true);
  });

  it('should return header configuration metadata', () => {
    const headers = service.getHeaderConfiguration();
    expect(headers.helmet).toBeDefined();
    expect(headers.allowedHeaders).toContain('Authorization');
    expect(headers.exposedHeaders).toContain('X-Correlation-Id');
  });

  it('should return rate limit configuration metadata', () => {
    const rateLimits = service.getRateLimitConfiguration();
    expect(rateLimits.tiers).toBeDefined();
    expect(rateLimits.tiers.default).toBeDefined();
    expect(rateLimits.tiers.auth).toBeDefined();
    expect(rateLimits.tiers.ai).toBeDefined();
    expect(rateLimits.tiers.analytics).toBeDefined();
    expect(rateLimits.probeBypassPaths).toContain('/health');
    expect(rateLimits.probeBypassPaths).toContain('/metrics');
  });
});
