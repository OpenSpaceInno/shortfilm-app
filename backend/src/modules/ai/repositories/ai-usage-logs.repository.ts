import { Injectable, Inject } from '@nestjs/common';
import { eq, desc, sql } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import {
  aiUsageLogs,
  AiUsageLog,
  NewAiUsageLog,
  AiFeature,
  AiUsageStatus,
} from '../../../database/schema';
import { generateUlid } from '../../../database/utils/ulid.util';

export interface CreateAiUsageLogDto {
  userId: string;
  creatorId?: string | null;
  feature: AiFeature;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd?: string;
  status?: AiUsageStatus;
  latencyMs?: number;
  metadata?: Record<string, any>;
}

@Injectable()
export class AiUsageLogsRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async logUsage(data: CreateAiUsageLogDto): Promise<AiUsageLog> {
    const id = generateUlid();
    const newRecord: NewAiUsageLog = {
      id,
      userId: data.userId,
      creatorId: data.creatorId || null,
      feature: data.feature,
      provider: data.provider,
      model: data.model,
      promptTokens: data.promptTokens,
      completionTokens: data.completionTokens,
      totalTokens: data.totalTokens,
      estimatedCostUsd: data.estimatedCostUsd || '0.000000',
      status: data.status || 'SUCCESS',
      latencyMs: data.latencyMs || 0,
      metadata: data.metadata || null,
    };

    await this.db.insert(aiUsageLogs).values(newRecord);

    const [created] = await this.db
      .select()
      .from(aiUsageLogs)
      .where(eq(aiUsageLogs.id, id))
      .limit(1);

    return created;
  }

  async findByUserId(userId: string, limit = 50, offset = 0): Promise<AiUsageLog[]> {
    return this.db
      .select()
      .from(aiUsageLogs)
      .where(eq(aiUsageLogs.userId, userId))
      .orderBy(desc(aiUsageLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getUserUsageSummary(userId: string): Promise<{
    totalCalls: number;
    totalTokens: number;
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalEstimatedCostUsd: string;
    featureBreakdown: Record<string, { calls: number; tokens: number }>;
  }> {
    const logs = await this.db
      .select()
      .from(aiUsageLogs)
      .where(eq(aiUsageLogs.userId, userId));

    let totalCalls = 0;
    let totalTokens = 0;
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let costAcc = 0;
    const featureBreakdown: Record<string, { calls: number; tokens: number }> = {};

    for (const log of logs) {
      totalCalls += 1;
      totalTokens += log.totalTokens;
      totalPromptTokens += log.promptTokens;
      totalCompletionTokens += log.completionTokens;
      costAcc += parseFloat(log.estimatedCostUsd || '0');

      if (!featureBreakdown[log.feature]) {
        featureBreakdown[log.feature] = { calls: 0, tokens: 0 };
      }
      featureBreakdown[log.feature].calls += 1;
      featureBreakdown[log.feature].tokens += log.totalTokens;
    }

    return {
      totalCalls,
      totalTokens,
      totalPromptTokens,
      totalCompletionTokens,
      totalEstimatedCostUsd: costAcc.toFixed(6),
      featureBreakdown,
    };
  }
}
