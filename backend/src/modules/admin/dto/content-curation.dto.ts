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
  CurationCollectionType,
  curationCollectionTypeEnum,
} from '../../../database/schema/admin.schema';
import { StoryStatus, StoryStatusEnum } from '../../../database/schema/content.schema';

export class QueryAdminStoriesDto {
  @ApiPropertyOptional({ description: 'Full-text search query across title, description, logline' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: StoryStatusEnum, description: 'Filter by story publishing status' })
  @IsOptional()
  @IsEnum(StoryStatusEnum)
  status?: StoryStatus;

  @ApiPropertyOptional({ description: 'Filter by genre ID' })
  @IsOptional()
  @IsString()
  genreId?: string;

  @ApiPropertyOptional({ description: 'Filter by creator ID' })
  @IsOptional()
  @IsString()
  creatorId?: string;

  @ApiPropertyOptional({ description: 'Filter only featured stories' })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

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

  @ApiPropertyOptional({ enum: ['newest', 'oldest', 'views', 'rating'], default: 'newest' })
  @IsOptional()
  @IsString()
  sort?: string = 'newest';
}

export class CurateStoryDto {
  @ApiPropertyOptional({ description: 'Whether story is pinned/featured on home feeds' })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    enum: curationCollectionTypeEnum,
    description: 'Target editorial curated collection',
  })
  @IsOptional()
  @IsEnum(curationCollectionTypeEnum)
  collectionType?: CurationCollectionType;

  @ApiPropertyOptional({ description: 'Ordering position within carousel/collection' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Editorial badge (e.g. MUST WATCH, NEW, TRENDING #1)' })
  @IsOptional()
  @IsString()
  badge?: string;

  @ApiPropertyOptional({ description: 'Custom promotional headline for hero banner' })
  @IsOptional()
  @IsString()
  customHeadline?: string;
}

export class AdminArchiveStoryDto {
  @ApiProperty({ description: 'Mandatory reason for archiving story from catalog' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class AdminUnpublishStoryDto {
  @ApiProperty({ description: 'Mandatory reason for emergency delisting / unpublishing' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class AdminOverrideMetadataDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Content compliance age rating (e.g. U, U/A 7+, 13+, 16+, 18+)' })
  @IsOptional()
  @IsString()
  ageRating?: string;

  @ApiPropertyOptional({ description: 'Language code or label' })
  @IsOptional()
  @IsString()
  defaultLanguage?: string;

  @ApiPropertyOptional({ type: [String], description: 'Genre IDs associated with the story' })
  @IsOptional()
  @IsArray()
  genreIds?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Tag keywords associated with the story' })
  @IsOptional()
  @IsArray()
  tags?: string[];
}

export class CreateCurationDto {
  @ApiProperty({ description: 'Story ULID' })
  @IsString()
  @IsNotEmpty()
  storyId: string;

  @ApiProperty({ enum: curationCollectionTypeEnum })
  @IsEnum(curationCollectionTypeEnum)
  collectionType: CurationCollectionType;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  displayOrder?: number = 0;

  @ApiPropertyOptional({ description: 'Editorial badge' })
  @IsOptional()
  @IsString()
  badge?: string;

  @ApiPropertyOptional({ description: 'Promotional headline' })
  @IsOptional()
  @IsString()
  customHeadline?: string;

  @ApiPropertyOptional({ description: 'ISO start date' })
  @IsOptional()
  @IsString()
  startsAt?: string;

  @ApiPropertyOptional({ description: 'ISO end date' })
  @IsOptional()
  @IsString()
  endsAt?: string;
}

export class UpdateCurationDto {
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  displayOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  badge?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customHeadline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endsAt?: string;
}

export class FeaturedCurationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  storyId: string;

  @ApiPropertyOptional()
  storyTitle?: string;

  @ApiPropertyOptional()
  storyThumbnailUrl?: string | null;

  @ApiProperty({ enum: curationCollectionTypeEnum })
  collectionType: CurationCollectionType;

  @ApiProperty()
  displayOrder: number;

  @ApiPropertyOptional()
  badge?: string | null;

  @ApiPropertyOptional()
  customHeadline?: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  startsAt?: string | null;

  @ApiPropertyOptional()
  endsAt?: string | null;

  @ApiProperty()
  curatedBy: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class AdminStoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiPropertyOptional()
  thumbnailUrl?: string | null;

  @ApiProperty()
  status: string;

  @ApiProperty()
  creatorId: string;

  @ApiPropertyOptional()
  creatorName?: string;

  @ApiProperty()
  viewCount: number;

  @ApiProperty()
  ratingAverage: number;

  @ApiProperty()
  ratingCount: number;

  @ApiProperty()
  isInteractive: boolean;

  @ApiProperty()
  isFeatured: boolean;

  @ApiProperty()
  totalSeasons: number;

  @ApiProperty()
  totalEpisodes: number;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
