import { ApiProperty } from '@nestjs/swagger';
import { BadgeDto } from './badge.dto';

export class StreakActivityResponseDto {
  @ApiProperty({ description: 'Updated current daily streak' })
  currentStreak: number;

  @ApiProperty({ description: 'All-time longest streak achieved' })
  longestStreak: number;

  @ApiProperty({ description: 'Date of recorded activity in YYYY-MM-DD UTC' })
  lastActivityDate: string;

  @ApiProperty({ description: 'Whether today activity successfully extended the streak' })
  isStreakExtended: boolean;

  @ApiProperty({ description: 'Streak multiplier XP points awarded' })
  xpAwarded: number;

  @ApiProperty({ description: 'Newly unlocked badges during this activity evaluation', type: [BadgeDto] })
  newBadges: BadgeDto[];
}
