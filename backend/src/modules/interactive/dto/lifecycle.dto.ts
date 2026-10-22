import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RejectVersionDto {
  @ApiPropertyOptional({ description: 'Review feedback or reason for requesting changes' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export interface VersionTransitionResponseDto {
  versionId: string;
  storyId: string;
  versionNumber: number;
  previousStatus: string;
  newStatus: string;
  updatedAt: Date;
  publishedAt?: Date | null;
  archivedAt?: Date | null;
}
