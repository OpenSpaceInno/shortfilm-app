import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProduces } from '@nestjs/swagger';
import { Response } from 'express';
import { AuditService } from '../services/audit.service';
import { QueryAuditLogsDto } from '../dto/query-audit-logs.dto';
import { AuditLogResponseDto, PaginatedAuditLogsResponseDto } from '../dto/audit-log-response.dto';
import { AuditExportDto } from '../dto/audit-export.dto';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('Admin - Audit Trail (M29)')
@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Audit trail (paginated) with advanced search and filters' })
  @ApiResponse({ status: 200, type: PaginatedAuditLogsResponseDto })
  async getAuditTrail(@Query() query: QueryAuditLogsDto) {
    const result = await this.auditService.getAuditTrail(query);
    return new ApiResponseDto(result.items, {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  }

  @Get('export')
  @ApiOperation({ summary: 'Export audit logs in CSV or JSON format for compliance auditors' })
  @ApiProduces('text/csv', 'application/json')
  async exportAuditTrail(@Query() filter: AuditExportDto, @Res() res: Response) {
    const { data, contentType, filename } = await this.auditService.exportAuditTrail(filter);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(data);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single audit log entry detail' })
  @ApiResponse({ status: 200, type: AuditLogResponseDto })
  async getAuditLogById(@Param('id') id: string) {
    const log = await this.auditService.getAuditLogById(id);
    return new ApiResponseDto(log);
  }
}
