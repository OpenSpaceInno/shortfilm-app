import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  BusinessMetricNameEnum,
  TimeGranularityEnum,
  TimeGranularity,
} from '../../../database/schema';

export class QueryMetricsDto {
  @ApiPropertyOptional({
    description: 'Filter by metric name (e.g. DAU, MAU, MRR, WATCH_HOURS)',
    enum: BusinessMetricNameEnum,
  })
  @IsOptional()
  @IsString()
  metricName?: string;

  @ApiPropertyOptional({
    description: 'Filter by dimension key (e.g. GLOBAL, STORY, PLAN)',
    default: 'GLOBAL',
  })
  @IsOptional()
  @IsString()
  dimensionKey?: string;

  @ApiPropertyOptional({
    description: 'Filter by dimension value (e.g. ALL, story_01HT...)',
  })
  @IsOptional()
  @IsString()
  dimensionValue?: string;

  @ApiPropertyOptional({
    description: 'Time granularity (HOURLY, DAILY, WEEKLY, MONTHLY)',
    enum: TimeGranularityEnum,
  })
  @IsOptional()
  @IsIn(TimeGranularityEnum)
  timeGranularity?: TimeGranularity;

  @ApiPropertyOptional({
    description: 'Start date filter in UTC ISO format (e.g. 2026-10-01T00:00:00.000Z)',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date filter in UTC ISO format',
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Maximum number of rollup points to return (1-500)',
    default: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number = 100;
}

export class TriggerRollupDto {
  @ApiPropertyOptional({
    description: 'Rollup granularity to trigger (HOURLY or DAILY)',
    enum: ['HOURLY', 'DAILY'],
    default: 'HOURLY',
  })
  @IsOptional()
  @IsIn(['HOURLY', 'DAILY', 'hourly', 'daily'])
  granularity?: string = 'HOURLY';

  @ApiPropertyOptional({
    description: 'Optional historical UTC date string to backfill or re-aggregate',
    example: '2026-10-10T12:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  targetDate?: string;
}

export class BusinessMetricResponseDto {
  @ApiProperty({ example: '01HTXYZ123456789ABCDEFGHJK' })
  id: string;

  @ApiProperty({ example: 'DAU' })
  metricName: string;

  @ApiProperty({ example: 'GLOBAL' })
  dimensionKey: string;

  @ApiProperty({ example: 'ALL' })
  dimensionValue: string;

  @ApiProperty({ example: 'DAILY' })
  timeGranularity: string;

  @ApiProperty({ example: '2026-10-10T00:00:00.000Z' })
  periodStart: string;

  @ApiProperty({ example: '2026-10-10T23:59:59.999Z' })
  periodEnd: string;

  @ApiProperty({ example: 4520.0 })
  numericValue: number;

  @ApiPropertyOptional({ example: { window: '24h' } })
  metadata?: Record<string, any>;
}
