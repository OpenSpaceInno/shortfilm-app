import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';

export class TimeSeriesPointDto {
  @ApiProperty({ example: 'Sep' })
  label: string;

  @ApiProperty({ example: 1450 })
  value: number;
}

export class CreatorAnalyticsOverviewDto {
  @ApiProperty({ example: '01HA8888888888ABCDEF000001' })
  creatorId: string;

  @ApiProperty({ example: 'Dev Sharma' })
  displayName: string;

  // 11 Core Telemetry KPIs
  @ApiProperty({ example: 1820000, description: 'Total aggregate views' })
  totalViews: number;

  @ApiProperty({ example: 1400000, description: 'Unique viewer users' })
  uniqueViewers: number;

  @ApiProperty({ example: 288000, description: 'Watch time in minutes' })
  watchTimeMinutes: number;

  @ApiProperty({ example: 4800, description: 'Watch time in hours' })
  watchTimeHours: number;

  @ApiProperty({ example: 84.5, description: 'Completion rate %' })
  completionRate: number;

  @ApiProperty({ example: 82.0, description: 'Average episode completion %' })
  avgEpisodeCompletion: number;

  @ApiProperty({ example: 42500, description: 'Active creator followers' })
  totalFollowers: number;

  @ApiProperty({ example: 12.8, description: 'Engagement rate %' })
  engagementRate: number;

  @ApiProperty({ example: 88.4, description: 'Branch choice decision participation %' })
  choiceParticipationRate: number;

  @ApiProperty({ example: 142000, description: 'Prediction votes cast on stories' })
  predictionVotes: number;

  @ApiProperty({ example: 54200, description: 'Total shares' })
  storyShares: number;

  @ApiProperty({ example: 68.5, description: 'Repeat viewer loyalty %' })
  returningViewersRate: number;

  @ApiProperty({ example: '125000.00', description: 'Creator gross earnings in INR' })
  totalGrossRevenue: string;

  @ApiProperty({ example: 6, description: 'Total stories created' })
  totalStories: number;

  // Trend Charts
  @ApiProperty({ type: [TimeSeriesPointDto], description: 'Views over recent months (in thousands)' })
  viewsOverTime: TimeSeriesPointDto[];

  @ApiProperty({ type: [TimeSeriesPointDto], description: 'Watch time over recent months (in hours)' })
  watchTimeOverTime: TimeSeriesPointDto[];

  @ApiProperty({ type: [TimeSeriesPointDto], description: 'Follower growth over recent months' })
  followerGrowthOverTime: TimeSeriesPointDto[];
}

export class EpisodeDropOffPointDto {
  @ApiProperty({ example: 1 })
  episodeNumber: number;

  @ApiProperty({ example: 'Pilot: The Arrival' })
  title: string;

  @ApiProperty({ example: 100000 })
  viewCount: number;

  @ApiProperty({ example: 100.0, description: '% of original audience remaining' })
  retentionPercentage: number;

  @ApiProperty({ example: 0.0, description: '% dropped off from previous episode' })
  dropOffRate: number;
}

export class StoryDropOffCurveDto {
  @ApiProperty({ example: '01HA7777777777ABCDEF000001' })
  storyId: string;

  @ApiProperty({ example: 'Messages From Tomorrow' })
  title: string;

  @ApiProperty({ example: 100000 })
  initialAudience: number;

  @ApiProperty({ type: [EpisodeDropOffPointDto] })
  episodes: EpisodeDropOffPointDto[];
}

export class QuartileRetentionPointDto {
  @ApiProperty({ example: '25%' })
  quartile: string;

  @ApiProperty({ example: 92.5 })
  audiencePercentage: number;
}

export class CreatorRetentionAnalyticsDto {
  @ApiProperty({ example: '01HA8888888888ABCDEF000001' })
  creatorId: string;

  @ApiProperty({ type: [QuartileRetentionPointDto], description: 'Within-episode retention curve' })
  withinEpisodeQuartiles: QuartileRetentionPointDto[];

  @ApiProperty({ type: [StoryDropOffCurveDto], description: 'Episode-by-episode drop-off curves per story' })
  storyDropOffCurves: StoryDropOffCurveDto[];
}

export class ChoiceOptionAnalyticsDto {
  @ApiProperty({ example: '01HA1111111111ABCDEF000001' })
  optionId: string;

  @ApiProperty({ example: 'Open blast doors and let him in' })
  label: string;

  @ApiProperty({ example: 12450 })
  voteCount: number;

  @ApiProperty({ example: 64.2 })
  percentage: number;

  @ApiProperty({ example: true })
  isDominant: boolean;
}

export class ChoiceDecisionPointDto {
  @ApiProperty({ example: '01HA2222222222ABCDEF000001' })
  choiceId: string;

  @ApiProperty({ example: '01HA7777777777ABCDEF000001' })
  storyId: string;

  @ApiProperty({ example: 'Neon Karma 2099' })
  storyTitle: string;

  @ApiProperty({ example: 'Should Zara let Veer inside or trigger alarm?' })
  prompt: string;

  @ApiProperty({ example: 19400 })
  totalVotes: number;

  @ApiProperty({ enum: ['SPLIT', 'DECISIVE', 'OVERWHELMING'], example: 'DECISIVE' })
  consensusType: string;

  @ApiProperty({ type: [ChoiceOptionAnalyticsDto] })
  options: ChoiceOptionAnalyticsDto[];
}

export class CreatorChoiceAnalyticsDto {
  @ApiProperty({ example: '01HA8888888888ABCDEF000001' })
  creatorId: string;

  @ApiProperty({ example: 85000, description: 'Total choice votes cast on creator stories' })
  totalVotesCast: number;

  @ApiProperty({ example: 8.5, description: 'Average seconds taken to make decision' })
  avgDecisionTimeSeconds: number;

  @ApiProperty({ type: [ChoiceDecisionPointDto] })
  choicePoints: ChoiceDecisionPointDto[];
}

export class StoryPerformanceItemDto {
  @ApiProperty({ example: '01HA7777777777ABCDEF000001' })
  id: string;

  @ApiProperty({ example: 'Messages From Tomorrow' })
  title: string;

  @ApiProperty({ example: 'Mystery · Romance' })
  genre: string;

  @ApiProperty({ example: 8 })
  episodesCount: number;

  @ApiProperty({ example: 450000 })
  views: number;

  @ApiProperty({ example: 86.4 })
  completionRate: number;

  @ApiProperty({ example: 48000 })
  watchTimeMinutes: number;

  @ApiProperty({ example: 12400 })
  shares: number;

  @ApiProperty({ example: 34500 })
  votes: number;

  @ApiProperty({ example: '42500.00' })
  revenue: string;

  @ApiProperty({ example: 'PUBLISHED' })
  status: string;
}

export class CreatorContentPerformanceDto {
  @ApiProperty({ example: '01HA8888888888ABCDEF000001' })
  creatorId: string;

  @ApiProperty({ type: [StoryPerformanceItemDto] })
  stories: StoryPerformanceItemDto[];
}

export class CreatorAnalyticsQueryDto {
  @ApiPropertyOptional({ enum: ['7d', '30d', '90d', 'all'], default: '30d' })
  @IsOptional()
  @IsString()
  timeRange?: string = '30d';

  @ApiPropertyOptional({ description: 'Filter analytics to specific story ULID' })
  @IsOptional()
  @IsString()
  storyId?: string;
}
