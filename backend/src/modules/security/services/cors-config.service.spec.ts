import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CorsConfigService } from './cors-config.service';

describe('CorsConfigService', () => {
  let service: CorsConfigService;
  let configService: ConfigService;

  const mockConfigService = (env: Record<string, string>) => ({
    get: jest.fn((key: string, defaultValue?: any) => env[key] ?? defaultValue),
  });

  describe('in development mode', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CorsConfigService,
          {
            provide: ConfigService,
            useValue: mockConfigService({
              NODE_ENV: 'development',
              CORS_ORIGINS: 'https://shortreel.io, https://app.shortreel.io',
            }),
          },
        ],
      }).compile();

      service = module.get<CorsConfigService>(CorsConfigService);
      configService = module.get<ConfigService>(ConfigService);
    });

    it('should initialize allowed origins properly', () => {
      const origins = service.getAllowedOrigins();
      expect(origins).toEqual(['https://shortreel.io', 'https://app.shortreel.io']);
    });

    it('should allow undefined origin (server-to-server or same-origin)', () => {
      expect(service.isOriginAllowed(undefined)).toBe(true);
    });

    it('should allow exact match configured origins', () => {
      expect(service.isOriginAllowed('https://shortreel.io')).toBe(true);
      expect(service.isOriginAllowed('https://app.shortreel.io/')).toBe(true); // handles trailing slash
    });

    it('should allow localhost origins in development mode', () => {
      expect(service.isOriginAllowed('http://localhost:5173')).toBe(true);
      expect(service.isOriginAllowed('http://localhost:3000')).toBe(true);
      expect(service.isOriginAllowed('http://127.0.0.1:8080')).toBe(true);
    });

    it('should reject unauthorized public domains', () => {
      expect(service.isOriginAllowed('https://evil-hacker.com')).toBe(false);
      expect(service.isOriginAllowed('https://fake-shortreel.io')).toBe(false);
    });

    it('should configure getCorsOptions with origin callback executing correctly', (done) => {
      const options = service.getCorsOptions();
      expect(options.credentials).toBe(true);
      expect(options.methods).toBeDefined();
      expect(options.exposedHeaders).toContain('X-Correlation-Id');

      const originFn = options.origin as Function;
      originFn('https://shortreel.io', (err: any, allow: boolean) => {
        expect(err).toBeNull();
        expect(allow).toBe(true);

        originFn('https://malicious.org', (malErr: any, malAllow: boolean) => {
          expect(malErr).toBeInstanceOf(Error);
          expect(malAllow).toBe(false);
          done();
        });
      });
    });
  });

  describe('in production mode', () => {
    it('should strip wildcard origin if present in production', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CorsConfigService,
          {
            provide: ConfigService,
            useValue: mockConfigService({
              NODE_ENV: 'production',
              CORS_ORIGINS: 'https://shortreel.io, *',
            }),
          },
        ],
      }).compile();

      const prodService = module.get<CorsConfigService>(CorsConfigService);
      const origins = prodService.getAllowedOrigins();
      expect(origins).toEqual(['https://shortreel.io']);
      expect(origins).not.toContain('*');
    });

    it('should reject localhost in production mode if not explicitly listed', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CorsConfigService,
          {
            provide: ConfigService,
            useValue: mockConfigService({
              NODE_ENV: 'production',
              CORS_ORIGINS: 'https://shortreel.io',
            }),
          },
        ],
      }).compile();

      const prodService = module.get<CorsConfigService>(CorsConfigService);
      expect(prodService.isOriginAllowed('http://localhost:5173')).toBe(false);
      expect(prodService.isOriginAllowed('https://shortreel.io')).toBe(true);
    });
  });
});
