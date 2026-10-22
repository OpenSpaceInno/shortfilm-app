import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreatorTier, CreatorStatus } from '../../../database/schema';

export class UpdateCreatorStatusDto {
  @ApiProperty({
    description: 'Target lifecycle status',
    enum: [
      'APPLIED',
      'UNDER_REVIEW',
      'APPROVED',
      'VERIFIED',
      'ACTIVE',
      'SUSPENDED',
      'REJECTED',
      'DEACTIVATED',
    ],
  })
  @IsIn([
    'APPLIED',
    'UNDER_REVIEW',
    'APPROVED',
    'VERIFIED',
    'ACTIVE',
    'SUSPENDED',
    'REJECTED',
    'DEACTIVATED',
  ])
  status: CreatorStatus;

  @ApiPropertyOptional({ description: 'Reason for status change / suspension' })
  @IsOptional()
  @IsString()
  suspensionReason?: string;
}

export class UpdateCreatorTierDto {
  @ApiProperty({
    description: 'Target creator tier level',
    enum: ['EMERGING', 'VERIFIED', 'EXCLUSIVE', 'PARTNER'],
  })
  @IsIn(['EMERGING', 'VERIFIED', 'EXCLUSIVE', 'PARTNER'])
  tier: CreatorTier;
}
