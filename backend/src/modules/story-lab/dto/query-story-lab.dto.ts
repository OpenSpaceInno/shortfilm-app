import { IsOptional, IsString, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import {
  StorySignalTypeEnum,
  type StorySignalType,
  StorySignalStrengthEnum,
  type StorySignalStrength,
  InsightStatusEnum,
  type InsightStatus,
  OpportunityTypeEnum,
  type OpportunityType,
  OpportunityStatusEnum,
  type OpportunityStatus,
  ExperimentStatusEnum,
  type ExperimentStatus,
} from '../../../database/schema/story-lab.schema';

export class QueryStorySignalsDto {
  @IsOptional()
  @IsString()
  storyId?: string;

  @IsOptional()
  @IsEnum(StorySignalTypeEnum)
  signalType?: StorySignalType;

  @IsOptional()
  @IsEnum(StorySignalStrengthEnum)
  strength?: StorySignalStrength;

  @IsOptional()
  @IsString()
  genre?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number = 0;
}

export class QueryStoryInsightsDto {
  @IsOptional()
  @IsString()
  storyId?: string;

  @IsOptional()
  @IsEnum(InsightStatusEnum)
  status?: InsightStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number = 0;
}

export class QueryContentOpportunitiesDto {
  @IsOptional()
  @IsString()
  storyId?: string;

  @IsOptional()
  @IsEnum(OpportunityTypeEnum)
  opportunityType?: OpportunityType;

  @IsOptional()
  @IsEnum(OpportunityStatusEnum)
  status?: OpportunityStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number = 0;
}

export class QueryStoryExperimentsDto {
  @IsOptional()
  @IsString()
  storyId?: string;

  @IsOptional()
  @IsEnum(ExperimentStatusEnum)
  status?: ExperimentStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number = 0;
}
