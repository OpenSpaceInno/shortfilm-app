import { Injectable, Inject } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import {
  creatorInternalNotes,
  CreatorInternalNote,
  users,
} from '../../../database/schema';
import { generateUlid } from '../../../database/utils/ulid.util';

@Injectable()
export class CreatorNotesRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async create(creatorId: string, authorId: string, note: string): Promise<CreatorInternalNote> {
    const id = generateUlid();

    await this.db.insert(creatorInternalNotes).values({
      id,
      creatorId,
      authorId,
      note,
    });

    const results = await this.db
      .select()
      .from(creatorInternalNotes)
      .where(eq(creatorInternalNotes.id, id))
      .limit(1);

    return results[0]!;
  }

  async findByCreatorId(
    creatorId: string,
  ): Promise<Array<{ note: CreatorInternalNote; authorName: string }>> {
    const rows = await this.db
      .select({
        note: creatorInternalNotes,
        authorName: users.displayName,
      })
      .from(creatorInternalNotes)
      .innerJoin(users, eq(creatorInternalNotes.authorId, users.id))
      .where(eq(creatorInternalNotes.creatorId, creatorId))
      .orderBy(desc(creatorInternalNotes.createdAt));

    return rows;
  }
}
