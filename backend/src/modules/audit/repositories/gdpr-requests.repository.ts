import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, and, desc, sql } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import {
  gdprRequests,
  GdprRequest,
  GdprRequestType,
  GdprRequestStatus,
} from '../../../database/schema/compliance.schema';
import { generateUlid } from '../../../database/utils/ulid.util';
import { QueryGdprRequestsDto } from '../dto/gdpr.dto';

export interface CreateGdprRequestInput {
  userId: string;
  requestType: GdprRequestType;
  status?: GdprRequestStatus;
  gracePeriodEndsAt?: Date | null;
  reason?: string | null;
  metadata?: Record<string, any> | null;
}

@Injectable()
export class GdprRequestsRepository {
  private readonly logger = new Logger(GdprRequestsRepository.name);

  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db(): MySql2Database {
    return this.dbService.getDb();
  }

  async create(input: CreateGdprRequestInput): Promise<GdprRequest> {
    const id = generateUlid();

    await this.db.insert(gdprRequests).values({
      id,
      userId: input.userId,
      requestType: input.requestType,
      status: input.status || 'PENDING',
      gracePeriodEndsAt: input.gracePeriodEndsAt || null,
      reason: input.reason || null,
      metadata: input.metadata || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const inserted = await this.findById(id);
    if (!inserted) {
      throw new Error(`Failed to retrieve newly created GDPR request '${id}'`);
    }
    return inserted;
  }

  async findById(id: string): Promise<GdprRequest | null> {
    const rows = await this.db
      .select()
      .from(gdprRequests)
      .where(eq(gdprRequests.id, id))
      .limit(1);

    return rows[0] || null;
  }

  async findByUserId(userId: string): Promise<GdprRequest[]> {
    return this.db
      .select()
      .from(gdprRequests)
      .where(eq(gdprRequests.userId, userId))
      .orderBy(desc(gdprRequests.createdAt));
  }

  async findMany(
    query: QueryGdprRequestsDto,
  ): Promise<{ items: GdprRequest[]; total: number }> {
    const conditions = [];

    if (query.requestType) {
      conditions.push(eq(gdprRequests.requestType, query.requestType));
    }
    if (query.status) {
      conditions.push(eq(gdprRequests.status, query.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(gdprRequests)
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);

    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const items = await this.db
      .select()
      .from(gdprRequests)
      .where(whereClause)
      .orderBy(desc(gdprRequests.createdAt))
      .limit(limit)
      .offset(offset);

    return { items, total };
  }

  async update(
    id: string,
    data: Partial<Omit<GdprRequest, 'id' | 'createdAt'>>,
  ): Promise<GdprRequest | null> {
    await this.db
      .update(gdprRequests)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(gdprRequests.id, id));

    return this.findById(id);
  }

  async countPending(): Promise<number> {
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(gdprRequests)
      .where(eq(gdprRequests.status, 'PENDING'));

    return Number(countResult[0]?.count || 0);
  }
}
