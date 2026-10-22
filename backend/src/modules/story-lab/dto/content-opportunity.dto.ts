import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
  OpportunityStatusEnum,
  type OpportunityStatus,
  OpportunityTypeEnum,
  type OpportunityType,
  OpportunityPriorityEnum,
  type OpportunityPriority,
} from '../../../database/schema/story-lab.schema';

export class UpdateOpportunityStatusDto {
  @IsEnum(OpportunityStatusEnum)
  status: OpportunityStatus;

  @IsOptional()
  @IsString()
  reviewerNotes?: string;
}

export class ContentOpportunityResponseDto {
  id: string;
  storyId?: string | null;
  storyTitle?: string;
  insightId?: string | null;
  title: string;
  opportunityType: OpportunityType;
  status: OpportunityStatus;
  priority: OpportunityPriority;
  priorityScore: number;
  observation: string;
  possibleOpportunity: string;
  evidenceJson?: Record<string, any> | null;
  reviewerNotes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
