import { ApiProperty } from '@nestjs/swagger';

export class AudienceGrowthPointDto {
  @ApiProperty({ example: '2026-10-01' })
  date!: string;

  @ApiProperty({ example: 420000 })
  registeredUsers!: number;

  @ApiProperty({ example: 4200 })
  newUsers!: number;

  @ApiProperty({ example: 21500 })
  returningUsers!: number;

  @ApiProperty({ example: 25700 })
  dau!: number;

  @ApiProperty({ example: 148000 })
  mau!: number;
}

export class RetentionCohortDto {
  @ApiProperty({ example: 'Oct 01 - Oct 07' })
  cohort!: string;

  @ApiProperty({ example: '12,400' })
  users!: string;

  @ApiProperty({ example: 58.4 })
  d1!: number;

  @ApiProperty({ example: 42.1 })
  d7!: number;

  @ApiProperty({ example: 34.8 })
  d14!: number;

  @ApiProperty({ example: 26.5 })
  d30!: number;

  @ApiProperty({ example: 21.2 })
  d60!: number;

  @ApiProperty({ example: 18.4 })
  d90!: number;
}

export class AudienceSegmentDto {
  @ApiProperty({ example: 'Interactive Decision Seekers' })
  name!: string;

  @ApiProperty({ example: 'Engages with >80% of branch choices and votes' })
  tagline!: string;

  @ApiProperty({ example: '68,400' })
  userCount!: string;

  @ApiProperty({ example: 68400 })
  userCountNumber!: number;

  @ApiProperty({ example: '32.5%' })
  shareOfAudience!: string;

  @ApiProperty({ example: '42 mins' })
  avgWatchTime!: string;

  @ApiProperty({ example: '14.2' })
  sessionsPerMonth!: string;

  @ApiProperty({ example: '86.4%' })
  completionRate!: string;

  @ApiProperty({ example: '94.2%' })
  choiceParticipation!: string;

  @ApiProperty({ example: '14.8%' })
  subConversion!: string;

  @ApiProperty({ example: '48.2%' })
  d30Retention!: string;

  @ApiProperty({ example: 'High replayability across alternate narrative endings' })
  keyBehavior!: string;
}

export class AudienceDashboardResponseDto {
  @ApiProperty({ example: 25700, description: 'Daily Active Users (DAU)' })
  dau!: number;

  @ApiProperty({ example: 148000, description: 'Monthly Active Users (MAU - 30d rolling)' })
  mau!: number;

  @ApiProperty({ example: 17.36, description: 'Stickiness ratio (DAU / MAU * 100)' })
  stickinessRatio!: number;

  @ApiProperty({ example: 420000, description: 'Total registered user count' })
  totalRegisteredUsers!: number;

  @ApiProperty({ example: 18400, description: 'New registrations in past 30 days' })
  newRegistrationsPeriod!: number;

  @ApiProperty({ example: 84200, description: 'Returning users in past 30 days' })
  returningUsersPeriod!: number;

  @ApiProperty({ type: [AudienceGrowthPointDto] })
  growthTrends!: AudienceGrowthPointDto[];

  @ApiProperty({ type: [RetentionCohortDto] })
  retentionCohorts!: RetentionCohortDto[];

  @ApiProperty({ type: [AudienceSegmentDto] })
  segments!: AudienceSegmentDto[];

  @ApiProperty({ example: '2026-10-11T12:00:00.000Z' })
  generatedAt!: string;

  @ApiProperty({ example: true })
  isCached!: boolean;
}
