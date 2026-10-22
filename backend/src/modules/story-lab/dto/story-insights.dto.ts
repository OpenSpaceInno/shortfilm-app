import { IsEnum, IsOptional, IsString } from 'class-validator';
import { InsightStatusEnum, type InsightStatus } from '../../../database/schema/story-lab.schema';

export class UpdateInsightStatusDto {
  @IsEnum(InsightStatusEnum)
  status: InsightStatus;

  @IsOptional()
  @IsString()
  actionPlan?: string;
}

export class GenerateInsightsRequestDto {
  @IsOptional()
  @IsString()
  storyId?: string;

  @IsOptional()
  minConfidence?: number = 0.80;
}

export class StoryInsightResponseDto {
  id: string;
  storyId: string;
  storyTitle?: string;
  signalId?: string | null;
  title: string;
  summary: string;
  narrativeCommentary?: string | null;
  confidenceScore: number;
  status: InsightStatus;
  actionPlan?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
