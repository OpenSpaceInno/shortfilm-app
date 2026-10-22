import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { SecurityAuditService, SecurityAuditReport } from '../services/security-audit.service';

@ApiTags('Security')
@ApiBearerAuth('JWT-auth')
@Controller('admin/security')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class SecurityController {
  constructor(private readonly securityAuditService: SecurityAuditService) {}

  @Get('audit')
  @ApiOperation({ summary: 'Run comprehensive automated security posture audit' })
  @ApiResponse({ status: 200, description: 'Automated security report generated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires SUPER_ADMIN' })
  public async getAudit(): Promise<SecurityAuditReport> {
    return this.securityAuditService.runAudit();
  }

  @Get('headers')
  @ApiOperation({ summary: 'Inspect active Helmet & CSP security headers configuration' })
  @ApiResponse({ status: 200, description: 'Active security headers metadata' })
  public getHeaders(): Record<string, any> {
    return this.securityAuditService.getHeaderConfiguration();
  }

  @Get('rate-limits')
  @ApiOperation({ summary: 'Inspect active multi-tier rate limiting and probe bypass rules' })
  @ApiResponse({ status: 200, description: 'Active rate limiting configuration' })
  public getRateLimits(): Record<string, any> {
    return this.securityAuditService.getRateLimitConfiguration();
  }
}
