import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../auth/decorators/public.decorator';
import {
  QueryMetricsDto,
  TriggerRollupDto,
  BusinessMetricResponseDto,
} from '../dto';
import { BusinessMetricsRepository } from '../repositories/business-metrics.repository';
import {
  AnalyticsRollupService,
  RollupExecutionSummary,
} from '../services/analytics-rollup.service';

@ApiTags('Analytics')
@Controller('analytics/rollups')
export class AnalyticsRollupController {
  constructor(
    private readonly rollupService: AnalyticsRollupService,
    private readonly metricsRepo: BusinessMetricsRepository,
  ) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Query pre-aggregated business metrics and rollups',
    description:
      'Reads pre-computed metric time series from business_metrics table without scanning raw transactional rows (<10ms read latency).',
  })
  @ApiResponse({
    status: 200,
    description: 'List of aggregated metric records',
    type: [BusinessMetricResponseDto],
  })
  async queryMetrics(@Query() query: QueryMetricsDto): Promise<BusinessMetricResponseDto[]> {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    const rows = await this.metricsRepo.queryMetrics({
      metricName: query.metricName,
      dimensionKey: query.dimensionKey,
      dimensionValue: query.dimensionValue,
      timeGranularity: query.timeGranularity,
      startDate,
      endDate,
      limit: query.limit,
    });

    return rows.map((r) => ({
      id: r.id,
      metricName: r.metricName,
      dimensionKey: r.dimensionKey,
      dimensionValue: r.dimensionValue,
      timeGranularity: r.timeGranularity,
      periodStart: r.periodStart.toISOString(),
      periodEnd: r.periodEnd.toISOString(),
      numericValue: Number(r.numericValue),
      metadata: (r.metadata as Record<string, any>) || undefined,
    }));
  }

  @Public()
  @Get('latest')
  @ApiOperation({
    summary: 'Get latest calculated platform metric snapshots',
    description:
      'Returns the most recent calculated values for core executive KPIs (DAU, MAU, STICKINESS, WATCH_HOURS, ACTIVE_SUBS, MRR).',
  })
  @ApiResponse({
    status: 200,
    description: 'Latest metrics snapshot dictionary',
  })
  async getLatestSnapshot(): Promise<Record<string, number | null>> {
    const metricNames = [
      'DAU',
      'MAU',
      'STICKINESS',
      'WATCH_HOURS',
      'COMPLETION_RATE',
      'ACTIVE_SUBS',
      'MRR',
      'CHURN_RATE',
      'NET_SUBS',
    ];

    const results: Record<string, number | null> = {};

    await Promise.all(
      metricNames.map(async (name) => {
        const row = await this.metricsRepo.findLatest(name);
        results[name] = row ? Number(row.numericValue) : null;
      }),
    );

    return results;
  }

  @Public()
  @Post('trigger')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Trigger background rollup worker routine on-demand',
    description:
      'Manually initiates either an HOURLY or DAILY aggregation rollup cycle. Recomputes operational metrics and upserts into business_metrics.',
  })
  @ApiResponse({
    status: 200,
    description: 'Rollup execution result summary',
  })
  async triggerRollup(@Body() dto: TriggerRollupDto): Promise<RollupExecutionSummary> {
    const targetDate = dto.targetDate ? new Date(dto.targetDate) : undefined;

    if (dto.granularity?.toUpperCase() === 'DAILY') {
      return this.rollupService.runDailyRollup(targetDate);
    }

    return this.rollupService.runHourlyRollup(targetDate);
  }
}
