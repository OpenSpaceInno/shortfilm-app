import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ulid } from 'ulidx';
import {
  CORRELATION_ID_HEADER,
  REQUEST_ID_HEADER,
  CF_RAY_HEADER,
} from '../constants/observability.constants';
import { CorrelationContextService } from '../services/correlation-context.service';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  constructor(private readonly contextService: CorrelationContextService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    // 1. Resolve Correlation ID from Cloudflare CF-Ray or incoming headers or generate new ULID
    const rawHeader =
      req.headers[CORRELATION_ID_HEADER] ||
      req.headers[REQUEST_ID_HEADER] ||
      req.headers[CF_RAY_HEADER];

    const correlationId =
      typeof rawHeader === 'string' && rawHeader.trim().length > 0
        ? rawHeader.trim()
        : `req_${ulid()}`;

    // Normalize request headers
    req.headers[CORRELATION_ID_HEADER] = correlationId;

    // Attach correlation ID to outbound HTTP response header
    res.setHeader('X-Correlation-Id', correlationId);

    // 2. Extract Client IP and User-Agent
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp =
      (typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined) ||
      req.ip ||
      req.socket?.remoteAddress;

    const userAgent = req.headers['user-agent'];

    // 3. Bind context to AsyncLocalStorage for all downstream processing
    this.contextService.runWithContext(
      {
        correlationId,
        clientIp,
        userAgent,
        startTime: Date.now(),
      },
      () => {
        next();
      },
    );
  }
}
