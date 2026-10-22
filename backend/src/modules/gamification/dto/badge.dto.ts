import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BadgeDto {
  @ApiProperty({ description: 'ULID of the badge' })
  id: string;

  @ApiProperty({ description: 'Unique slug identifier for the badge' })
  slug: string;

  @ApiProperty({ description: 'Display title of the badge' })
  name: string;

  @ApiProperty({ description: 'Achievement requirement description' })
  description: string;

  @ApiPropertyOptional({ description: 'Icon asset URL' })
  iconUrl?: string | null;

  @ApiProperty({ description: 'Category: WATCH, STREAK, XP, CHOICE' })
  category: string;

  @ApiProperty({ description: 'Type of criteria required for unlocking' })
  criteriaType: string;

  @ApiProperty({ description: 'Numeric threshold value required' })
  criteriaValue: number;

  @ApiProperty({ description: 'Bonus XP awarded upon unlocking' })
  xpReward: number;

  @ApiPropertyOptional({ description: 'Whether the current authenticated user has unlocked this badge' })
  isUnlocked?: boolean;

  @ApiPropertyOptional({ description: 'Date timestamp when user unlocked the badge' })
  unlockedAt?: Date | null;

  @ApiPropertyOptional({ description: 'Date timestamp when badge was created' })
  createdAt?: Date;
}

