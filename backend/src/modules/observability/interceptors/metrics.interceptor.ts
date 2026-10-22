import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { MetricsService } from '../services/metrics.service';

// Regular expressions to normalize route parameters to prevent high cardinality
const ULID_OR_UUID_REGEX = /[0-9a-fA-F-]{36}|[0-9A-HJ-KM-NP-TV-Z]{26}/g;
const NUMERIC_ID_REGEX = /\/\d+(\/|$)/g;

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const startHrTime = process.hrtime();
    const rawPath = req.baseUrl ? `${req.baseUrl}${req.path || ''}` : req.path || req.url;

    return next.handle().pipe(
      tap({
        next: () => {
          this.record(req.method, rawPath, res.statusCode, startHrTime);
        },
        error: (err) => {
          const status = err.status || err.statusCode || 500;
          this.record(req.method, rawPath, status, startHrTime);
        },
      }),
    );
  }

  private record(
    method: string,
    rawPath: string,
    statusCode: number,
    startHrTime: [number, number],
  ): void {
    const diff = process.hrtime(startHrTime);
    const durationSeconds = diff[0] + diff[1] / 1e9;
    const normalizedRoute = this.normalizeRoute(rawPath);

    this.metricsService.recordHttpRequest(
      method,
      normalizedRoute,
      statusCode,
      durationSeconds,
    );
  }

  /**
   * Normalizes raw URLs into parameterized route templates to prevent cardinality explosion in Prometheus.
   */
  public normalizeRoute(path: string): string {
    if (!path) return '/';

    // Strip query parameters
    const cleanPath = path.split('?')[0] || '/';

    // Normalize IDs
    return cleanPath
      .replace(ULID_OR_UUID_REGEX, ':id')
      .replace(NUMERIC_ID_REGEX, '/:id$1');
  }
}
