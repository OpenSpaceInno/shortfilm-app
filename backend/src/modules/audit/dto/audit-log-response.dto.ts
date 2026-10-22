import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuditLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ description: 'ID of user who performed the privileged action' })
  actorId: string;

  @ApiProperty({ description: 'Role of actor at execution time' })
  actorRole: string;

  @ApiProperty({ description: 'Standard action identifier' })
  action: string;

  @ApiProperty({ description: 'Target entity classification' })
  entityType: string;

  @ApiPropertyOptional({ description: 'Target entity ID' })
  entityId?: string | null;

  @ApiPropertyOptional({ description: 'State of entity prior to modification' })
  previousState?: any;

  @ApiPropertyOptional({ description: 'State of entity after modification' })
  newState?: any;

  @ApiPropertyOptional({ description: 'Client IP address' })
  ipAddress?: string | null;

  @ApiPropertyOptional({ description: 'Client user-agent' })
  userAgent?: string | null;

  @ApiPropertyOptional({ description: 'Correlation request ID' })
  requestId?: string | null;

  @ApiProperty({ description: 'Creation timestamp in ISO 8601 format' })
  createdAt: string;
}

export class PaginatedAuditLogsResponseDto {
  @ApiProperty({ type: [AuditLogResponseDto] })
  items: AuditLogResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
