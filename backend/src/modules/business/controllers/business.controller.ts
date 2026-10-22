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
import { Public } from '../../auth/decorators/public.decorator';
import { BusinessService } from '../services/business.service';
import {
  DashboardFilterDto,
  BusinessOverviewResponseDto,
  RevenueDashboardResponseDto,
  AudienceDashboardResponseDto,
  SubscriberCohortsResponseDto,
  BusinessSignalResponseDto,
  GenerateReportDto,
  BusinessReportResponseDto,
  QueryBusinessMetricsDto,
  BusinessMetricItemDto,
} from '../dto';

@ApiTags('Business Intelligence')
@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Public()
  @Get('overview')
  @ApiOperation({
    summary: 'Executive Business Overview Dashboard',
    description:
      'Returns core platform KPIs (MRR, ARR, DAU, MAU, Churn), growth snapshots, conversion funnel, and active business signals. Served from sub-50ms Redis cache with 5-minute TTL.',
  })
  @ApiResponse({
    status: 200,
    description: 'Executive overview dashboard payload',
    type: BusinessOverviewResponseDto,
  })
  async getOverview(@Query() filters: DashboardFilterDto): Promise<BusinessOverviewResponseDto> {
    return this.businessService.getOverview(filters);
  }

  @Public()
  @Get('revenue')
  @ApiOperation({
    summary: 'Executive Revenue & Monetisation Dashboard',
    description:
      'Detailed revenue metrics including MRR, ARR, ARPU, LTV, plan performance breakdown, and 6-month gross/net revenue trends.',
  })
  @ApiResponse({
    status: 200,
    description: 'Revenue dashboard payload',
    type: RevenueDashboardResponseDto,
  })
  async getRevenueDashboard(@Query() filters: DashboardFilterDto): Promise<RevenueDashboardResponseDto> {
    return this.businessService.getRevenueDashboard(filters);
  }

  @Public()
  @Get('cohorts')
  @ApiOperation({
    summary: 'Subscriber Acquisition & Retention Cohorts',
    description:
      'Monthly subscriber cohorts with MoM retention curves, retained MRR, Net Revenue Retention (NRR), and cumulative churn rates.',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscriber cohort matrix payload',
    type: SubscriberCohortsResponseDto,
  })
  async getSubscriberCohorts(): Promise<SubscriberCohortsResponseDto> {
    return this.businessService.getSubscriberCohorts();
  }

  @Public()
  @Get('audience')
  @ApiOperation({
    summary: 'Executive Audience & Retention Dashboard',
    description:
      'Audience reach metrics (DAU, MAU, Stickiness), D1/D7/D14/D30/D60/D90 user retention cohorts, and behavioral audience segments.',
  })
  @ApiResponse({
    status: 200,
    description: 'Audience dashboard payload',
    type: AudienceDashboardResponseDto,
  })
  async getAudienceDashboard(@Query() filters: DashboardFilterDto): Promise<AudienceDashboardResponseDto> {
    return this.businessService.getAudienceDashboard(filters);
  }

  @Public()
  @Get('metrics')
  @ApiOperation({
    summary: 'Query Pre-Aggregated Dimensional Metrics',
    description:
      'Flexible time series query matching 21_BUSINESS_INTELLIGENCE.md (e.g. GET /business/metrics?metric=DAU&period=30d&granularity=DAILY). Caches queries in Redis.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of pre-aggregated metric records',
    type: [BusinessMetricItemDto],
  })
  async queryMetrics(@Query() query: QueryBusinessMetricsDto): Promise<BusinessMetricItemDto[]> {
    return this.businessService.queryMetrics(query);
  }

  @Public()
  @Get('signals')
  @ApiOperation({
    summary: 'Active Business Signals & Trajectory Alerts',
    description:
      'Returns real-time anomaly alerts and milestone indicators (e.g. churn deceleration, retention shifts, revenue pace).',
  })
  @ApiResponse({
    status: 200,
    description: 'List of business signals',
    type: [BusinessSignalResponseDto],
  })
  async getSignals(@Query('status') status?: string): Promise<BusinessSignalResponseDto[]> {
    return this.businessService.getSignals(status);
  }

  @Public()
  @Post('reports/generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate Immutable Financial & Executive Snapshot Report',
    description:
      'Creates a frozen immutable executive report (e.g. monthly reconciliation, quarterly review) stored in business_reports table (SR-ARCH-19).',
  })
  @ApiResponse({
    status: 201,
    description: 'Report snapshot successfully generated',
    type: BusinessReportResponseDto,
  })
  async generateReport(@Body() dto: GenerateReportDto): Promise<BusinessReportResponseDto> {
    return this.businessService.generateReport(dto);
  }

  @Public()
  @Get('reports')
  @ApiOperation({
    summary: 'List Immutable Financial & Executive Reports',
    description: 'Lists historical frozen reports generated for Finance and Executive management.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of business reports',
    type: [BusinessReportResponseDto],
  })
  async getReports(@Query('limit') limit?: number): Promise<BusinessReportResponseDto[]> {
    return this.businessService.getReports(limit ? Number(limit) : 20);
  }

  @Public()
  @Get('reports/:id')
  @ApiOperation({
    summary: 'Get Specific Executive Report Snapshot',
    description: 'Retrieves complete frozen JSON data for a specific historical report.',
  })
  @ApiParam({ name: 'id', description: 'Base32 ULID of the report' })
  @ApiResponse({
    status: 200,
    description: 'Business report details',
    type: BusinessReportResponseDto,
  })
  async getReportById(@Param('id') id: string): Promise<BusinessReportResponseDto> {
    return this.businessService.getReportById(id);
  }

  @Public()
  @Post('cache/invalidate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Invalidate Dashboard Redis Cache Namespace',
    description: 'Purges all cached dashboard keys in Redis to force recalculation on next request.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache purge summary',
  })
  async invalidateCache(): Promise<{ clearedKeys: number }> {
    return this.businessService.invalidateCache();
  }
}
