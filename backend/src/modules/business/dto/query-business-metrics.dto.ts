import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { TimeGranularityEnum } from '../../../database/schema';

export class QueryBusinessMetricsDto {
  @ApiPropertyOptional({ example: 'DAU', description: 'Target metric name (DAU, MAU, MRR, etc.)' })
  @IsOptional()
  @IsString()
  metric?: string;

  @ApiPropertyOptional({ example: 'GLOBAL', description: 'Dimension key' })
  @IsOptional()
  @IsString()
  dimensionKey?: string;

  @ApiPropertyOptional({ example: 'ALL', description: 'Dimension value' })
  @IsOptional()
  @IsString()
  dimensionValue?: string;

  @ApiPropertyOptional({ example: 'DAILY', enum: TimeGranularityEnum })
  @IsOptional()
  @IsString()
  granularity?: (typeof TimeGranularityEnum)[number];

  @ApiPropertyOptional({ example: '30d', description: 'Period shortcut (e.g. 7d, 30d, 90d)' })
  @IsOptional()
  @IsString()
  period?: string;

  @ApiPropertyOptional({ example: '2026-09-01T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-09-30T23:59:59.999Z' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}

export class BusinessMetricItemDto {
  @ApiProperty({ example: '01J8ABC...' })
  id!: string;

  @ApiProperty({ example: 'MRR' })
  metricName!: string;

  @ApiProperty({ example: 'GLOBAL' })
  dimensionKey!: string;

  @ApiProperty({ example: 'ALL' })
  dimensionValue!: string;

  @ApiProperty({ example: 'DAILY' })
  timeGranularity!: string;

  @ApiProperty({ example: '2026-10-01T00:00:00.000Z' })
  periodStart!: string;

  @ApiProperty({ example: '2026-10-01T23:59:59.999Z' })
  periodEnd!: string;

  @ApiProperty({ example: 2840000.0 })
  numericValue!: number;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;
}
