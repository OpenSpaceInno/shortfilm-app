import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { SpanStatusCode } from '@opentelemetry/api';
import { TracingService } from '../services/tracing.service';
import { TRACE_SPAN_KEY, TraceSpanMetadata } from '../decorators/trace-span.decorator';

@Injectable()
export class TracingInterceptor implements NestInterceptor {
  constructor(
    private readonly tracingService: TracingService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const metadata = this.reflector.get<TraceSpanMetadata | undefined>(
      TRACE_SPAN_KEY,
      context.getHandler(),
    );

    const spanName =
      metadata?.name ||
      `${req.method} ${req.route?.path || req.path || context.getClass().name + '.' + context.getHandler().name}`;

    const span = this.tracingService.startSpan(spanName);

    if (req.method) {
      span.setAttribute('http.method', req.method);
    }
    if (req.url) {
      span.setAttribute('http.url', req.url);
    }
    if (req.headers['user-agent']) {
      span.setAttribute('http.user_agent', String(req.headers['user-agent']));
    }

    if (metadata?.attributes) {
      for (const [key, val] of Object.entries(metadata.attributes)) {
        span.setAttribute(key, val);
      }
    }

    return next.handle().pipe(
      tap({
        next: () => {
          if (res?.statusCode) {
            span.setAttribute('http.status_code', res.statusCode);
            if (res.statusCode >= 400) {
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: `HTTP ${res.statusCode}`,
              });
            } else {
              span.setStatus({ code: SpanStatusCode.OK });
            }
          }
          span.end();
        },
        error: (err) => {
          const status = err.status || err.statusCode || 500;
          span.setAttribute('http.status_code', status);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: err.message || 'Handler exception',
          });
          span.recordException(err);
          span.end();
        },
      }),
    );
  }
}
