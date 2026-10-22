import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class DashboardFilterDto {
  @ApiPropertyOptional({ description: 'Filter period shortcut', example: 'LAST_30_DAYS' })
  @IsOptional()
  @IsString()
  period?: string;

  @ApiPropertyOptional({ description: 'Filter country ISO code', example: 'IN' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Filter language', example: 'Tamil' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'Filter subscription tier', example: 'VIP' })
  @IsOptional()
  @IsString()
  tier?: string;

  @ApiPropertyOptional({ description: 'Filter ISO start date', example: '2026-09-01T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter ISO end date', example: '2026-09-30T23:59:59.999Z' })
  @IsOptional()
  @IsString()
  endDate?: string;
}
