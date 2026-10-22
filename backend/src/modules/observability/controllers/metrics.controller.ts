import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { MetricsService } from '../services/metrics.service';

@ApiTags('Observability')
@Controller()
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Prometheus metrics scrape endpoint' })
  @ApiResponse({ status: 200, description: 'Prometheus metrics exposition format' })
  async getMetricsRoot(@Res() res: Response): Promise<void> {
    res.setHeader('Content-Type', this.metricsService.getContentType());
    const metrics = await this.metricsService.getMetrics();
    res.status(200).send(metrics);
  }

  @Get('metrics/summary')
  @ApiOperation({ summary: 'Summary overview of operational health and metrics' })
  @ApiResponse({ status: 200, description: 'JSON summary of vital signals' })
  async getMetricsSummary(): Promise<{
    uptimeSeconds: number;
    dbConnections: number;
    redisClients: number;
    metricRegistrySize: number;
  }> {
    return this.metricsService.getMetricsSummary();
  }
}
