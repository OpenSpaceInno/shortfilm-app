import { Injectable, Inject } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import { userChoices, UserChoice, NewUserChoice } from '../../../database/schema';

@Injectable()
export class UserChoicesRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async create(data: NewUserChoice, tx?: any): Promise<UserChoice> {
    const client = tx || this.db;
    await client.insert(userChoices).values(data);
    const created = await this.findById(data.id!, tx);
    return created!;
  }

  async findById(id: string, tx?: any): Promise<UserChoice | null> {
    const client = tx || this.db;
    const results = await client
      .select()
      .from(userChoices)
      .where(eq(userChoices.id, id))
      .limit(1);

    return results[0] || null;
  }

  async findByUserAndChoice(
    userId: string,
    choiceId: string,
    tx?: any,
  ): Promise<UserChoice | null> {
    const client = tx || this.db;
    const results = await client
      .select()
      .from(userChoices)
      .where(and(eq(userChoices.userId, userId), eq(userChoices.choiceId, choiceId)))
      .limit(1);

    return results[0] || null;
  }

  async findByUserAndVersion(
    userId: string,
    storyVersionId: string,
  ): Promise<UserChoice[]> {
    return this.db
      .select()
      .from(userChoices)
      .where(
        and(
          eq(userChoices.userId, userId),
          eq(userChoices.storyVersionId, storyVersionId),
        ),
      )
      .orderBy(userChoices.createdAt);
  }

  async countByOptionId(choiceOptionId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(userChoices)
      .where(eq(userChoices.choiceOptionId, choiceOptionId));

    return Number(result[0]?.count || 0);
  }

  async countByUser(userId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(userChoices)
      .where(eq(userChoices.userId, userId));

    return Number(result[0]?.count || 0);
  }
}

