import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsBoolean,
  IsOptional,
  IsInt,
  Min,
  IsDateString,
} from 'class-validator';
import { StoryNodeType, StoryNodeTypeEnum } from '../../../database/schema/interactive.schema';

export class CreateStoryNodeDto {
  @IsString()
  @IsNotEmpty()
  episodeId: string;

  @IsOptional()
  @IsIn(StoryNodeTypeEnum)
  nodeType?: StoryNodeType = 'STANDARD';

  @IsOptional()
  @IsBoolean()
  isRoot?: boolean = false;

  @IsOptional()
  @IsInt()
  @Min(0)
  sequenceOrder?: number = 0;

  @IsOptional()
  @IsDateString()
  votingEndsAt?: string;

  @IsOptional()
  @IsString()
  fallbackOptionId?: string;
}

export class UpdateStoryNodeDto {
  @IsOptional()
  @IsIn(StoryNodeTypeEnum)
  nodeType?: StoryNodeType;

  @IsOptional()
  @IsBoolean()
  isRoot?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sequenceOrder?: number;

  @IsOptional()
  @IsDateString()
  votingEndsAt?: string;

  @IsOptional()
  @IsString()
  fallbackOptionId?: string;
}
