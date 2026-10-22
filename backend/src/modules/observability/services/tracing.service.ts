import { Injectable, OnModuleInit, OnModuleDestroy, Optional } from '@nestjs/common';
import {
  trace,
  context,
  Span,
  SpanStatusCode,
  Tracer,
  SpanOptions,
} from '@opentelemetry/api';
import {
  BasicTracerProvider,
  SimpleSpanProcessor,
  InMemorySpanExporter,
} from '@opentelemetry/sdk-trace-base';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { CorrelationContextService } from './correlation-context.service';

@Injectable()
export class TracingService implements OnModuleInit, OnModuleDestroy {
  private tracerProvider!: BasicTracerProvider;
  private tracer!: Tracer;
  private readonly memoryExporter = new InMemorySpanExporter();

  constructor(
    @Optional() private readonly correlationService?: CorrelationContextService,
  ) {}

  onModuleInit(): void {
    const resource = resourceFromAttributes({
      [ATTR_SERVICE_NAME]: 'shortreel-api',
      [ATTR_SERVICE_VERSION]: '1.0.0',
      'deployment.environment': process.env.NODE_ENV || 'development',
    });

    this.tracerProvider = new BasicTracerProvider({
      resource,
      spanProcessors: [new SimpleSpanProcessor(this.memoryExporter)],
    });

    trace.setGlobalTracerProvider(this.tracerProvider);
    this.tracer = this.tracerProvider.getTracer('shortreel-api', '1.0.0');
  }

  onModuleDestroy(): void {
    if (this.tracerProvider) {
      this.tracerProvider.shutdown().catch(() => {});
    }
  }

  /**
   * Returns the underlying OpenTelemetry Tracer instance.
   */
  getTracer(): Tracer {
    return this.tracer;
  }

  /**
   * Starts a new trace span with standard correlation metadata.
   */
  startSpan(name: string, options?: SpanOptions): Span {
    const correlationId = this.correlationService?.getCorrelationId();
    const userId = this.correlationService?.getUserId();

    const span = this.tracer.startSpan(name, options);

    if (correlationId) {
      span.setAttribute('correlation.id', correlationId);
    }
    if (userId) {
      span.setAttribute('user.id', userId);
    }

    return span;
  }

  /**
   * Executes a synchronous or asynchronous callback within an active trace span.
   */
  async withSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T> | T,
    attributes?: Record<string, any>,
  ): Promise<T> {
    const span = this.startSpan(name);

    if (attributes) {
      for (const [key, value] of Object.entries(attributes)) {
        if (value !== undefined && value !== null) {
          span.setAttribute(key, String(value));
        }
      }
    }

    return context.with(trace.setSpan(context.active(), span), async () => {
      try {
        const result = await fn(span);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error: any) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error?.message || 'Execution error',
        });
        span.recordException(error);
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Returns the current active span in the OpenTelemetry context.
   */
  getCurrentSpan(): Span | undefined {
    return trace.getSpan(context.active());
  }

  /**
   * Sets an attribute on the currently active trace span.
   */
  setSpanAttribute(key: string, value: any): void {
    const span = this.getCurrentSpan();
    if (span && value !== undefined && value !== null) {
      span.setAttribute(key, String(value));
    }
  }

  /**
   * Returns the current trace ID if an active span exists.
   */
  getTraceId(): string | undefined {
    const span = this.getCurrentSpan();
    return span?.spanContext().traceId;
  }

  /**
   * Returns the current span ID if an active span exists.
   */
  getSpanId(): string | undefined {
    const span = this.getCurrentSpan();
    return span?.spanContext().spanId;
  }

  /**
   * Returns exported in-memory spans (primarily for testing and assertions).
   */
  getFinishedSpans() {
    return this.memoryExporter.getFinishedSpans();
  }

  /**
   * Clears accumulated in-memory spans.
   */
  clearSpans(): void {
    this.memoryExporter.reset();
  }
}
