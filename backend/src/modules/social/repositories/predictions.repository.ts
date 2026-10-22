import { Injectable, Inject } from '@nestjs/common';
import { eq, and, sql, desc } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import {
  predictions,
  Prediction,
  NewPrediction,
  predictionOptions,
  PredictionOption,
  userPredictions,
  UserPrediction,
} from '../../../database/schema';
import { generateUlid } from '../../../database/utils/ulid.util';

@Injectable()
export class PredictionsRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async create(
    data: Omit<NewPrediction, 'id' | 'createdAt'>,
    optionTexts: string[],
    tx?: any,
  ): Promise<{ prediction: Prediction; options: PredictionOption[] }> {
    const client = tx || this.db;
    const predictionId = generateUlid();

    await client.insert(predictions).values({
      id: predictionId,
      ...data,
    });

    const createdOptions: PredictionOption[] = [];
    for (const text of optionTexts) {
      const optId = generateUlid();
      await client.insert(predictionOptions).values({
        id: optId,
        predictionId,
        optionText: text,
      });

      const optResults = await client
        .select()
        .from(predictionOptions)
        .where(eq(predictionOptions.id, optId))
        .limit(1);

      createdOptions.push(optResults[0]!);
    }

    const predResults = await client
      .select()
      .from(predictions)
      .where(eq(predictions.id, predictionId))
      .limit(1);

    return {
      prediction: predResults[0]!,
      options: createdOptions,
    };
  }

  async findById(id: string): Promise<Prediction | null> {
    const results = await this.db
      .select()
      .from(predictions)
      .where(eq(predictions.id, id))
      .limit(1);

    return results[0] || null;
  }

  async findByStoryId(storyId: string): Promise<Prediction[]> {
    return this.db
      .select()
      .from(predictions)
      .where(eq(predictions.storyId, storyId))
      .orderBy(desc(predictions.createdAt));
  }

  async findOptionsByPredictionId(predictionId: string): Promise<PredictionOption[]> {
    return this.db
      .select()
      .from(predictionOptions)
      .where(eq(predictionOptions.predictionId, predictionId));
  }

  async getPredictionOptionsWithCounts(
    predictionId: string,
  ): Promise<Array<PredictionOption & { voteCount: number }>> {
    const rows = await this.db
      .select({
        id: predictionOptions.id,
        predictionId: predictionOptions.predictionId,
        optionText: predictionOptions.optionText,
        createdAt: predictionOptions.createdAt,
        voteCount: sql<number>`count(${userPredictions.id})`,
      })
      .from(predictionOptions)
      .leftJoin(
        userPredictions,
        eq(predictionOptions.id, userPredictions.predictionOptionId),
      )
      .where(eq(predictionOptions.predictionId, predictionId))
      .groupBy(predictionOptions.id);

    return rows.map((r) => ({
      id: r.id,
      predictionId: r.predictionId,
      optionText: r.optionText,
      createdAt: r.createdAt,
      voteCount: Number(r.voteCount || 0),
    }));
  }

  async findUserPrediction(
    userId: string,
    predictionId: string,
    tx?: any,
  ): Promise<UserPrediction | null> {
    const client = tx || this.db;
    const results = await client
      .select()
      .from(userPredictions)
      .where(
        and(
          eq(userPredictions.userId, userId),
          eq(userPredictions.predictionId, predictionId),
        ),
      )
      .limit(1);

    return results[0] || null;
  }

  async createUserPrediction(
    userId: string,
    predictionId: string,
    predictionOptionId: string,
    tx?: any,
  ): Promise<UserPrediction> {
    const client = tx || this.db;
    const id = generateUlid();

    await client.insert(userPredictions).values({
      id,
      userId,
      predictionId,
      predictionOptionId,
      isCorrect: null,
      xpAwarded: 0,
    });

    const results = await client
      .select()
      .from(userPredictions)
      .where(eq(userPredictions.id, id))
      .limit(1);

    return results[0]!;
  }

  async resolve(predictionId: string, winningOptionId: string, tx?: any): Promise<void> {
    const client = tx || this.db;
    await client
      .update(predictions)
      .set({
        status: 'RESOLVED',
        winningOptionId,
      })
      .where(eq(predictions.id, predictionId));
  }

  async getCorrectPredictionsForResolution(
    predictionId: string,
    winningOptionId: string,
    tx?: any,
  ): Promise<UserPrediction[]> {
    const client = tx || this.db;
    return client
      .select()
      .from(userPredictions)
      .where(
        and(
          eq(userPredictions.predictionId, predictionId),
          eq(userPredictions.predictionOptionId, winningOptionId),
        ),
      );
  }

  async markPredictionCorrect(
    userPredictionId: string,
    xpAwarded: number,
    tx?: any,
  ): Promise<void> {
    const client = tx || this.db;
    await client
      .update(userPredictions)
      .set({
        isCorrect: true,
        xpAwarded,
      })
      .where(eq(userPredictions.id, userPredictionId));
  }

  async markPredictionIncorrect(
    predictionId: string,
    winningOptionId: string,
    tx?: any,
  ): Promise<void> {
    const client = tx || this.db;
    await client
      .update(userPredictions)
      .set({
        isCorrect: false,
      })
      .where(
        and(
          eq(userPredictions.predictionId, predictionId),
          sql`${userPredictions.predictionOptionId} != ${winningOptionId}`,
        ),
      );
  }
}
