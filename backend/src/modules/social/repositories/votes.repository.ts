import { Injectable, Inject } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import { votes, Vote } from '../../../database/schema';
import { generateUlid } from '../../../database/utils/ulid.util';

@Injectable()
export class VotesRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async create(
    userId: string,
    choiceId: string,
    choiceOptionId: string,
    tx?: any,
  ): Promise<Vote> {
    const client = tx || this.db;
    const id = generateUlid();

    await client.insert(votes).values({
      id,
      userId,
      choiceId,
      choiceOptionId,
    });

    const results = await client
      .select()
      .from(votes)
      .where(eq(votes.id, id))
      .limit(1);

    return results[0]!;
  }

  async findByUserAndChoice(
    userId: string,
    choiceId: string,
    tx?: any,
  ): Promise<Vote | null> {
    const client = tx || this.db;
    const results = await client
      .select()
      .from(votes)
      .where(and(eq(votes.userId, userId), eq(votes.choiceId, choiceId)))
      .limit(1);

    return results[0] || null;
  }

  async getVoteCountsByChoice(
    choiceId: string,
  ): Promise<Array<{ optionId: string; voteCount: number }>> {
    const rows = await this.db
      .select({
        optionId: votes.choiceOptionId,
        voteCount: sql<number>`count(*)`,
      })
      .from(votes)
      .where(eq(votes.choiceId, choiceId))
      .groupBy(votes.choiceOptionId);

    return rows.map((r) => ({
      optionId: r.optionId,
      voteCount: Number(r.voteCount || 0),
    }));
  }

  async countTotalVotesForChoice(choiceId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(votes)
      .where(eq(votes.choiceId, choiceId));

    return Number(result[0]?.count || 0);
  }
}
