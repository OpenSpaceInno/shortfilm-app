import { Injectable, LoggerService, Optional } from '@nestjs/common';
import { CorrelationContextService } from './correlation-context.service';
import { redactPii } from '../utils/pii-redactor.util';

export interface StructuredHttpLog {
  method?: string;
  route?: string;
  statusCode?: number;
  ip?: string;
  userAgent?: string;
}

export interface StructuredLogPayload {
  level?: 'info' | 'warn' | 'error' | 'debug' | 'verbose';
  module?: string;
  action?: string;
  context?: Record<string, unknown> | unknown;
  durationMs?: number;
  http?: StructuredHttpLog;
  userId?: string;
  correlationId?: string;
  message?: string;
  stack?: string;
}

@Injectable()
export class AppLoggerService implements LoggerService {
  private readonly serviceName = 'shortreel-api';

  constructor(
    @Optional() private readonly correlationContextService?: CorrelationContextService,
  ) {}

  /**
   * Emits a fully structured JSON log conforming to the ShortReel Observability schema contract.
   */
  logStructured(entry: StructuredLogPayload): void {
    const correlationId =
      entry.correlationId ||
      this.correlationContextService?.getCorrelationId() ||
      'unknown';

    const userId =
      entry.userId ||
      this.correlationContextService?.getUserId();

    const sanitizedContext = entry.context ? redactPii(entry.context) : undefined;
    const sanitizedHttp = entry.http ? redactPii(entry.http) : undefined;

    const record: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level: entry.level || 'info',
      correlationId,
      ...(userId ? { userId } : {}),
      service: this.serviceName,
      ...(entry.module ? { module: entry.module } : {}),
      ...(entry.action ? { action: entry.action } : {}),
      ...(entry.message ? { message: entry.message } : {}),
      ...(sanitizedContext ? { context: sanitizedContext } : {}),
      ...(entry.durationMs !== undefined ? { durationMs: entry.durationMs } : {}),
      ...(sanitizedHttp ? { http: sanitizedHttp } : {}),
      ...(entry.stack ? { stack: entry.stack } : {}),
    };

    // Output raw JSON formatted string for structured log processors (Datadog/Loki/CloudWatch)
    const jsonOutput = JSON.stringify(record);

    switch (entry.level) {
      case 'error':
        // eslint-disable-next-line no-console
        console.error(jsonOutput);
        break;
      case 'warn':
        // eslint-disable-next-line no-console
        console.warn(jsonOutput);
        break;
      case 'debug':
        // eslint-disable-next-line no-console
        console.debug(jsonOutput);
        break;
      default:
        // eslint-disable-next-line no-console
        console.log(jsonOutput);
        break;
    }
  }

  log(message: any, context?: string): void {
    this.logStructured({
      level: 'info',
      message: typeof message === 'string' ? message : JSON.stringify(message),
      module: context,
    });
  }

  error(message: any, trace?: string, context?: string): void {
    this.logStructured({
      level: 'error',
      message: typeof message === 'string' ? message : JSON.stringify(message),
      stack: trace,
      module: context,
    });
  }

  warn(message: any, context?: string): void {
    this.logStructured({
      level: 'warn',
      message: typeof message === 'string' ? message : JSON.stringify(message),
      module: context,
    });
  }

  debug?(message: any, context?: string): void {
    this.logStructured({
      level: 'debug',
      message: typeof message === 'string' ? message : JSON.stringify(message),
      module: context,
    });
  }

  verbose?(message: any, context?: string): void {
    this.logStructured({
      level: 'verbose',
      message: typeof message === 'string' ? message : JSON.stringify(message),
      module: context,
    });
  }
}
