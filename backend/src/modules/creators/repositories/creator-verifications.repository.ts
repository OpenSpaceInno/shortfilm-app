import { Injectable, Inject } from '@nestjs/common';
import { eq, desc, sql } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import {
  creatorVerifications,
  CreatorVerification,
  VerificationStatus,
} from '../../../database/schema';
import { generateUlid } from '../../../database/utils/ulid.util';

@Injectable()
export class CreatorVerificationsRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async create(
    data: {
      creatorId: string;
      documentType?: string;
      documentUrl?: string;
    },
    tx?: any,
  ): Promise<CreatorVerification> {
    const client = tx || this.db;
    const id = generateUlid();

    await client.insert(creatorVerifications).values({
      id,
      creatorId: data.creatorId,
      documentType: data.documentType || null,
      documentUrl: data.documentUrl || null,
      status: 'PENDING',
    });

    const results = await client
      .select()
      .from(creatorVerifications)
      .where(eq(creatorVerifications.id, id))
      .limit(1);

    return results[0]!;
  }

  async findById(id: string): Promise<CreatorVerification | null> {
    const results = await this.db
      .select()
      .from(creatorVerifications)
      .where(eq(creatorVerifications.id, id))
      .limit(1);

    return results[0] || null;
  }

  async findLatestByCreatorId(creatorId: string): Promise<CreatorVerification | null> {
    const results = await this.db
      .select()
      .from(creatorVerifications)
      .where(eq(creatorVerifications.creatorId, creatorId))
      .orderBy(desc(creatorVerifications.createdAt))
      .limit(1);

    return results[0] || null;
  }

  async findAll(options: {
    status?: VerificationStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ items: CreatorVerification[]; total: number }> {
    const { status, limit = 20, offset = 0 } = options;

    const condition = status ? eq(creatorVerifications.status, status) : undefined;

    const items = await this.db
      .select()
      .from(creatorVerifications)
      .where(condition)
      .orderBy(desc(creatorVerifications.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(creatorVerifications)
      .where(condition);

    const total = Number(countResult[0]?.count || 0);

    return { items, total };
  }

  async update(
    id: string,
    updates: Partial<CreatorVerification>,
    tx?: any,
  ): Promise<CreatorVerification> {
    const client = tx || this.db;

    await client
      .update(creatorVerifications)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(creatorVerifications.id, id));

    const results = await client
      .select()
      .from(creatorVerifications)
      .where(eq(creatorVerifications.id, id))
      .limit(1);

    return results[0]!;
  }
}
