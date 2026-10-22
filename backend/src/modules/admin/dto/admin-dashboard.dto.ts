import { ApiProperty } from '@nestjs/swagger';

export class AdminOverviewStatsDto {
  @ApiProperty({ description: 'Total registered user count' })
  totalUsers: number;

  @ApiProperty({ description: 'Total active users' })
  activeUsers: number;

  @ApiProperty({ description: 'Total suspended or banned users' })
  suspendedUsers: number;

  @ApiProperty({ description: 'Total registered creators' })
  totalCreators: number;

  @ApiProperty({ description: 'Pending creator onboarding applications' })
  pendingCreatorApplications: number;

  @ApiProperty({ description: 'Unreviewed creator identity verifications' })
  pendingVerifications: number;

  @ApiProperty({ description: 'Total stories in catalog across all statuses' })
  totalStories: number;

  @ApiProperty({ description: 'Total published stories available on consumer feeds' })
  publishedStories: number;

  @ApiProperty({ description: 'Stories in review or draft' })
  inReviewStories: number;

  @ApiProperty({ description: 'Pending creator story pitches & episode submissions' })
  pendingSubmissions: number;

  @ApiProperty({ description: 'Unresolved user moderation reports' })
  unresolvedReports: number;

  @ApiProperty({ description: 'Active featured stories pinned to carousels' })
  activeCurations: number;

  @ApiProperty({ description: 'Current system maintenance mode state' })
  maintenanceMode: boolean;

  @ApiProperty({ description: 'System health status summary' })
  systemHealth: {
    database: string;
    redis: string;
    uptimeSeconds: number;
  };
}
