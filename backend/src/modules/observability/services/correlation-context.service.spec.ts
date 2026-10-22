import { CorrelationContextService } from './correlation-context.service';

describe('CorrelationContextService', () => {
  let service: CorrelationContextService;

  beforeEach(() => {
    service = new CorrelationContextService();
  });

  it('should generate a fallback correlation ID when called outside request context', () => {
    const correlationId = service.getCorrelationId();
    expect(correlationId).toMatch(/^req_[0-9A-Z]{26}$/);
    expect(service.getContext()).toBeUndefined();
  });

  it('should store and retrieve context within runWithContext', () => {
    service.runWithContext(
      {
        correlationId: 'req_test_123',
        userId: 'usr_abc',
        clientIp: '192.168.1.50',
        userAgent: 'ShortReel-iOS/1.4',
        startTime: Date.now(),
      },
      () => {
        expect(service.getCorrelationId()).toBe('req_test_123');
        expect(service.getUserId()).toBe('usr_abc');
        expect(service.getClientIp()).toBe('192.168.1.50');
        expect(service.getUserAgent()).toBe('ShortReel-iOS/1.4');

        service.setUserId('usr_updated');
        expect(service.getUserId()).toBe('usr_updated');

        service.setMetadata('route', '/stories');
        expect(service.getContext()?.metadata?.route).toBe('/stories');
      },
    );

    // Context should be isolated and cleaned up outside
    expect(service.getContext()).toBeUndefined();
  });
});
