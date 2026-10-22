import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LeaderboardItemDto {
  @ApiProperty({ description: 'Position rank on the leaderboard (1-indexed)' })
  rank: number;

  @ApiProperty({ description: 'User ID ULID' })
  userId: string;

  @ApiPropertyOptional({ description: 'User display name' })
  displayName?: string;

  @ApiPropertyOptional({ description: 'User avatar URL' })
  avatarUrl?: string | null;

  @ApiProperty({ description: 'Total lifetime XP points' })
  totalXp: number;

  @ApiPropertyOptional({ description: 'Current streak days' })
  currentStreak?: number;
}
