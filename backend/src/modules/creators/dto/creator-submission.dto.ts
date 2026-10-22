import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUrl,
  IsObject,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SubmissionType,
  SubmissionTypeEnum,
  SubmissionStatus,
  SubmissionStatusEnum,
} from '../../../database/schema';

export class SubmissionChecklistDto {
  @ApiPropertyOptional({ description: 'Story episodes and video content complete' })
  @IsOptional()
  @IsBoolean()
  contentComplete?: boolean;

  @ApiPropertyOptional({ description: 'Synopsis, title and meta fields populated' })
  @IsOptional()
  @IsBoolean()
  metadataComplete?: boolean;

  @ApiPropertyOptional({ description: 'Portrait poster and episode thumbnails uploaded' })
  @IsOptional()
  @IsBoolean()
  thumbnailAvailable?: boolean;

  @ApiPropertyOptional({ description: 'Video streams ingested and processed' })
  @IsOptional()
  @IsBoolean()
  videoAvailable?: boolean;

  @ApiPropertyOptional({ description: 'DAG story structure verified with no dead ends' })
  @IsOptional()
  @IsBoolean()
  storyStructureValid?: boolean;

  @ApiPropertyOptional({ description: 'Interactive branching choices verified' })
  @IsOptional()
  @IsBoolean()
  interactivePathsValid?: boolean;

  @ApiPropertyOptional({ description: 'Age rating and maturity advisory configured' })
  @IsOptional()
  @IsBoolean()
  ageRatingSet?: boolean;

  @ApiPropertyOptional({ description: 'Primary and subtitle languages declared' })
  @IsOptional()
  @IsBoolean()
  languageSet?: boolean;

  @ApiPropertyOptional({ description: 'Ownership and copyright compliance attested' })
  @IsOptional()
  @IsBoolean()
  copyrightConfirmed?: boolean;
}

export class SubmissionStoryInfoDto {
  @ApiPropertyOptional({ description: 'Story title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Genre category' })
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiPropertyOptional({ description: 'Synopsis summary' })
  @IsOptional()
  @IsString()
  synopsis?: string;

  @ApiPropertyOptional({ description: 'Planned episode count' })
  @IsOptional()
  @IsInt()
  episodeCount?: number;

  @ApiPropertyOptional({ description: 'Whether narrative incorporates branching decisions' })
  @IsOptional()
  @IsBoolean()
  interactive?: boolean;

  @ApiPropertyOptional({ description: 'Target demographic' })
  @IsOptional()
  @IsString()
  targetAudience?: string;

  @ApiPropertyOptional({ description: 'Age certification (e.g. 13+, 16+, 18+)' })
  @IsOptional()
  @IsString()
  ageRating?: string;

  @ApiPropertyOptional({ description: 'Languages and locales' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];
}

export class CreateSubmissionDto {
  @ApiProperty({ description: 'Pitch / submission title', example: 'The Midnight Train' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    description: 'Summary premise of the submission',
    example: 'Six strangers board the final intercity express to find the next stop does not exist.',
  })
  @IsOptional()
  @IsString()
  synopsis?: string;

  @ApiPropertyOptional({
    enum: SubmissionTypeEnum,
    default: 'FULL_SERIES',
    description: 'Type of submission',
  })
  @IsOptional()
  @IsEnum(SubmissionTypeEnum)
  submissionType?: SubmissionType;

  @ApiPropertyOptional({ description: 'Existing story ULID if linking to existing catalog item' })
  @IsOptional()
  @IsString()
  storyId?: string;

  @ApiPropertyOptional({ description: 'Interactive story version ULID under editorial review' })
  @IsOptional()
  @IsString()
  storyVersionId?: string;

  @ApiPropertyOptional({ description: 'Screenplay / Bible deck URL' })
  @IsOptional()
  @IsString()
  scriptUrl?: string;

  @ApiPropertyOptional({ description: 'Pilot reel or video preview URL' })
  @IsOptional()
  @IsString()
  videoPreviewUrl?: string;

  @ApiPropertyOptional({ description: 'Story narrative metadata and demographic targets' })
  @IsOptional()
  @IsObject()
  storyInfo?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Preview clips, characters and choice point outlines' })
  @IsOptional()
  @IsObject()
  contentPreview?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Self-attestation technical checklist' })
  @IsOptional()
  @IsObject()
  checklist?: Record<string, any>;
}

export class UpdateSubmissionDto {
  @ApiPropertyOptional({ description: 'Pitch / submission title' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: 'Summary premise of the submission' })
  @IsOptional()
  @IsString()
  synopsis?: string;

  @ApiPropertyOptional({ enum: SubmissionTypeEnum, description: 'Type of submission' })
  @IsOptional()
  @IsEnum(SubmissionTypeEnum)
  submissionType?: SubmissionType;

  @ApiPropertyOptional({ description: 'Existing story ULID' })
  @IsOptional()
  @IsString()
  storyId?: string;

