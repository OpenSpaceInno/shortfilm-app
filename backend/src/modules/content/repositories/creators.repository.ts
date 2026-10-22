import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import { creators, Creator, NewCreator } from '../../../database/schema';

@Injectable()
export class CreatorsRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async findById(id: string): Promise<Creator | null> {
    const results = await this.db.select().from(creators).where(eq(creators.id, id)).limit(1);
    return results[0] || null;
  }

  async findByUserId(userId: string): Promise<Creator | null> {
    const results = await this.db.select().from(creators).where(eq(creators.userId, userId)).limit(1);
    return results[0] || null;
  }

  async create(data: NewCreator): Promise<Creator> {
    await this.db.insert(creators).values(data);
    const created = await this.findByUserId(data.userId);
    return created!;
  }

  async ensureCreator(userId: string, displayName: string): Promise<Creator> {
    const existing = await this.findByUserId(userId);
    if (existing) {
      return existing;
    }
    return this.create({
      userId,
      displayName,
      tier: 'EMERGING',
      status: 'ACTIVE',
    });
  }
}
