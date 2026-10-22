import { Injectable, Inject } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import {
  aiJobs,
  AiJob,
  NewAiJob,
  AiJobStatus,
} from '../../../database/schema';
import { generateUlid } from '../../../database/utils/ulid.util';

export interface CreateAiJobDto {
  userId: string;
  jobType?: string;
  inputPayload: Record<string, any>;
}

export interface UpdateAiJobDto {
  status?: AiJobStatus;
  progressPercent?: number;
  resultData?: Record<string, any> | null;
  errorMessage?: string | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
}

@Injectable()
export class AiJobsRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async create(data: CreateAiJobDto): Promise<AiJob> {
    const id = generateUlid();
    const newJob: NewAiJob = {
      id,
      userId: data.userId,
      jobType: data.jobType || 'PRODUCTION_PACK',
      status: 'QUEUED',
      inputPayload: data.inputPayload,
      progressPercent: 0,
      startedAt: null,
      completedAt: null,
    };

    await this.db.insert(aiJobs).values(newJob);

    const [created] = await this.db
      .select()
      .from(aiJobs)
      .where(eq(aiJobs.id, id))
      .limit(1);

    return created;
  }

  async findById(id: string): Promise<AiJob | null> {
    const [job] = await this.db
      .select()
      .from(aiJobs)
      .where(eq(aiJobs.id, id))
      .limit(1);

    return job || null;
  }

  async findByUserId(userId: string, limit = 20, offset = 0): Promise<AiJob[]> {
    return this.db
      .select()
      .from(aiJobs)
      .where(eq(aiJobs.userId, userId))
      .orderBy(desc(aiJobs.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async updateJob(id: string, data: UpdateAiJobDto): Promise<AiJob | null> {
    const updates: Partial<NewAiJob> = {
      updatedAt: new Date(),
    };

    if (data.status !== undefined) updates.status = data.status;
    if (data.progressPercent !== undefined) updates.progressPercent = data.progressPercent;
    if (data.resultData !== undefined) updates.resultData = data.resultData;
    if (data.errorMessage !== undefined) updates.errorMessage = data.errorMessage;
    if (data.startedAt !== undefined) updates.startedAt = data.startedAt;
    if (data.completedAt !== undefined) updates.completedAt = data.completedAt;

    await this.db
      .update(aiJobs)
      .set(updates)
      .where(eq(aiJobs.id, id));

    return this.findById(id);
  }
}
