import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BillingIntervalEnum,
  PlanTierEnum,
  BillingInterval,
  PlanTier,
  FeatureEntitlementMatrix,
} from '../../../database/schema';

export class FeatureEntitlementMatrixInputDto implements FeatureEntitlementMatrix {
  @ApiProperty({ default: true })
  @IsBoolean()
  unlimitedEpisodes: boolean;

  @ApiProperty({ default: true })
  @IsBoolean()
  adFree: boolean;

  @ApiProperty({ enum: ['720p', '1080p', '4K'], default: '1080p' })
  @IsString()
  maxResolution: '720p' | '1080p' | '4K';

  @ApiProperty({ default: 48 })
  @IsNumber()
  @Min(0)
  earlyAccessHours: number;

  @ApiProperty({ default: true })
  @IsBoolean()
  exclusiveChoices: boolean;

  @ApiProperty({ default: 2.0 })
  @IsNumber()
  @Min(1.0)
  predictionXpMultiplier: number;

  @ApiProperty({ default: 2 })
  @IsNumber()
  @Min(1)
  maxConcurrentDevices: number;

  @ApiProperty({ default: true })
  @IsBoolean()
  offlineDownloads: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  bonusFeatures?: string[];
}

export class CreateSubscriptionPlanDto {
  @ApiProperty({ example: 'VIP Monthly', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'vip-monthly', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  slug: string;

  @ApiProperty({ enum: PlanTierEnum, default: 'VIP' })
  @IsEnum(PlanTierEnum)
  tier: PlanTier;

  @ApiPropertyOptional({ example: 'Unlimited all-access streaming' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 149.0, minimum: 0 })
  @IsNumber()
  @Min(0)
  priceMonthly: number;

  @ApiPropertyOptional({ example: 999.0, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceAnnually?: number;

  @ApiProperty({ example: 'INR', default: 'INR' })
  @IsString()
  @MaxLength(3)
  currency: string = 'INR';

  @ApiProperty({ enum: BillingIntervalEnum, default: 'MONTHLY' })
  @IsEnum(BillingIntervalEnum)
  billingInterval: BillingInterval;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  trialDays?: number = 0;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ type: FeatureEntitlementMatrixInputDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FeatureEntitlementMatrixInputDto)
  entitlementMatrix?: FeatureEntitlementMatrixInputDto;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPopular?: boolean = false;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number = 0;
}
