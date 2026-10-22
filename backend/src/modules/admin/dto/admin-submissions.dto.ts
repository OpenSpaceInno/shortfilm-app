import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  SubmissionStatus,
  SubmissionStatusEnum,
  SubmissionType,
  SubmissionTypeEnum,
} from '../../../database/schema/creator.schema';

export class AdminSubmissionQueryDto {
  @ApiPropertyOptional({ enum: SubmissionStatusEnum })
  @IsOptional()
  @IsEnum(SubmissionStatusEnum)
  status?: SubmissionStatus;

  @ApiPropertyOptional({ enum: SubmissionTypeEnum })
  @IsOptional()
  @IsEnum(SubmissionTypeEnum)
  submissionType?: SubmissionType;

  @ApiPropertyOptional({ description: 'Filter by creator ID' })
  @IsOptional()
  @IsString()
  creatorId?: string;

  @ApiPropertyOptional({ description: 'Search title or notes' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class AdminApproveSubmissionDto {
  @ApiPropertyOptional({ description: 'Editorial praise / notes for creator' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Automatically publish the approved story version', default: false })
  @IsOptional()
  @IsBoolean()
  publishImmediately?: boolean = false;
}

export class AdminRejectSubmissionDto {
  @ApiProperty({ description: 'Mandatory rationale for rejection' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ description: 'Guidance or feedback notes' })
  @IsOptional()
  @IsString()
  feedback?: string;
}

export class AdminRequestChangesDto {
  @ApiProperty({ description: 'Editorial feedback explanation' })
  @IsString()
  @IsNotEmpty()
  feedback: string;

  @ApiPropertyOptional({ type: [String], description: 'List of specific required checklist changes' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredModifications?: string[];
}
