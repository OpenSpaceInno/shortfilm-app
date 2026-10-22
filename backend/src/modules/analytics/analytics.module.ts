import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsRollupController } from './controllers/analytics-rollup.controller';
import { AnalyticsService } from './services/analytics.service';
import { AnalyticsRollupService } from './services/analytics-rollup.service';
import { RedisStreamService } from './services/redis-stream.service';
import { BusinessMetricsRepository } from './repositories/business-metrics.repository';

@Module({
  imports: [ConfigModule],
  controllers: [AnalyticsController, AnalyticsRollupController],
  providers: [
    RedisStreamService,
    AnalyticsService,
    BusinessMetricsRepository,
    AnalyticsRollupService,
  ],
  exports: [
    RedisStreamService,
    AnalyticsService,
    BusinessMetricsRepository,
    AnalyticsRollupService,
  ],
})
export class AnalyticsModule {}
