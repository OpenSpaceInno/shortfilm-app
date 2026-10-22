import { ApiProperty } from '@nestjs/swagger';

export class ExecutiveKpiItemDto {
  @ApiProperty({ example: 'kpi-mrr' })
  id!: string;

  @ApiProperty({ example: 'Monetisation', enum: ['Audience', 'Engagement', 'Monetisation', 'Content'] })
  category!: 'Audience' | 'Engagement' | 'Monetisation' | 'Content';

  @ApiProperty({ example: 'Monthly Recurring Revenue' })
  label!: string;

  @ApiProperty({ example: '₹18,40,000' })
  currentValue!: string;

  @ApiProperty({ example: '₹15,60,000' })
  previousValue!: string;

  @ApiProperty({ example: '+17.9%' })
  changePercentage!: string;

  @ApiProperty({ example: 'up', enum: ['up', 'down', 'neutral'] })
  direction!: 'up' | 'down' | 'neutral';

  @ApiProperty({ example: 'Total active recurring subscription run-rate' })
  description!: string;

  @ApiProperty({ example: true })
  isPositiveChange!: boolean;
}

export class PlatformSnapshotItemDto {
  @ApiProperty({ example: 'snap-1' })
  id!: string;

  @ApiProperty({ example: 'Audience' })
  category!: string;

  @ApiProperty({ example: '24,500' })
  stat!: string;

  @ApiProperty({ example: 'Daily Active Users (DAU)' })
  label!: string;

  @ApiProperty({ example: '+14% MoM' })
  change!: string;

  @ApiProperty({ example: 'Driven by high replayability of interactive branching paths' })
  observation!: string;
}

export class FunnelStepDto {
  @ApiProperty({ example: '1. App Installs / Visitors' })
  label!: string;

  @ApiProperty({ example: 450000 })
  users!: number;

  @ApiProperty({ example: '4,50,000' })
  formattedUsers!: string;

  @ApiProperty({ example: 100 })
  conversionFromPrevious!: number;

  @ApiProperty({ example: 100 })
  conversionFromTop!: number;

  @ApiProperty({ required: false, example: 'Top-of-funnel acquisition' })
  note?: string;
}

export class AttentionItemDto {
  @ApiProperty({ example: 'att-1' })
  id!: string;

  @ApiProperty({ example: 'Review', enum: ['Review', 'Attention', 'Data Quality'] })
  severity!: 'Review' | 'Attention' | 'Data Quality';

  @ApiProperty({ example: 'VIP Student Plan Renewal Wave in 5 Days' })
  title!: string;

  @ApiProperty({ example: '1,420 Student VIP subscriptions reach end of academic quarter' })
  description!: string;

  @ApiProperty({ example: 'Potential ₹1.4L MRR impact if churn rate exceeds 8%' })
  observedImpact!: string;

  @ApiProperty({ example: 'Trigger retention push campaign with 15% annual upgrade offer' })
  suggestedAction!: string;

  @ApiProperty({ example: '/admin/business/subscriptions' })
  actionUrl!: string;

  @ApiProperty({ example: 'Review Subscriptions' })
  actionLabel!: string;

  @ApiProperty({ example: '2026-10-10T12:00:00.000Z' })
  detectedAt!: string;
}
