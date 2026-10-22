import { Injectable, Inject } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import { choiceOptions, ChoiceOption, NewChoiceOption } from '../../../database/schema';

@Injectable()
export class ChoiceOptionsRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async create(data: NewChoiceOption): Promise<ChoiceOption> {
    await this.db.insert(choiceOptions).values(data);
    const created = await this.findById(data.id!);
    return created!;
  }

  async findById(id: string): Promise<ChoiceOption | null> {
    const results = await this.db
      .select()
      .from(choiceOptions)
      .where(eq(choiceOptions.id, id))
      .limit(1);

    return results[0] || null;
  }

  async findByChoiceId(choiceId: string): Promise<ChoiceOption[]> {
    return this.db
      .select()
      .from(choiceOptions)
      .where(eq(choiceOptions.choiceId, choiceId))
      .orderBy(choiceOptions.displayOrder);
  }

  async incrementVoteCount(optionId: string, tx?: any): Promise<void> {
    const client = tx || this.db;
    await client
      .update(choiceOptions)
      .set({ voteCount: sql`${choiceOptions.voteCount} + 1` })
      .where(eq(choiceOptions.id, optionId));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(choiceOptions).where(eq(choiceOptions.id, id));
  }
}
