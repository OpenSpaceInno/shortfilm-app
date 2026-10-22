import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import { choices, Choice, NewChoice } from '../../../database/schema';

@Injectable()
export class ChoicesRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async create(data: NewChoice): Promise<Choice> {
    await this.db.insert(choices).values(data);
    const created = await this.findById(data.id!);
    return created!;
  }

  async findById(id: string): Promise<Choice | null> {
    const results = await this.db.select().from(choices).where(eq(choices.id, id)).limit(1);
    return results[0] || null;
  }

  async findByNodeId(nodeId: string): Promise<Choice | null> {
    const results = await this.db
      .select()
      .from(choices)
      .where(eq(choices.storyNodeId, nodeId))
      .limit(1);

    return results[0] || null;
  }

  async update(id: string, data: Partial<NewChoice>): Promise<Choice> {
    await this.db
      .update(choices)
      .set(data)
      .where(eq(choices.id, id));

    const updated = await this.findById(id);
    return updated!;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(choices).where(eq(choices.id, id));
  }
}
