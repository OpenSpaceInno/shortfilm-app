import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, and, sql, desc, gte, lte, lt } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import { auditLogs, AuditLog } from '../../../database/schema/admin.schema';
import { generateUlid } from '../../../database/utils/ulid.util';
import { QueryAuditLogsDto } from '../dto/query-audit-logs.dto';
import { AuditExportDto } from '../dto/audit-export.dto';

export interface CreateAuditLogEntry {
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  previousState?: any;
  newState?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
}

@Injectable()
export class AuditLogsRepository {
  private readonly logger = new Logger(AuditLogsRepository.name);

  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db(): MySql2Database {
    return this.dbService.getDb();
  }

  async log(entry: CreateAuditLogEntry): Promise<AuditLog> {
    const id = generateUlid();

    await this.db.insert(auditLogs).values({
      id,
      actorId: entry.actorId,
      actorRole: entry.actorRole,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId || null,
      previousState: entry.previousState ?? null,
      newState: entry.newState ?? null,
      ipAddress: entry.ipAddress || null,
      userAgent: entry.userAgent || null,
      requestId: entry.requestId || null,
      createdAt: new Date(),
    });

    const inserted = await this.findById(id);
    if (!inserted) {
      throw new Error(`Failed to retrieve newly created audit log '${id}'`);
    }
    return inserted;
  }

  async findById(id: string): Promise<AuditLog | null> {
    const rows = await this.db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.id, id))
      .limit(1);

    return rows[0] || null;
  }

  async findMany(query: QueryAuditLogsDto): Promise<{ items: AuditLog[]; total: number }> {
    const conditions = [];

    if (query.actorId) {
      conditions.push(eq(auditLogs.actorId, query.actorId));
    }
    if (query.actorRole) {
      conditions.push(eq(auditLogs.actorRole, query.actorRole));
    }
    if (query.action) {
      conditions.push(eq(auditLogs.action, query.action));
    }
    if (query.entityType) {
      conditions.push(eq(auditLogs.entityType, query.entityType));
    }
    if (query.entityId) {
      conditions.push(eq(auditLogs.entityId, query.entityId));
    }
    if (query.fromDate) {
      conditions.push(gte(auditLogs.createdAt, new Date(query.fromDate)));
    }
    if (query.toDate) {
      conditions.push(lte(auditLogs.createdAt, new Date(query.toDate)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);

    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const items = await this.db
      .select()
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return { items, total };
  }

  async exportLogs(filter: AuditExportDto): Promise<AuditLog[]> {
    const conditions = [];

    if (filter.actorId) {
      conditions.push(eq(auditLogs.actorId, filter.actorId));
    }
    if (filter.action) {
      conditions.push(eq(auditLogs.action, filter.action));
    }
    if (filter.entityType) {
      conditions.push(eq(auditLogs.entityType, filter.entityType));
    }
    if (filter.fromDate) {
      conditions.push(gte(auditLogs.createdAt, new Date(filter.fromDate)));
    }
    if (filter.toDate) {
      conditions.push(lte(auditLogs.createdAt, new Date(filter.toDate)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch up to 10,000 logs for auditor export
    return this.db
      .select()
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(10000);
  }

  async countTotal(): Promise<number> {
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs);
    return Number(countResult[0]?.count || 0);
  }

  async countOlderThan(cutoffDate: Date): Promise<number> {
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(lt(auditLogs.createdAt, cutoffDate));

    return Number(countResult[0]?.count || 0);
  }
}
