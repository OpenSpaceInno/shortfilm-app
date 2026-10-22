import { IsString, IsNotEmpty, IsInt, Min, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SyncProgressDto {
  @ApiProperty({ description: 'ULID of the episode being watched' })
  @IsString()
  @IsNotEmpty()
  episodeId: string;

  @ApiProperty({ description: 'Current playback position in seconds' })
  @IsInt()
  @Min(0)
  progressSeconds: number;

  @ApiProperty({ description: 'Whether the episode playback was completed' })
  @IsBoolean()
  completed: boolean;

  @ApiPropertyOptional({ description: 'Optional ULID of the story version being traversed' })
  @IsOptional()
  @IsString()
  storyVersionId?: string;
}

export interface WatchProgressDto {
  id: string;
  userId: string;
  episodeId: string;
  progressSeconds: number;
  completed: boolean;
  updatedAt: Date;
}

export interface SyncProgressResponseDto {
  watchProgress: WatchProgressDto;
  xpAwarded: number;
}
