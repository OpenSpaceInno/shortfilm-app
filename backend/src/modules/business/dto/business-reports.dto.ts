import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { ReportCadenceEnum, ReportStatusEnum } from '../../../database/schema';

export class GenerateReportDto {
  @ApiProperty({ example: 'MONTHLY_EXECUTIVE', description: 'Report category type' })
  @IsNotEmpty()
  @IsString()
  reportType!: string;

  @ApiProperty({ example: 'September 2026 Platform & Financial Review' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiProperty({ example: 'MONTHLY', enum: ReportCadenceEnum })
  @IsEnum(ReportCadenceEnum)
  cadence!: (typeof ReportCadenceEnum)[number];

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  @IsNotEmpty()
  @IsString()
  periodStart!: string;

  @ApiProperty({ example: '2026-09-30T23:59:59.999Z' })
  @IsNotEmpty()
  @IsString()
  periodEnd!: string;

  @ApiPropertyOptional({ example: 'Executive monthly overview covering MRR run-rate, subscriber growth, and creator payouts.' })
  @IsOptional()
  @IsString()
  summary?: string;
}

export class BusinessReportResponseDto {
  @ApiProperty({ example: '01J8ABC...' })
  id!: string;

  @ApiProperty({ example: 'MONTHLY_EXECUTIVE' })
  reportType!: string;

  @ApiProperty({ example: 'September 2026 Platform & Financial Review' })
  title!: string;

  @ApiProperty({ example: 'MONTHLY', enum: ReportCadenceEnum })
  cadence!: string;

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  periodStart!: string;

  @ApiProperty({ example: '2026-09-30T23:59:59.999Z' })
  periodEnd!: string;

  @ApiProperty({ example: 'GENERATED', enum: ReportStatusEnum })
  status!: string;

  @ApiProperty({ example: 'Executive monthly overview covering MRR run-rate, subscriber growth, and creator payouts.' })
  summary?: string;

  @ApiProperty({ example: '₹28.4L MRR (+18% MoM)' })
  keyStat?: string;

  @ApiProperty({ description: 'Frozen snapshot data (financials, cohorts, KPIs, payouts)' })
  data!: Record<string, any>;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ example: '01J8USER...' })
  generatedBy?: string | null;

  @ApiPropertyOptional()
  approvedBy?: string | null;

  @ApiPropertyOptional()
  approvedAt?: string | null;

  @ApiProperty({ example: '2026-10-01T00:05:00.000Z' })
  createdAt!: string;
}
