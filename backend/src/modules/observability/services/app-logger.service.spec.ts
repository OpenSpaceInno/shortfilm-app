import { AppLoggerService } from './app-logger.service';
import { CorrelationContextService } from './correlation-context.service';

describe('AppLoggerService', () => {
  let service: AppLoggerService;
  let contextService: CorrelationContextService;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    contextService = new CorrelationContextService();
    service = new AppLoggerService(contextService);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should emit structured JSON adhering to the Log Schema Contract', () => {
    contextService.runWithContext(
      {
        correlationId: 'req_01J8ABCDEF1234567890',
        userId: 'usr_01J8TEST',
        startTime: Date.now(),
      },
      () => {
        service.logStructured({
          module: 'InteractiveEngineModule',
          action: 'CHOICE_RESOLVED',
          durationMs: 14.2,
          context: {
            storyId: 'sty_01J8',
            choiceId: 'chc_01J8',
            password: 'secretPasswordToRedact',
          },
          http: {
            method: 'POST',
            route: '/api/v1/interactive/choices',
            statusCode: 200,
            ip: '203.0.113.195',
            userAgent: 'ShortReel-iOS/1.4',
          },
        });

        expect(consoleSpy).toHaveBeenCalled();
        const loggedJson = JSON.parse(consoleSpy.mock.calls[0][0]);

        expect(loggedJson.service).toBe('shortreel-api');
        expect(loggedJson.correlationId).toBe('req_01J8ABCDEF1234567890');
        expect(loggedJson.userId).toBe('usr_01J8TEST');
        expect(loggedJson.module).toBe('InteractiveEngineModule');
        expect(loggedJson.action).toBe('CHOICE_RESOLVED');
        expect(loggedJson.durationMs).toBe(14.2);
        expect(loggedJson.http.method).toBe('POST');
        expect(loggedJson.context.storyId).toBe('sty_01J8');
        expect(loggedJson.context.password).toBe('[REDACTED]');
      },
    );
  });

  it('should handle standard NestJS log methods', () => {
    service.log('Server started successfully', 'Bootstrap');
    expect(consoleSpy).toHaveBeenCalled();
    const parsed = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(parsed.message).toBe('Server started successfully');
    expect(parsed.module).toBe('Bootstrap');
  });
});
