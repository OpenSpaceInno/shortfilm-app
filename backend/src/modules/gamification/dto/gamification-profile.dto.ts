import { ApiProperty } from '@nestjs/swagger';
import { BadgeDto } from './badge.dto';

export class BadgesCountSummary {
  @ApiProperty({ description: 'Total available badges in platform' })
  total: number;

  @ApiProperty({ description: 'Count of badges unlocked by user' })
  unlocked: number;
}

export class GamificationProfileDto {
  @ApiProperty({ description: 'Total lifetime XP accrued' })
  totalXp: number;

  @ApiProperty({ description: 'Current consecutive active days' })
  currentStreak: number;

  @ApiProperty({ description: 'Longest consecutive active days' })
  longestStreak: number;

  @ApiProperty({ description: 'Last active date string in YYYY-MM-DD UTC', nullable: true })
  lastActivityDate: string | null;

  @ApiProperty({ description: 'Badge completion statistics' })
  badgesCount: BadgesCountSummary;

  @ApiProperty({ description: 'Full catalog of badges with user unlocked state', type: [BadgeDto] })
  badges: BadgeDto[];

  @ApiProperty({ description: 'Recent XP ledger activity history', isArray: true })
  recentXp: any[];
}
