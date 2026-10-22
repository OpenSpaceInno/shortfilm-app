import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ContinueWatchingQueryDto {
  @ApiPropertyOptional({ description: 'Number of continue-watching items to fetch', default: 10, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 10;
}

export interface ContinueWatchingEpisodeDetails {
  id: string;
  title: string;
  episodeNumber: number;
  thumbnailUrl: string | null;
  durationSeconds?: number | null;
  seasonId?: string;
  seasonNumber?: number;
  seasonTitle?: string;
  storyId?: string;
  storyTitle?: string;
  storyCoverImageUrl?: string | null;
}

export interface ContinueWatchingItemDto {
  id: string;
  episodeId: string;
  progressSeconds: number;
  completed: boolean;
  updatedAt: Date;
  episode?: ContinueWatchingEpisodeDetails;
}
