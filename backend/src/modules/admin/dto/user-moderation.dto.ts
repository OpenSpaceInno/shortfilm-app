import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ModerationReportTargetType,
  reportTargetTypeEnum,
  ModerationReportReason,
  reportReasonEnum,
  ModerationReportStatus,
  reportStatusEnum,
  ResolutionAction,
  resolutionActionEnum,
} from '../../../database/schema/admin.schema';

export class QueryAdminUsersDto {
  @ApiPropertyOptional({ description: 'Search term across email, displayName, externalSubjectId' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'SUSPENDED', 'DELETED'], description: 'Filter by account status' })
  @IsOptional()
  @IsEnum(['ACTIVE', 'SUSPENDED', 'DELETED'])
  status?: 'ACTIVE' | 'SUSPENDED' | 'DELETED';

  @ApiPropertyOptional({ description: 'Filter by assigned role name (e.g. USER, CREATOR, SUPER_ADMIN)' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: ['newest', 'oldest', 'name', 'last_login'], default: 'newest' })
  @IsOptional()
  @IsString()
  sort?: string = 'newest';
}

export class UpdateUserStatusDto {
  @ApiProperty({ enum: ['ACTIVE', 'SUSPENDED', 'DELETED'] })
  @IsEnum(['ACTIVE', 'SUSPENDED', 'DELETED'])
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';

  @ApiProperty({ description: 'Mandatory reason for changing user moderation status' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class UpdateUserRolesDto {
  @ApiProperty({ type: [String], description: 'List of role names to assign to user' })
  @IsArray()
  @IsString({ each: true })
  roles: string[];

  @ApiPropertyOptional({ description: 'Audit reason for granting or revoking roles' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateModerationReportDto {
  @ApiProperty({ enum: reportTargetTypeEnum })
  @IsEnum(reportTargetTypeEnum)
  targetType: ModerationReportTargetType;

  @ApiProperty({ description: 'ULID of reported entity (Story, User, Episode, etc.)' })
  @IsString()
  @IsNotEmpty()
  targetId: string;

  @ApiProperty({ enum: reportReasonEnum })
  @IsEnum(reportReasonEnum)
  reason: ModerationReportReason;

  @ApiPropertyOptional({ description: 'Context and specific details of the violation' })
  @IsOptional()
  @IsString()
  details?: string;
}

export class QueryModerationReportsDto {
  @ApiPropertyOptional({ enum: reportTargetTypeEnum })
  @IsOptional()
  @IsEnum(reportTargetTypeEnum)
  targetType?: ModerationReportTargetType;

  @ApiPropertyOptional({ enum: reportStatusEnum })
  @IsOptional()
  @IsEnum(reportStatusEnum)
  status?: ModerationReportStatus;

  @ApiPropertyOptional({ enum: reportReasonEnum })
  @IsOptional()
  @IsEnum(reportReasonEnum)
  reason?: ModerationReportReason;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class ResolveModerationReportDto {
  @ApiProperty({ enum: resolutionActionEnum })
  @IsEnum(resolutionActionEnum)
  resolutionAction: ResolutionAction;

  @ApiProperty({ description: 'Editorial rationale and action notes' })
  @IsString()
  @IsNotEmpty()
  resolutionNotes: string;
}

export class ModerationReportResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  reporterUserId?: string | null;

  @ApiProperty({ enum: reportTargetTypeEnum })
  targetType: ModerationReportTargetType;

  @ApiProperty()
  targetId: string;

  @ApiProperty({ enum: reportReasonEnum })
  reason: ModerationReportReason;

  @ApiPropertyOptional()
  details?: string | null;

  @ApiProperty({ enum: reportStatusEnum })
  status: ModerationReportStatus;

  @ApiPropertyOptional({ enum: resolutionActionEnum })
  resolutionAction?: ResolutionAction | null;

  @ApiPropertyOptional()
  resolutionNotes?: string | null;

  @ApiPropertyOptional()
  resolvedBy?: string | null;

  @ApiPropertyOptional()
  resolvedAt?: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class AdminUserListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  displayName: string;

  @ApiPropertyOptional()
  avatarUrl?: string | null;

  @ApiProperty()
  status: string;

  @ApiProperty({ type: [String] })
  roles: string[];

  @ApiPropertyOptional()
  lastLoginAt?: string | null;

  @ApiProperty()
  createdAt: string;
}

export class AdminUserDetailDto extends AdminUserListItemDto {
  @ApiProperty({ type: [String] })
  permissions: string[];

  @ApiPropertyOptional()
  creatorProfile?: {
    id: string;
    stageName: string;
    tier: string;
    status: string;
    isKycVerified: boolean;
  } | null;

  @ApiPropertyOptional()
  reportsAgainstCount: number;

  @ApiPropertyOptional()
  recentAuditLogs?: Array<{
    id: string;
    action: string;
    actorRole: string;
    createdAt: string;
  }>;
}
