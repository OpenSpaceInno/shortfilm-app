import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsIn, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { GdprRequestType, GdprRequestStatus } from '../../../database/schema/compliance.schema';

export class GdprAnonymizeUserDto {
  @ApiProperty({ description: 'Legal or policy rationale for account anonymization / erasure' })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiProperty({ description: 'Confirmation flag acknowledging that action is irreversible' })
  @IsBoolean()
  confirmed: boolean;

  @ApiPropertyOptional({ description: 'Whether to bypass the 30-day grace period and execute immediately', default: true })
  @IsOptional()
  @IsBoolean()
  immediate?: boolean = true;
}

export class QueryGdprRequestsDto {
  @ApiPropertyOptional({ enum: ['ERASURE', 'EXPORT', 'RESTRICTION'] })
  @IsOptional()
  @IsIn(['ERASURE', 'EXPORT', 'RESTRICTION'])
  requestType?: GdprRequestType;

  @ApiPropertyOptional({ enum: ['PENDING', 'IN_GRACE_PERIOD', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REJECTED'] })
  @IsOptional()
  @IsIn(['PENDING', 'IN_GRACE_PERIOD', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REJECTED'])
  status?: GdprRequestStatus;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export class GdprRequestResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  requestType: GdprRequestType;

  @ApiProperty()
  status: GdprRequestStatus;

  @ApiPropertyOptional()
  gracePeriodEndsAt?: string | null;

  @ApiPropertyOptional()
  reason?: string | null;

  @ApiPropertyOptional()
  anonymizedEmail?: string | null;

  @ApiPropertyOptional()
  exportUrl?: string | null;

  @ApiPropertyOptional()
  metadata?: Record<string, any> | null;

  @ApiPropertyOptional()
  processedBy?: string | null;

  @ApiPropertyOptional()
  processedAt?: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class GdprExportResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  exportedAt: string;

  @ApiProperty()
  profile: {
    id: string;
    email: string;
    displayName: string;
    phone: string | null;
    avatarUrl: string | null;
    status: string;
    createdAt: string;
    lastLoginAt?: string | null;
  };

  @ApiProperty()
  preferences?: Record<string, any>;

  @ApiProperty()
  creatorProfile?: Record<string, any> | null;

  @ApiProperty()
  subscriptions?: Record<string, any>[];

  @ApiProperty()
  historyStats: {
    totalChoicesMade: number;
    totalWatchHistoryRecords: number;
    totalReviewsWritten: number;
  };
}

export class RetentionEntityStatDto {
  @ApiProperty()
  entity: string;

  @ApiProperty()
  policy: string;

  @ApiProperty()
  retentionWindowDays: number;

  @ApiProperty()
  totalRecords: number;

  @ApiProperty()
  recordsEligibleForPurge: number;
}

export class GdprRetentionStatusDto {
  @ApiProperty({ type: [RetentionEntityStatDto] })
  entities: RetentionEntityStatDto[];

  @ApiProperty()
  evaluatedAt: string;
}
