import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AuditLogsRepository, CreateAuditLogEntry } from '../repositories/audit-logs.repository';
import { QueryAuditLogsDto } from '../dto/query-audit-logs.dto';
import { AuditLogResponseDto, PaginatedAuditLogsResponseDto } from '../dto/audit-log-response.dto';
import { AuditExportDto } from '../dto/audit-export.dto';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';

export interface AuditActionParams {
  actor: AuthenticatedUser | { id: string; roles?: string[] };
  action: string;
  entityType: string;
  entityId?: string | null;
  previousState?: any;
  newState?: any;
  requestId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly auditLogsRepo: AuditLogsRepository) {}

  /**
   * Primary immutable audit logger required across all administrative state mutations
   * Ref: 19_ADMIN_CMS.md & 24_AUDIT_LOGGING.md
   */
  async log(params: AuditActionParams): Promise<AuditLogResponseDto> {
    const actorRole =
      params.actor.roles && params.actor.roles.length > 0
        ? params.actor.roles[0]!
        : 'SUPER_ADMIN';

    this.logger.log(
      `[Audit] Action=${params.action} Entity=${params.entityType}:${params.entityId || 'N/A'} Actor=${params.actor.id} (${actorRole})`,
    );

    const record = await this.auditLogsRepo.log({
      actorId: params.actor.id,
      actorRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      previousState: params.previousState,
      newState: params.newState,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      requestId: params.requestId,
    });

    return this.mapToDto(record);
  }

  async getAuditTrail(
    query: QueryAuditLogsDto,
  ): Promise<PaginatedAuditLogsResponseDto> {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const { items, total } = await this.auditLogsRepo.findMany(query);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: items.map((r) => this.mapToDto(r)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getAuditLogById(id: string): Promise<AuditLogResponseDto> {
    const record = await this.auditLogsRepo.findById(id);
    if (!record) {
      throw new NotFoundException(`Audit log record '${id}' not found`);
    }

    return this.mapToDto(record);
  }

  /**
   * Export audit logs in JSON or CSV for legal and regulatory compliance auditors
   */
  async exportAuditTrail(
    filter: AuditExportDto,
  ): Promise<{ data: string; contentType: string; filename: string }> {
    const format = filter.format || 'json';
    const logs = await this.auditLogsRepo.exportLogs(filter);
    const mapped = logs.map((l) => this.mapToDto(l));
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    if (format === 'csv') {
      const headers = [
        'id',
        'createdAt',
        'actorId',
        'actorRole',
        'action',
        'entityType',
        'entityId',
        'ipAddress',
        'requestId',
      ];

      const csvRows = [headers.join(',')];

      for (const log of mapped) {
        const row = [
          log.id,
          log.createdAt,
          log.actorId,
          `"${log.actorRole}"`,
          `"${log.action}"`,
          `"${log.entityType}"`,
          log.entityId || '',
          log.ipAddress || '',
          log.requestId || '',
        ];
        csvRows.push(row.join(','));
      }

      return {
        data: csvRows.join('\n'),
        contentType: 'text/csv',
        filename: `audit-trail-${timestamp}.csv`,
      };
    }

    return {
      data: JSON.stringify(mapped, null, 2),
      contentType: 'application/json',
      filename: `audit-trail-${timestamp}.json`,
    };
  }

  async getAuditRetentionMetrics(): Promise<{ totalLogs: number; olderThanOneYear: number }> {
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const totalLogs = await this.auditLogsRepo.countTotal();
    const olderThanOneYear = await this.auditLogsRepo.countOlderThan(oneYearAgo);

    return { totalLogs, olderThanOneYear };
  }

  private mapToDto(record: any): AuditLogResponseDto {
    return {
      id: record.id,
      actorId: record.actorId,
      actorRole: record.actorRole,
      action: record.action,
      entityType: record.entityType,
      entityId: record.entityId,
      previousState: record.previousState,
      newState: record.newState,
      ipAddress: record.ipAddress,
      userAgent: record.userAgent,
      requestId: record.requestId,
      createdAt:
        record.createdAt instanceof Date
          ? record.createdAt.toISOString()
          : record.createdAt,
    };
  }
}
