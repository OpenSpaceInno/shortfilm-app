import { ApiProperty } from '@nestjs/swagger';

export class BusinessSignalResponseDto {
  @ApiProperty({ example: '01J8ABC...' })
  id!: string;

  @ApiProperty({ example: 'SUBSCRIPTION', enum: ['AUDIENCE', 'ENGAGEMENT', 'SUBSCRIPTION', 'CONTENT', 'CREATOR', 'REVENUE'] })
  category!: string;

  @ApiProperty({ example: 'CHURN_DECELERATION' })
  signalType!: string;

  @ApiProperty({ example: '30-Day VIP Churn Dropped to 4.2%' })
  title!: string;

  @ApiProperty({ example: 'Strongest retention performance since launch, driven by branching episodes' })
  observation!: string;

  @ApiProperty({ example: { previousChurn: 6.8, currentChurn: 4.2 } })
  supportingData?: Record<string, any>;

  @ApiProperty({ example: 'STRONG', enum: ['EMERGING', 'MODERATE', 'STRONG'] })
  signalStrength!: string;

  @ApiProperty({ example: 'INFO', enum: ['INFO', 'REVIEW', 'ATTENTION', 'CRITICAL'] })
  severity!: string;

  @ApiProperty({ example: 'ACTIVE', enum: ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED'] })
  status!: string;

  @ApiProperty({ example: '2026-10-10T08:30:00.000Z' })
  detectedAt!: string;
}
