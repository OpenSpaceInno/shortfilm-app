import { ApiProperty } from '@nestjs/swagger';

export class CohortRetentionPointDto {
  @ApiProperty({ example: 0, description: 'Month index relative to signup (M0 = signup month)' })
  monthIndex!: number;

  @ApiProperty({ example: 'Month 0' })
  monthLabel!: string;

  @ApiProperty({ example: 1250, description: 'Subscribers remaining active at monthIndex' })
  activeSubscribers!: number;

  @ApiProperty({ example: 100.0, description: 'Percentage of initial cohort retained' })
  retentionRate!: number;

  @ApiProperty({ example: 186250, description: 'Retained MRR in INR from cohort' })
  retainedMrr!: number;

  @ApiProperty({ example: 100.0, description: 'Net Revenue Retention % (expansion / contraction)' })
  netRevenueRetentionRate!: number;
}

export class SubscriberCohortDto {
  @ApiProperty({ example: '2026-05', description: 'Cohort acquisition month (YYYY-MM)' })
  cohortMonth!: string;

  @ApiProperty({ example: 1250, description: 'Initial acquired subscriber count' })
  initialSubscribers!: number;

  @ApiProperty({ example: 186250, description: 'Initial MRR acquired in INR' })
  initialMrr!: number;

  @ApiProperty({ type: [CohortRetentionPointDto] })
  retentionByMonth!: CohortRetentionPointDto[];

  @ApiProperty({ example: 14.8, description: 'Cumulative churn percentage to date' })
  cumulativeChurnRate!: number;

  @ApiProperty({ example: { VIP: 80, STUDENT: 20 }, description: 'Tier breakdown within cohort' })
  tierDistribution!: Record<string, number>;
}

export class SubscriberCohortsResponseDto {
  @ApiProperty({ type: [SubscriberCohortDto] })
  cohorts!: SubscriberCohortDto[];

  @ApiProperty({
    example: [100, 88.5, 82.1, 78.4, 75.9, 73.2],
    description: 'Blended average MoM retention curve across all cohorts',
  })
  overallMoMRetention!: number[];

  @ApiProperty({ example: 9.2, description: 'Average subscriber lifetime in months' })
  averageSubscriberLifetimeMonths!: number;

  @ApiProperty({ example: '2026-10-11T12:00:00.000Z' })
  generatedAt!: string;

  @ApiProperty({ example: true })
  isCached!: boolean;
}
