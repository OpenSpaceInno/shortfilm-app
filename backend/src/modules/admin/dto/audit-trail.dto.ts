import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAuditLogsDto {
  @ApiPropertyOptional({ description: 'Filter by actor ULID' })
  @IsOptional()
  @IsString()
  actorId?: string;

  @ApiPropertyOptional({ description: 'Filter by specific action (e.g. USER_SUSPENDED, SETTING_UPDATED)' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ description: 'Filter by entity type (e.g. USER, STORY, SYSTEM_SETTING)' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ description: 'Filter by entity ULID' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({ description: 'ISO start date' })
  @IsOptional()
  @IsString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'ISO end date' })
  @IsOptional()
  @IsString()
  toDate?: string;

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

export class AuditLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  actorId: string;

  @ApiProperty()
  actorRole: string;

  @ApiProperty()
  action: string;

  @ApiProperty()
  entityType: string;

  @ApiPropertyOptional()
  entityId?: string | null;

  @ApiPropertyOptional()
  previousState?: any;

  @ApiPropertyOptional()
  newState?: any;

  @ApiPropertyOptional()
  ipAddress?: string | null;

  @ApiPropertyOptional()
  userAgent?: string | null;

  @ApiPropertyOptional()
  requestId?: string | null;

  @ApiProperty()
  createdAt: string;
}
