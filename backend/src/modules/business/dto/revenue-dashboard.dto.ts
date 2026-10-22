import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionPlanPerformanceDto {
  @ApiProperty({ example: 'plan_vip_monthly' })
  planId!: string;

  @ApiProperty({ example: 'VIP Member' })
  name!: string;

  @ApiProperty({ example: 'VIP' })
  tier!: string;

  @ApiProperty({ example: 'Monthly' })
  cadence!: string;

  @ApiProperty({ example: '₹149/mo' })
  price!: string;

  @ApiProperty({ example: '14,200' })
  subscribers!: string;

  @ApiProperty({ example: 14200 })
  subscribersCount!: number;

  @ApiProperty({ example: '₹21.15L' })
  revenue!: string;

  @ApiProperty({ example: 2115800 })
  revenueNumber!: number;

  @ApiProperty({ example: '91.8%' })
  renewalRate!: string;

  @ApiProperty({ example: '4.2%' })
  churnRate!: string;

  @ApiProperty({ example: 8.4 })
  avgLifetimeMonths!: number;
}

export class RevenueTrendPointDto {
  @ApiProperty({ example: 'May 2026' })
  month!: string;

  @ApiProperty({ example: 12.8, description: 'Subscription revenue in Lakhs' })
  subscriptionRevenue!: number;

  @ApiProperty({ example: 2.1, description: 'Interactive paywall & micro-passes in Lakhs' })
  premiumContentRevenue!: number;

  @ApiProperty({ example: 0.6, description: 'Other platform revenue in Lakhs' })
  otherRevenue!: number;

  @ApiProperty({ example: 15.5, description: 'Total gross revenue in Lakhs' })
  totalGrossRevenue!: number;
}

export class ChurnAnalysisDto {
  @ApiProperty({ example: 4.8, description: 'Gross monthly churn percentage' })
  monthlyRate!: number;

  @ApiProperty({ example: 78.5, description: 'Voluntary churn %' })
  voluntaryPct!: number;

  @ApiProperty({ example: 21.5, description: 'Involuntary churn (payment failure) %' })
  involuntaryPct!: number;

  @ApiProperty({ example: 'Content gap between seasons' })
  primaryReason!: string;
}

export class RevenueDashboardResponseDto {
  @ApiProperty({ example: 2840000, description: 'Monthly Recurring Revenue (INR)' })
  mrr!: number;

  @ApiProperty({ example: 34080000, description: 'Annual Recurring Revenue (INR)' })
  arr!: number;

  @ApiProperty({ example: 172.5, description: 'Average Revenue Per User (INR)' })
  arpu!: number;

  @ApiProperty({ example: 2875.0, description: 'Estimated Lifetime Value (INR)' })
  ltv!: number;

  @ApiProperty({ example: 16480, description: 'Active paid subscribers' })
  activeSubscribers!: number;

  @ApiProperty({ example: 2840000, description: 'Gross monthly billing revenue' })
  grossMonthlyRevenue!: number;

  @ApiProperty({ example: 34080000, description: 'Annual gross revenue run-rate' })
  grossAnnualRunRate!: number;

  @ApiProperty({ example: 852000, description: 'Pending creator payout liability (30% net revenue share)' })
  creatorPayoutLiability!: number;

  @ApiProperty({ example: 1420, description: 'Net subscriber additions in past 30 days' })
  netSubscriberAdditions!: number;

  @ApiProperty({ example: 4.8, description: 'Gross churn rate percentage' })
  grossChurnRate!: number;

  @ApiProperty({ type: [SubscriptionPlanPerformanceDto] })
  plans!: SubscriptionPlanPerformanceDto[];

  @ApiProperty({ type: [RevenueTrendPointDto] })
  revenueTrends!: RevenueTrendPointDto[];

  @ApiProperty({ type: ChurnAnalysisDto })
  churnAnalysis!: ChurnAnalysisDto;

  @ApiProperty({ example: '2026-10-11T12:00:00.000Z' })
  generatedAt!: string;

  @ApiProperty({ example: true })
  isCached!: boolean;
}
