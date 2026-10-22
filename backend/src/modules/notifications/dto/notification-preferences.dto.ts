import { IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationPreferencesDto {
  @ApiProperty({ description: 'In-app notification ledger enabled' })
  inAppEnabled: boolean;

  @ApiProperty({ description: 'Push notification dispatch enabled' })
  pushEnabled: boolean;

  @ApiProperty({ description: 'Email notifications enabled' })
  emailEnabled: boolean;

  @ApiProperty({ description: 'New story/episode publication notifications' })
  episodesEnabled: boolean;

  @ApiProperty({ description: 'Community poll / voting closure notifications' })
  votingEnabled: boolean;

  @ApiProperty({ description: 'Daily streak reminders and risk warnings' })
  streaksEnabled: boolean;

  @ApiProperty({ description: 'Achievement badge & XP milestone rewards' })
  rewardsEnabled: boolean;

  @ApiProperty({ description: 'Promotional and marketing updates' })
  marketingEnabled: boolean;
}

export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional({ description: 'In-app notification ledger enabled' })
  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Push notification dispatch enabled' })
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Email notifications enabled' })
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @ApiPropertyOptional({ description: 'New story/episode publication notifications' })
  @IsOptional()
  @IsBoolean()
  episodesEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Community poll / voting closure notifications' })
  @IsOptional()
  @IsBoolean()
  votingEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Daily streak reminders and risk warnings' })
  @IsOptional()
  @IsBoolean()
  streaksEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Achievement badge & XP milestone rewards' })
  @IsOptional()
  @IsBoolean()
  rewardsEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Promotional and marketing updates' })
  @IsOptional()
  @IsBoolean()
  marketingEnabled?: boolean;
}
