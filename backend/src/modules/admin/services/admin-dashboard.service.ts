import { Injectable, Logger } from '@nestjs/common';
import { AdminUsersRepository } from '../repositories/admin-users.repository';
import { AdminContentRepository } from '../repositories/admin-content.repository';
import { ModerationReportsRepository } from '../repositories/moderation-reports.repository';
import { FeaturedCurationsRepository } from '../repositories/featured-curations.repository';
import { SystemSettingsRepository } from '../repositories/system-settings.repository';
import { CreatorSubmissionsRepository } from '../../creators/repositories/creator-submissions.repository';
import { CreatorsRepository } from '../../creators/repositories/creators.repository';
import { CreatorApplicationsRepository } from '../../creators/repositories/creator-applications.repository';
import { CreatorVerificationsRepository } from '../../creators/repositories/creator-verifications.repository';
import { AdminOverviewStatsDto } from '../dto/admin-dashboard.dto';

@Injectable()
export class AdminDashboardService {
  private readonly logger = new Logger(AdminDashboardService.name);
  private readonly startTime = Date.now();

  constructor(
    private readonly usersRepo: AdminUsersRepository,
    private readonly contentRepo: AdminContentRepository,
    private readonly reportsRepo: ModerationReportsRepository,
    private readonly curationsRepo: FeaturedCurationsRepository,
    private readonly settingsRepo: SystemSettingsRepository,
    private readonly submissionsRepo: CreatorSubmissionsRepository,
    private readonly creatorsRepo: CreatorsRepository,
    private readonly applicationsRepo: CreatorApplicationsRepository,
    private readonly verificationsRepo: CreatorVerificationsRepository,
  ) {}

  async getOverviewStats(): Promise<AdminOverviewStatsDto> {
    // 1. User stats
    const userStats = await this.usersRepo.countByStatus();

    // 2. Story stats
    const storyStats = await this.contentRepo.countStoriesByStatus();

    // 3. Creator stats
    const creatorsResult = await this.creatorsRepo.findAll({ limit: 1 });
    const pendingAppsResult = await this.applicationsRepo.findAll({ status: 'PENDING', limit: 1 });
    const pendingVerifsResult = await this.verificationsRepo.findAll({ status: 'PENDING', limit: 1 });

    // 4. Submissions queue
    const pendingSubmissionsResult = await this.submissionsRepo.findAll({
      status: 'UNDER_REVIEW',
      limit: 1,
    });

    // 5. Moderation reports
    const pendingReports = await this.reportsRepo.countPending();

    // 6. Active curations
    const activeCurations = await this.curationsRepo.countActive();

    // 7. System maintenance flag
    const maintenanceSetting = await this.settingsRepo.findByKey('maintenance_mode');
    const maintenanceMode = Boolean(maintenanceSetting?.value);

    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);

    return {
      totalUsers: userStats.total,
      activeUsers: userStats.active,
      suspendedUsers: userStats.suspended,
      totalCreators: creatorsResult.total,
      pendingCreatorApplications: pendingAppsResult.total,
      pendingVerifications: pendingVerifsResult.total,
      totalStories: storyStats.total,
      publishedStories: storyStats.published,
      inReviewStories: storyStats.inReview,
      pendingSubmissions: pendingSubmissionsResult.total,
      unresolvedReports: pendingReports,
      activeCurations,
      maintenanceMode,
      systemHealth: {
        database: 'HEALTHY',
        redis: 'HEALTHY',
        uptimeSeconds,
      },
    };
  }
}
