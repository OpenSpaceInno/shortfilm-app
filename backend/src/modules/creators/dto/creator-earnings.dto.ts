import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreatorEarningsStatus, CreatorEarningsStatusEnum } from '../../../database/schema';

export class CreatorEarningsResponseDto {
  @ApiProperty({ example: '01HA0123456789ABCDEF000001' })
  id: string;

  @ApiProperty({ example: '01HA8888888888ABCDEF000001' })
  creatorId: string;

  @ApiPropertyOptional({ example: 'Dev Sharma' })
  creatorName?: string;

  @ApiProperty({ example: '2026-09-01', description: 'YYYY-MM-01 format' })
  periodMonth: string;

  @ApiProperty({ example: '15400.00' })
  grossAmount: string;

  @ApiProperty({ example: '4620.00' })
  platformFee: string;

  @ApiProperty({ example: '1078.00' })
  taxWithheld: string;

  @ApiProperty({ example: '9702.00' })
  netPayout: string;

  @ApiProperty({ example: 'INR' })
  currency: string;

  @ApiProperty({ enum: CreatorEarningsStatusEnum, example: 'PENDING_PAYOUT' })
  status: CreatorEarningsStatus;

  @ApiPropertyOptional({ example: 'Awaiting updated bank details / KYC re-submission' })
  holdReason?: string | null;

  @ApiPropertyOptional({ example: 'payout_tx_rzp_987654321' })
  payoutReference?: string | null;

  @ApiPropertyOptional({
    example: {
      watchTimeSeconds: 450000,
      completionCount: 1200,
      choiceInteractions: 3500,
      formula: '0.7*watch_ratio + 0.3*choices_ratio',
    },
  })
  metadata?: Record<string, any> | null;

  @ApiPropertyOptional({ example: '2026-10-05T10:30:00.000Z' })
  paidAt?: Date | null;

  @ApiProperty({ example: '2026-10-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-01T00:00:00.000Z' })
  updatedAt: Date;
}

export class CreatorEarningsSummaryDto {
  @ApiProperty({ example: '01HA8888888888ABCDEF000001' })
  creatorId: string;

  @ApiProperty({ example: '125000.00' })
  totalGross: string;

  @ApiProperty({ example: '78750.00' })
  totalNet: string;

  @ApiProperty({ example: '65000.00' })
  totalPaid: string;

  @ApiProperty({ example: '13750.00' })
  pendingPayout: string;

  @ApiProperty({ example: '0.00' })
  heldAmount: string;

  @ApiProperty({ example: 'INR' })
  currency: string;

  @ApiPropertyOptional({ example: '2026-09-01' })
  lastSettlementMonth?: string | null;

  @ApiProperty({ example: 4 })
  lifetimePayoutsCount: number;
}

export class PaginatedCreatorEarningsDto {
  @ApiProperty({ type: [CreatorEarningsResponseDto] })
  items: CreatorEarningsResponseDto[];

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

export class CreatorEarningsQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filter by settlement month (YYYY-MM-01 or YYYY-MM)' })
  @IsOptional()
  @IsString()
  periodMonth?: string;

  @ApiPropertyOptional({ enum: CreatorEarningsStatusEnum })
  @IsOptional()
  @IsEnum(CreatorEarningsStatusEnum)
  status?: CreatorEarningsStatus;

  @ApiPropertyOptional({ description: 'Admin filter by specific creator ID' })
  @IsOptional()
  @IsString()
  creatorId?: string;
}

export class RunSettlementDto {
  @ApiProperty({
    description: 'Target settlement period month (e.g. 2026-09-01 or 2026-09)',
    example: '2026-09-01',
  })
  @IsString()
  @IsNotEmpty()
  periodMonth: string;

  @ApiPropertyOptional({
    description: 'Platform fee percentage (default 30 per BR-001)',
    example: 30,
    default: 30,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  platformFeePercent?: number = 30;

  @ApiPropertyOptional({
    description: 'Tax withholding / TDS percentage (default 10 per LC-001)',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(50)
  taxWithholdingPercent?: number = 10;

  @ApiPropertyOptional({
    description: 'Minimum payout threshold (default 1000 INR / 50 USD per BR-002)',
    example: 1000,
    default: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minimumPayoutThreshold?: number = 1000;

  @ApiPropertyOptional({
    description: 'Optional subscription pool amount override in currency units',
    example: 500000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalSubscriptionPoolAmount?: number;

  @ApiPropertyOptional({
    description: 'Dry run calculation mode without persisting ledger records',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean = false;
}

export class UpdateEarningsStatusDto {
  @ApiProperty({
    enum: CreatorEarningsStatusEnum,
    description: 'Target earnings status transition',
    example: 'PENDING_PAYOUT',
  })
  @IsEnum(CreatorEarningsStatusEnum)
  @IsNotEmpty()
  status: CreatorEarningsStatus;

  @ApiPropertyOptional({
    description: 'Required if status is HELD, explaining why payout is detained',
    example: 'Bank account validation failed / Pan verification mismatch',
  })
  @IsOptional()
  @IsString()
  holdReason?: string;

  @ApiPropertyOptional({
    description: 'Disbursement reference / UTR when transitioning to PAID',
    example: 'RZP_PO_01HA999988887777',
  })
  @IsOptional()
  @IsString()
  payoutReference?: string;
}

export class SettlementRunResultDto {
  @ApiProperty({ example: '2026-09-01' })
  periodMonth: string;

  @ApiProperty({ example: 12 })
  creatorsProcessed: number;

  @ApiProperty({ example: '450000.00' })
  totalGrossAmount: string;

  @ApiProperty({ example: '135000.00' })
  totalPlatformFees: string;

  @ApiProperty({ example: '31500.00' })
  totalTaxWithheld: string;

  @ApiProperty({ example: '283500.00' })
  totalNetPayout: string;

  @ApiProperty({
    example: { CALCULATED: 2, PENDING_PAYOUT: 9, HELD: 1, PAID: 0 },
  })
  statusBreakdown: Record<string, number>;

  @ApiProperty({ example: false })
  dryRun: boolean;

  @ApiProperty({ example: '2026-10-01T00:00:00.000Z' })
  executedAt: Date;
}
