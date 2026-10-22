import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../services/audit.service';
import { AUDITED_ACTION_KEY, AuditedActionOptions } from '../decorators/audited-action.decorator';
import { generateUlid } from '../../../database/utils/ulid.util';

@Injectable()
export class AuditLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLoggingInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditOptions = this.reflector.getAllAndOverride<AuditedActionOptions>(
      AUDITED_ACTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!auditOptions) {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest();
    const actor = req.user;

    // Do not log if actor is not an authenticated user
    if (!actor || !actor.id) {
      return next.handle();
    }

    const requestId =
      (req.headers['x-request-id'] as string) ||
      (req.headers['x-correlation-id'] as string) ||
      `req_${generateUlid()}`;

    const rawIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket?.remoteAddress;

    const userAgent = req.headers['user-agent'] as string;

    const previousState = auditOptions.extractPreviousState
      ? auditOptions.extractPreviousState(req)
      : undefined;

    return next.handle().pipe(
      tap({
        next: (data) => {
          this.executeLog({
            actor,
            auditOptions,
            req,
            data,
            requestId,
            ipAddress: rawIp,
            userAgent,
            previousState,
          }).catch((err) => {
            this.logger.error(`Failed to record automated audit log: ${err.message}`, err.stack);
          });
        },
      }),
    );
  }

  private async executeLog(params: {
    actor: any;
    auditOptions: AuditedActionOptions;
    req: any;
    data: any;
    requestId: string;
    ipAddress?: string;
    userAgent?: string;
    previousState?: any;
  }) {
    const {
      actor,
      auditOptions,
      req,
      data,
      requestId,
      ipAddress,
      userAgent,
      previousState,
    } = params;

    let entityId: string | undefined;
    if (auditOptions.extractEntityId) {
      entityId = auditOptions.extractEntityId(req, data);
    } else if (req.params?.id) {
      entityId = req.params.id;
    } else if (req.params?.userId) {
      entityId = req.params.userId;
    } else if (data?.data?.id) {
      entityId = data.data.id;
    } else if (data?.id) {
      entityId = data.id;
    }

    let newState: any;
    if (auditOptions.extractNewState) {
      newState = auditOptions.extractNewState(req, data);
    } else if (req.body && Object.keys(req.body).length > 0) {
      newState = { ...req.body };
      // Redact sensitive payload properties
      delete newState.password;
      delete newState.token;
      delete newState.secret;
    }

    await this.auditService.log({
      actor,
      action: auditOptions.action,
      entityType: auditOptions.entityType,
      entityId,
      previousState,
      newState,
      requestId,
      ipAddress,
      userAgent,
    });
  }
}
