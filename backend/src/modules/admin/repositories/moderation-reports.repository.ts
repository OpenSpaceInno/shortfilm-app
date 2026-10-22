import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, and, sql, desc } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import {
  moderationReports,
  ModerationReport,
  ModerationReportTargetType,
  ModerationReportReason,
  ModerationReportStatus,
  ResolutionAction,
} from '../../../database/schema/admin.schema';
import { generateUlid } from '../../../database/utils/ulid.util';
import { QueryModerationReportsDto } from '../dto/user-moderation.dto';

@Injectable()
export class ModerationReportsRepository {
  private readonly logger = new Logger(ModerationReportsRepository.name);

  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db(): MySql2Database {
    return this.dbService.getDb();
  }

  async create(data: {
    reporterUserId?: string;
    targetType: ModerationReportTargetType;
    targetId: string;
    reason: ModerationReportReason;
    details?: string;
  }): Promise<ModerationReport> {
    const id = generateUlid();

    await this.db.insert(moderationReports).values({
      id,
      reporterUserId: data.reporterUserId || null,
      targetType: data.targetType,
      targetId: data.targetId,
      reason: data.reason,
      details: data.details || null,
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const inserted = await this.findById(id);
    if (!inserted) {
      throw new Error(`Failed to retrieve newly created moderation report '${id}'`);
    }
    return inserted;
  }

  async findById(id: string): Promise<ModerationReport | null> {
    const rows = await this.db
      .select()
      .from(moderationReports)
      .where(eq(moderationReports.id, id))
      .limit(1);

    return rows[0] || null;
  }

  async findMany(query: QueryModerationReportsDto): Promise<{ items: ModerationReport[]; total: number }> {
    const conditions = [];

    if (query.targetType) {
      conditions.push(eq(moderationReports.targetType, query.targetType));
    }
    if (query.status) {
      conditions.push(eq(moderationReports.status, query.status));
    }
    if (query.reason) {
      conditions.push(eq(moderationReports.reason, query.reason));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(moderationReports)
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);

    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const items = await this.db
      .select()
      .from(moderationReports)
      .where(whereClause)
      .orderBy(desc(moderationReports.createdAt))
      .limit(limit)
      .offset(offset);

    return { items, total };
  }

  async updateResolution(
    id: string,
    resolution: {
      action: ResolutionAction;
      notes: string;
      resolvedBy: string;
    },
  ): Promise<ModerationReport | null> {
    const newStatus: ModerationReportStatus =
      resolution.action === 'DISMISSED' ? 'DISMISSED' : 'RESOLVED';

    await this.db
      .update(moderationReports)
      .set({
        status: newStatus,
        resolutionAction: resolution.action,
        resolutionNotes: resolution.notes,
        resolvedBy: resolution.resolvedBy,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(moderationReports.id, id));

    return this.findById(id);
  }

  async countPending(): Promise<number> {
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(moderationReports)
      .where(eq(moderationReports.status, 'PENDING'));

    return Number(countResult[0]?.count || 0);
  }

  async countReportsAgainst(targetType: ModerationReportTargetType, targetId: string): Promise<number> {
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(moderationReports)
      .where(
        and(
          eq(moderationReports.targetType, targetType),
          eq(moderationReports.targetId, targetId),
        ),
      );

    return Number(countResult[0]?.count || 0);
  }
}
