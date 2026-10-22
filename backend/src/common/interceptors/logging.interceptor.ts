import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const correlationId =
      (request.headers['x-correlation-id'] as string) ||
      (request.headers['x-request-id'] as string) ||
      `req_${Date.now()}`;

    // Ensure correlation ID is attached to response headers
    response.setHeader('X-Correlation-Id', correlationId);

    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const delay = Date.now() - now;
          this.logger.log(`[${correlationId}] ${method} ${url} ${response.statusCode} - ${delay}ms`);
        },
        error: (error) => {
          const delay = Date.now() - now;
          const status = error.status || 500;
          this.logger.warn(`[${correlationId}] ${method} ${url} ${status} - ${delay}ms - ${error.message}`);
        },
      }),
    );
  }
}