  @ApiPropertyOptional({ description: 'Interactive story version ULID' })
  @IsOptional()
  @IsString()
  storyVersionId?: string;

  @ApiPropertyOptional({ description: 'Screenplay / Bible deck URL' })
  @IsOptional()
  @IsString()
  scriptUrl?: string;

  @ApiPropertyOptional({ description: 'Pilot reel or video preview URL' })
  @IsOptional()
  @IsString()
  videoPreviewUrl?: string;

  @ApiPropertyOptional({ description: 'Story narrative metadata and demographic targets' })
  @IsOptional()
  @IsObject()
  storyInfo?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Preview clips, characters and choice point outlines' })
  @IsOptional()
  @IsObject()
  contentPreview?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Self-attestation technical checklist' })
  @IsOptional()
  @IsObject()
  checklist?: Record<string, any>;
}

export class ReviewSubmissionDto {
  @ApiProperty({
    enum: [
      'UNDER_REVIEW',
      'CHANGES_REQUESTED',
      'APPROVED',
      'REJECTED',
      'PUBLISHED',
    ],
    description: 'Review decision status',
    example: 'CHANGES_REQUESTED',
  })
  @IsEnum(SubmissionStatusEnum)
  @IsNotEmpty()
  action: SubmissionStatus;

  @ApiPropertyOptional({
    description: 'Editorial notes and feedback for creator revisions',
    example: 'Please adjust Episode 3 branching options to clarify stakes.',
  })
  @IsOptional()
  @IsString()
  reviewerNotes?: string;

  @ApiPropertyOptional({ description: 'Updated validation checklist post-review' })
  @IsOptional()
  @IsObject()
  checklist?: Record<string, any>;
}

export class SubmissionQueryDto {
  @ApiPropertyOptional({ enum: SubmissionStatusEnum, description: 'Filter by submission status' })
  @IsOptional()
  @IsEnum(SubmissionStatusEnum)
  status?: SubmissionStatus;

  @ApiPropertyOptional({ enum: SubmissionTypeEnum, description: 'Filter by submission type' })
  @IsOptional()
  @IsEnum(SubmissionTypeEnum)
  submissionType?: SubmissionType;

  @ApiPropertyOptional({ description: 'Filter by creator ULID (admin only)' })
  @IsOptional()
  @IsString()
  creatorId?: string;

  @ApiPropertyOptional({ description: 'Search title or synopsis keywords' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 20, description: 'Page size limit' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ default: 0, description: 'Page offset' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

export class CreatorSubmissionResponseDto {
  @ApiProperty({ description: 'Submission ULID' })
  id: string;

  @ApiProperty({ description: 'Creator ULID' })
  creatorId: string;

  @ApiPropertyOptional({ description: 'Creator display name' })
  creatorName?: string;

  @ApiPropertyOptional({ description: 'Associated story ULID' })
  storyId: string | null;

  @ApiPropertyOptional({ description: 'Associated story version ULID' })
  storyVersionId: string | null;

  @ApiProperty({ enum: SubmissionTypeEnum, description: 'Submission type' })
  submissionType: SubmissionType;

  @ApiProperty({ description: 'Submission title' })
  title: string;

  @ApiPropertyOptional({ description: 'Synopsis' })
  synopsis: string | null;

  @ApiPropertyOptional({ description: 'Script deck URL' })
  scriptUrl: string | null;

  @ApiPropertyOptional({ description: 'Video preview URL' })
  videoPreviewUrl: string | null;

  @ApiProperty({ enum: SubmissionStatusEnum, description: 'Current submission status' })
  status: SubmissionStatus;

  @ApiPropertyOptional({ description: 'Story metadata' })
  storyInfo: Record<string, any> | null;

  @ApiPropertyOptional({ description: 'Content preview data' })
  contentPreview: Record<string, any> | null;

  @ApiPropertyOptional({ description: 'Technical readiness checklist' })
  checklist: Record<string, any> | null;

  @ApiPropertyOptional({ description: 'Reviewer user ULID' })
  reviewerId: string | null;

  @ApiPropertyOptional({ description: 'Reviewer name or handle' })
  reviewerName?: string | null;

  @ApiPropertyOptional({ description: 'Editorial notes and feedback' })
  reviewerNotes: string | null;

  @ApiPropertyOptional({ description: 'Timestamp of last editorial review' })
  reviewedAt: Date | null;

  @ApiPropertyOptional({ description: 'Timestamp when submitted for review' })
  submittedAt: Date | null;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: Date;
}

export class PaginatedSubmissionsDto {
  @ApiProperty({ type: [CreatorSubmissionResponseDto] })
  items: CreatorSubmissionResponseDto[];

  @ApiProperty({ description: 'Total matching submissions count' })
  total: number;

  @ApiProperty({ description: 'Whether additional pages are available' })
  hasMore: boolean;
}
