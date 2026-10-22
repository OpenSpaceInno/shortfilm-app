import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from '../services/audit.service';
import { QueryAuditLogsDto, AuditLogResponseDto } from '../dto/audit-trail.dto';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('Admin - Audit Trail')
@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@ApiBearerAuth()
export class AdminAuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Audit trail (paginated) (05_API_SPECIFICATION)' })
  @ApiResponse({ status: 200, type: [AuditLogResponseDto] })
  async getAuditTrail(@Query() query: QueryAuditLogsDto) {
    const result = await this.auditService.getAuditTrail(query);
    return new ApiResponseDto(result.items, {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single audit log entry detail' })
  @ApiResponse({ status: 200, type: AuditLogResponseDto })
  async getAuditLogById(@Param('id') id: string) {
    const log = await this.auditService.getAuditLogById(id);
    return new ApiResponseDto(log);
  }
}
