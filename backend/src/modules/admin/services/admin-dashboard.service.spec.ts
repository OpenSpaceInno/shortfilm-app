import { Test, TestingModule } from '@nestjs/testing';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminUsersRepository } from '../repositories/admin-users.repository';
import { AdminContentRepository } from '../repositories/admin-content.repository';
import { ModerationReportsRepository } from '../repositories/moderation-reports.repository';
import { FeaturedCurationsRepository } from '../repositories/featured-curations.repository';
import { SystemSettingsRepository } from '../repositories/system-settings.repository';
import { CreatorSubmissionsRepository } from '../../creators/repositories/creator-submissions.repository';
import { CreatorsRepository } from '../../creators/repositories/creators.repository';
import { CreatorApplicationsRepository } from '../../creators/repositories/creator-applications.repository';
import { CreatorVerificationsRepository } from '../../creators/repositories/creator-verifications.repository';

describe('AdminDashboardService', () => {
  let service: AdminDashboardService;
  let usersRepo: jest.Mocked<AdminUsersRepository>;
  let contentRepo: jest.Mocked<AdminContentRepository>;
  let reportsRepo: jest.Mocked<ModerationReportsRepository>;
  let curationsRepo: jest.Mocked<FeaturedCurationsRepository>;
  let settingsRepo: jest.Mocked<SystemSettingsRepository>;
  let submissionsRepo: jest.Mocked<CreatorSubmissionsRepository>;
  let creatorsRepo: jest.Mocked<CreatorsRepository>;
  let applicationsRepo: jest.Mocked<CreatorApplicationsRepository>;
  let verificationsRepo: jest.Mocked<CreatorVerificationsRepository>;

  beforeEach(async () => {
    const mockUsersRepo = { countByStatus: jest.fn() };
    const mockContentRepo = { countStoriesByStatus: jest.fn() };
    const mockReportsRepo = { countPending: jest.fn() };
    const mockCurationsRepo = { countActive: jest.fn() };
    const mockSettingsRepo = { findByKey: jest.fn() };
    const mockSubmissionsRepo = { findAll: jest.fn() };
    const mockCreatorsRepo = { findAll: jest.fn() };
    const mockApplicationsRepo = { findAll: jest.fn() };
    const mockVerificationsRepo = { findAll: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminDashboardService,
        { provide: AdminUsersRepository, useValue: mockUsersRepo },
        { provide: AdminContentRepository, useValue: mockContentRepo },
        { provide: ModerationReportsRepository, useValue: mockReportsRepo },
        { provide: FeaturedCurationsRepository, useValue: mockCurationsRepo },
        { provide: SystemSettingsRepository, useValue: mockSettingsRepo },
        { provide: CreatorSubmissionsRepository, useValue: mockSubmissionsRepo },
        { provide: CreatorsRepository, useValue: mockCreatorsRepo },
        { provide: CreatorApplicationsRepository, useValue: mockApplicationsRepo },
        { provide: CreatorVerificationsRepository, useValue: mockVerificationsRepo },
      ],
    }).compile();

    service = module.get<AdminDashboardService>(AdminDashboardService);
    usersRepo = module.get(AdminUsersRepository);
    contentRepo = module.get(AdminContentRepository);
    reportsRepo = module.get(ModerationReportsRepository);
    curationsRepo = module.get(FeaturedCurationsRepository);
    settingsRepo = module.get(SystemSettingsRepository);
    submissionsRepo = module.get(CreatorSubmissionsRepository);
    creatorsRepo = module.get(CreatorsRepository);
    applicationsRepo = module.get(CreatorApplicationsRepository);
    verificationsRepo = module.get(CreatorVerificationsRepository);
  });

  describe('getOverviewStats', () => {
    it('should aggregate all cross-system KPIs and system health metrics', async () => {
      usersRepo.countByStatus.mockResolvedValue({ total: 100, active: 95, suspended: 5 });
      contentRepo.countStoriesByStatus.mockResolvedValue({ total: 50, published: 40, inReview: 10, draft: 0, archived: 0 });
      creatorsRepo.findAll.mockResolvedValue({ items: [], total: 25 });
      applicationsRepo.findAll.mockResolvedValue({ items: [], total: 3 });
      verificationsRepo.findAll.mockResolvedValue({ items: [], total: 2 });
      submissionsRepo.findAll.mockResolvedValue({ items: [], total: 4 });
      reportsRepo.countPending.mockResolvedValue(1);
      curationsRepo.countActive.mockResolvedValue(6);
      settingsRepo.findByKey.mockResolvedValue({
        id: 's1',
        category: 'SYSTEM' as any,
        key: 'maintenance_mode',
        value: false,
        valueType: 'BOOLEAN' as any,
        description: null,
        isPublic: true,
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const stats = await service.getOverviewStats();

      expect(stats.totalUsers).toBe(100);
      expect(stats.activeUsers).toBe(95);
      expect(stats.suspendedUsers).toBe(5);
      expect(stats.totalCreators).toBe(25);
      expect(stats.pendingCreatorApplications).toBe(3);
      expect(stats.pendingVerifications).toBe(2);
      expect(stats.totalStories).toBe(50);
      expect(stats.publishedStories).toBe(40);
      expect(stats.inReviewStories).toBe(10);
      expect(stats.pendingSubmissions).toBe(4);
      expect(stats.unresolvedReports).toBe(1);
      expect(stats.activeCurations).toBe(6);
      expect(stats.maintenanceMode).toBe(false);
      expect(stats.systemHealth.database).toBe('HEALTHY');
      expect(stats.systemHealth.redis).toBe('HEALTHY');
      expect(typeof stats.systemHealth.uptimeSeconds).toBe('number');
    });
  });
});
