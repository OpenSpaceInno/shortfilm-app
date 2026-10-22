import { ApiProperty } from '@nestjs/swagger';

export interface GamificationHistoryItem {
  id: string;
  action: string;
  points: number;
  referenceId: string | null;
  createdAt: Date;
}

export class GamificationSummaryDto {
  @ApiProperty({ description: 'Total lifetime XP accrued by the user' })
  totalXp: number;

  @ApiProperty({ description: 'Current consecutive daily activity streak count' })
  streakDays: number;

  @ApiProperty({ description: 'List of unlocked badges', isArray: true })
  badges: any[];

  @ApiProperty({ description: 'Recent XP transactions', isArray: true })
  recentHistory: GamificationHistoryItem[];
}
