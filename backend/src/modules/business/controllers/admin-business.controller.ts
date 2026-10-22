import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { BusinessService } from '../services/business.service';
import {
  DashboardFilterDto,
  BusinessOverviewResponseDto,
  RevenueDashboardResponseDto,
  AudienceDashboardResponseDto,
  SubscriberCohortsResponseDto,
  GenerateReportDto,
  BusinessReportResponseDto,
  BusinessSignalResponseDto,
} from '../dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('Admin - Business Intelligence')
@Controller('admin/business')
export class AdminBusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Public()
  @Get('overview')
  @ApiOperation({
    summary: 'Executive Business Overview (Admin)',
    description: 'Returns executive KPI scorecard, snapshots, funnels, and alerts.',
  })
  @ApiResponse({ status: 200, type: BusinessOverviewResponseDto })
  async getOverview(@Query() filters: DashboardFilterDto): Promise<BusinessOverviewResponseDto> {
    return this.businessService.getOverview(filters);
  }

  @Public()
  @Get('revenue')
  @ApiOperation({
    summary: 'Executive Revenue Dashboard (Admin)',
    description: 'Detailed MRR/ARR, churn rates, subscriber plan breakdown, and revenue trajectory.',
  })
  @ApiResponse({ status: 200, type: RevenueDashboardResponseDto })
  async getRevenueDashboard(@Query() filters: DashboardFilterDto): Promise<RevenueDashboardResponseDto> {
    return this.businessService.getRevenueDashboard(filters);
  }

  @Public()
  @Get('cohorts')
  @ApiOperation({
    summary: 'Subscriber Retention Cohorts (Admin)',
    description: 'Monthly acquisition cohorts with MoM retention, retained MRR, and cumulative churn curves.',
  })
  @ApiResponse({ status: 200, type: SubscriberCohortsResponseDto })
  async getSubscriberCohorts(): Promise<SubscriberCohortsResponseDto> {
    return this.businessService.getSubscriberCohorts();
  }

  @Public()
  @Get('audience')
  @ApiOperation({
    summary: 'Executive Audience & Retention (Admin)',
    description: 'DAU/MAU stickiness, D1..D90 retention cohorts, and behavioral user segments.',
  })
  @ApiResponse({ status: 200, type: AudienceDashboardResponseDto })
  async getAudienceDashboard(@Query() filters: DashboardFilterDto): Promise<AudienceDashboardResponseDto> {
    return this.businessService.getAudienceDashboard(filters);
  }

  @Public()
  @Get('signals')
  @ApiOperation({
    summary: 'Executive Business Signals (Admin)',
    description: 'Active anomaly and momentum signals.',
  })
  @ApiResponse({ status: 200, type: [BusinessSignalResponseDto] })
  async getSignals(@Query('status') status?: string): Promise<BusinessSignalResponseDto[]> {
    return this.businessService.getSignals(status);
  }

  @Public()
  @Post('reports/generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate Immutable Report Snapshot (Admin)',
    description: 'Freezes current platform financials into immutable record in business_reports.',
  })
  @ApiResponse({ status: 201, type: BusinessReportResponseDto })
  async generateReport(
    @Body() dto: GenerateReportDto,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<BusinessReportResponseDto> {
    return this.businessService.generateReport(dto, user?.id);
  }

  @Public()
  @Get('reports')
  @ApiOperation({
    summary: 'List Executive Reports (Admin)',
    description: 'Lists generated financial and executive reconciliation reports.',
  })
  @ApiResponse({ status: 200, type: [BusinessReportResponseDto] })
  async getReports(@Query('limit') limit?: number): Promise<BusinessReportResponseDto[]> {
    return this.businessService.getReports(limit ? Number(limit) : 20);
  }

  @Public()
  @Get('reports/:id')
  @ApiOperation({
    summary: 'Get Executive Report Details (Admin)',
    description: 'Retrieves complete immutable data snapshot for a specific report.',
  })
  @ApiParam({ name: 'id', description: 'Report ULID' })
  @ApiResponse({ status: 200, type: BusinessReportResponseDto })
  async getReportById(@Param('id') id: string): Promise<BusinessReportResponseDto> {
    return this.businessService.getReportById(id);
  }

  @Public()
  @Post('cache/invalidate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Purge Executive Dashboard Cache (Admin)',
    description: 'Purges Redis cached dashboard responses.',
  })
  @ApiResponse({ status: 200 })
  async invalidateCache(): Promise<{ clearedKeys: number }> {
    return this.businessService.invalidateCache();
  }
}
