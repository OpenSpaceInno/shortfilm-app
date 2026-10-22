import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class WatchHistoryQueryDto {
  @ApiPropertyOptional({ description: 'Page number (1-indexed)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ description: 'Page size limit', default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}

export interface WatchHistoryEpisodeSummary {
  id: string;
  title: string;
  episodeNumber: number;
  thumbnailUrl: string | null;
  durationSeconds?: number | null;
  storyTitle?: string;
}

export interface WatchHistoryItemDto {
  id: string;
  userId: string;
  episodeId: string;
  storyVersionId: string | null;
  watchedAt: Date;
  episode?: WatchHistoryEpisodeSummary;
}

export interface WatchHistoryResponseDto {
  items: WatchHistoryItemDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
