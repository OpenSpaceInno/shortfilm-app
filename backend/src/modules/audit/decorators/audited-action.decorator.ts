import { SetMetadata, CustomDecorator } from '@nestjs/common';
import { AuditActionType } from '../constants/audit-actions.constant';

export const AUDITED_ACTION_KEY = 'AUDITED_ACTION_KEY';

export interface AuditedActionOptions {
  action: AuditActionType;
  entityType: string;
  extractEntityId?: (req: any, resData?: any) => string | undefined;
  extractPreviousState?: (req: any) => any;
  extractNewState?: (req: any, resData?: any) => any;
}

/**
 * Decorator to attach audit tracing metadata to controller methods.
 * When applied, the AuditLoggingInterceptor will automatically log this action to `audit_logs`.
 */
export const AuditedAction = (options: AuditedActionOptions): CustomDecorator<string> =>
  SetMetadata(AUDITED_ACTION_KEY, options);
