import { TracingService } from './tracing.service';
import { CorrelationContextService } from './correlation-context.service';

describe('TracingService', () => {
  let service: TracingService;
  let correlationService: CorrelationContextService;

  beforeEach(() => {
    correlationService = new CorrelationContextService();
    service = new TracingService(correlationService);
    service.onModuleInit();
  });

  afterEach(() => {
    service.clearSpans();
    service.onModuleDestroy();
  });

  it('should start a span and capture correlation context attributes', () => {
    correlationService.runWithContext(
      {
        correlationId: 'req_trace_test_123',
        userId: 'usr_trace_user',
        startTime: Date.now(),
      },
      () => {
        const span = service.startSpan('test.operation');
        expect(span).toBeDefined();
        span.end();

        const finishedSpans = service.getFinishedSpans();
        expect(finishedSpans.length).toBeGreaterThanOrEqual(1);
        const finishedSpan = finishedSpans.find((s) => s.name === 'test.operation');
        expect(finishedSpan?.attributes['correlation.id']).toBe('req_trace_test_123');
        expect(finishedSpan?.attributes['user.id']).toBe('usr_trace_user');
      },
    );
  });

  it('should execute a function within withSpan and record attributes and outcome', async () => {
    const result = await service.withSpan(
      'choice.resolve',
      async (span) => {
        span.setAttribute('choice.id', 'chc_001');
        return { success: true };
      },
      { 'story.id': 'sty_001' },
    );

    expect(result.success).toBe(true);

    const spans = service.getFinishedSpans();
    const targetSpan = spans.find((s) => s.name === 'choice.resolve');
    expect(targetSpan).toBeDefined();
    expect(targetSpan?.attributes['choice.id']).toBe('chc_001');
    expect(targetSpan?.attributes['story.id']).toBe('sty_001');
  });

  it('should record exception and mark span as error when withSpan throws', async () => {
    await expect(
      service.withSpan('failing.operation', async () => {
        throw new Error('Database query timed out');
      }),
    ).rejects.toThrow('Database query timed out');

    const spans = service.getFinishedSpans();
    const failingSpan = spans.find((s) => s.name === 'failing.operation');
    expect(failingSpan).toBeDefined();
    expect(failingSpan?.status.code).toBe(2); // SpanStatusCode.ERROR = 2
    expect(failingSpan?.status.message).toBe('Database query timed out');
  });
});
