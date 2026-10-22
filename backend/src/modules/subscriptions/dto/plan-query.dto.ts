import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BillingIntervalEnum, PlanTierEnum, BillingInterval, PlanTier } from '../../../database/schema';

export class PlanQueryDto {
  @ApiPropertyOptional({
    enum: BillingIntervalEnum,
    description: 'Filter plans by billing interval (MONTHLY, ANNUAL, LIFETIME, FREE)',
  })
  @IsOptional()
  @IsEnum(BillingIntervalEnum)
  interval?: BillingInterval;

  @ApiPropertyOptional({
    enum: PlanTierEnum,
    description: 'Filter plans by tier (FREE, VIP, STUDENT, LIFETIME)',
  })
  @IsOptional()
  @IsEnum(PlanTierEnum)
  tier?: PlanTier;

  @ApiPropertyOptional({
    description: 'Include inactive plans (admin queries only)',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeInactive?: boolean = false;
}
