import { Test, TestingModule } from '@nestjs/testing';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminSettingsController } from './admin-settings.controller';
import { AdminCurationController } from './admin-curation.controller';
import { AdminModerationController } from './admin-moderation.controller';
import { AdminSubmissionsController } from './admin-submissions.controller';
import { AdminAuditController } from './admin-audit.controller';

import { AdminDashboardService } from '../services/admin-dashboard.service';
import { SystemSettingsService } from '../services/system-settings.service';
import { ContentCurationService } from '../services/content-curation.service';
import { UserModerationService } from '../services/user-moderation.service';
import { AdminSubmissionsService } from '../services/admin-submissions.service';
import { AuditService } from '../services/audit.service';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';

describe('Admin Controllers Suite', () => {
  let dashboardController: AdminDashboardController;
  let settingsController: AdminSettingsController;
  let curationController: AdminCurationController;
  let moderationController: AdminModerationController;
  let submissionsController: AdminSubmissionsController;
  let auditController: AdminAuditController;

  let dashboardService: jest.Mocked<AdminDashboardService>;
  let settingsService: jest.Mocked<SystemSettingsService>;
  let curationService: jest.Mocked<ContentCurationService>;
  let moderationService: jest.Mocked<UserModerationService>;
  let submissionsService: jest.Mocked<AdminSubmissionsService>;
  let auditService: jest.Mocked<AuditService>;

  const mockAdminUser: AuthenticatedUser = {
    id: 'user_admin',
    externalSubjectId: 'auth0|admin',
    externalAuthProvider: 'AUTH0',
    email: 'admin@shortreel.com',
    displayName: 'Admin User',
    avatarUrl: null,
    status: 'ACTIVE',
    roles: ['SUPER_ADMIN'],
    permissions: [],
  };

  const mockRequest = {
    ip: '127.0.0.1',
    headers: {
      'user-agent': 'JestTestRunner',
      'x-request-id': 'req_xyz789',
    },
  } as any;

  beforeEach(async () => {
    const mockDashboardService = { getOverviewStats: jest.fn() };
    const mockSettingsService = {
      getPublicSettings: jest.fn(),
      getAllSettings: jest.fn(),
      getSettingByKey: jest.fn(),
      updateSetting: jest.fn(),
      batchUpdateSettings: jest.fn(),
      resetToDefaults: jest.fn(),
    };
    const mockCurationService = {
      getStories: jest.fn(),
      getStoryDetail: jest.fn(),
      curateStory: jest.fn(),
      archiveStory: jest.fn(),
      unpublishStory: jest.fn(),
      overrideMetadata: jest.fn(),
      listCurations: jest.fn(),
      createCuration: jest.fn(),
      updateCuration: jest.fn(),
      deleteCuration: jest.fn(),
    };
    const mockModerationService = {
      listUsers: jest.fn(),
      getUserDetail: jest.fn(),
      updateUserStatus: jest.fn(),
      updateUserRoles: jest.fn(),
      createReport: jest.fn(),
      listReports: jest.fn(),
      resolveReport: jest.fn(),
    };
    const mockSubmissionsService = {
      listSubmissions: jest.fn(),
      getSubmissionById: jest.fn(),
      approveSubmission: jest.fn(),
      rejectSubmission: jest.fn(),
      requestChanges: jest.fn(),
    };
    const mockAuditService = {
      getAuditTrail: jest.fn(),
      getAuditLogById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [
        AdminDashboardController,
        AdminSettingsController,
        AdminCurationController,
        AdminModerationController,
        AdminSubmissionsController,
        AdminAuditController,
      ],
      providers: [
        { provide: AdminDashboardService, useValue: mockDashboardService },
        { provide: SystemSettingsService, useValue: mockSettingsService },
        { provide: ContentCurationService, useValue: mockCurationService },
        { provide: UserModerationService, useValue: mockModerationService },
        { provide: AdminSubmissionsService, useValue: mockSubmissionsService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    dashboardController = module.get(AdminDashboardController);
    settingsController = module.get(AdminSettingsController);
    curationController = module.get(AdminCurationController);
    moderationController = module.get(AdminModerationController);
    submissionsController = module.get(AdminSubmissionsController);
    auditController = module.get(AdminAuditController);

    dashboardService = module.get(AdminDashboardService);
    settingsService = module.get(SystemSettingsService);
    curationService = module.get(ContentCurationService);
    moderationService = module.get(UserModerationService);
    submissionsService = module.get(AdminSubmissionsService);
    auditService = module.get(AuditService);
  });

  describe('AdminDashboardController', () => {
    it('getOverview should return overview stats wrapped in ApiResponseDto', async () => {
      const mockStats = { totalUsers: 10, totalStories: 5 } as any;
      dashboardService.getOverviewStats.mockResolvedValue(mockStats);

      const res = await dashboardController.getOverview();
      expect(res.data).toEqual(mockStats);
      expect(dashboardService.getOverviewStats).toHaveBeenCalled();
    });
  });

  describe('AdminSettingsController', () => {
    it('getPublicSettings should return public dictionary', async () => {
      settingsService.getPublicSettings.mockResolvedValue({ maintenance: false });

      const res = await settingsController.getPublicSettings();
      expect(res.data).toEqual({ maintenance: false });
    });

    it('getAllSettings should return settings array', async () => {
      settingsService.getAllSettings.mockResolvedValue([{ key: 'k1', value: 'v1' } as any]);

      const res = await settingsController.getAllSettings({});
      expect(res.data).toHaveLength(1);
    });

    it('getSettingByKey should return setting', async () => {
      settingsService.getSettingByKey.mockResolvedValue({ key: 'k1', value: 'v1' } as any);

      const res = await settingsController.getSettingByKey('k1');
      expect(res.data.key).toBe('k1');
    });

    it('updateSetting should call service with user and request info', async () => {
      settingsService.updateSetting.mockResolvedValue({ key: 'k1', value: 'v2' } as any);

      const res = await settingsController.updateSetting(
        'k1',
        { value: 'v2' },
        mockAdminUser,
        mockRequest,
      );
      expect(res.data.value).toBe('v2');
      expect(settingsService.updateSetting).toHaveBeenCalledWith(
        'k1',
        { value: 'v2' },
        mockAdminUser,
        expect.objectContaining({ ipAddress: '127.0.0.1' }),
      );
    });

    it('batchUpdate should call service', async () => {
      settingsService.batchUpdateSettings.mockResolvedValue([{ key: 'k1', value: 'v2' } as any]);

      const res = await settingsController.batchUpdate(
        { settings: [{ key: 'k1', value: 'v2' }] },
        mockAdminUser,
        mockRequest,
      );
      expect(res.data).toHaveLength(1);
    });

    it('resetToDefaults should call service', async () => {
      settingsService.resetToDefaults.mockResolvedValue([]);

      const res = await settingsController.resetToDefaults(
        'SYSTEM' as any,
        mockAdminUser,
        mockRequest,
      );
      expect(res.data).toEqual([]);
    });
  });

  describe('AdminCurationController', () => {
    it('getStories should return paginated list', async () => {
      curationService.getStories.mockResolvedValue({
        items: [{ id: 's1' } as any],
        total: 1,
        page: 1,
        limit: 20,
      });

      const res = await curationController.getStories({});
      expect(res.data).toHaveLength(1);
      expect(res.meta?.total).toBe(1);
    });

    it('curateStory should call service', async () => {
      curationService.curateStory.mockResolvedValue({ id: 's1', isFeatured: true } as any);

      const res = await curationController.curateStory(
        's1',
        { isFeatured: true },
        mockAdminUser,
        mockRequest,
      );
      expect(res.data!.isFeatured).toBe(true);
    });

    it('archiveStory should call service', async () => {
      curationService.archiveStory.mockResolvedValue({ success: true, message: 'Archived', story: {} as any });

      const res = await curationController.archiveStory(
        's1',
        { reason: 'Expired rights' },
        mockAdminUser,
        mockRequest,
      );
      expect(res.data.success).toBe(true);
    });

    it('unpublishStory should call service', async () => {
      curationService.unpublishStory.mockResolvedValue({ success: true, message: 'Unpublished', story: {} as any });

      const res = await curationController.unpublishStory(
        's1',
        { reason: 'Fix needed' },
        mockAdminUser,
        mockRequest,
      );
      expect(res.data.success).toBe(true);
    });

    it('overrideMetadata should call service', async () => {
      curationService.overrideMetadata.mockResolvedValue({ id: 's1', title: 'Overridden Title' } as any);

      const res = await curationController.overrideMetadata(
        's1',
        { title: 'Overridden Title' },
        mockAdminUser,
        mockRequest,
      );
      expect(res.data!.title).toBe('Overridden Title');
    });

    it('curations endpoints should forward to service', async () => {
      curationService.listCurations.mockResolvedValue([{ id: 'c1' } as any]);
      const list = await curationController.listCurations('HOME_HERO' as any);
      expect(list.data).toHaveLength(1);

      curationService.createCuration.mockResolvedValue({ id: 'c1' } as any);
      const created = await curationController.createCuration(
        { storyId: 's1', collectionType: 'HOME_HERO' as any, displayOrder: 1 },
        mockAdminUser,
        mockRequest,
      );
      expect(created.data.id).toBe('c1');

      curationService.updateCuration.mockResolvedValue({ id: 'c1' } as any);
      const updated = await curationController.updateCuration(
        'c1',
        { displayOrder: 2 },
        mockAdminUser,
        mockRequest,
      );
      expect(updated.data.id).toBe('c1');

      curationService.deleteCuration.mockResolvedValue({ success: true, message: 'Deleted' });
      const del = await curationController.deleteCuration('c1', mockAdminUser, mockRequest);
      expect(del.data.success).toBe(true);
    });
  });

  describe('AdminModerationController', () => {
    it('listUsers should return list', async () => {
      moderationService.listUsers.mockResolvedValue({
        items: [{ id: 'u1' } as any],
        total: 1,
        page: 1,
        limit: 20,
      });

      const res = await moderationController.listUsers({});
      expect(res.data).toHaveLength(1);
      expect(res.meta?.total).toBe(1);
    });

    it('updateUserStatus should call service', async () => {
      moderationService.updateUserStatus.mockResolvedValue({ id: 'u1', status: 'SUSPENDED' } as any);

      const res = await moderationController.updateUserStatus(
        'u1',
        { status: 'SUSPENDED', reason: 'TOS' },
        mockAdminUser,
        mockRequest,
      );
      expect(res.data.status).toBe('SUSPENDED');
    });

    it('updateUserRoles should call service', async () => {
      moderationService.updateUserRoles.mockResolvedValue({ id: 'u1', roles: ['EDITOR'] } as any);

      const res = await moderationController.updateUserRoles(
        'u1',
        { roles: ['EDITOR'] },
        mockAdminUser,
        mockRequest,
      );
      expect(res.data.roles).toContain('EDITOR');
    });

    it('moderation reports endpoints should call service', async () => {
      moderationService.createReport.mockResolvedValue({ id: 'r1' } as any);
      const rep = await moderationController.createReport(
        { targetType: 'USER', targetId: 'u1', reason: 'SPAM' as any },
        mockAdminUser,
      );
      expect(rep.data.id).toBe('r1');

      moderationService.listReports.mockResolvedValue({
        items: [{ id: 'r1' } as any],
        total: 1,
        page: 1,
        limit: 20,
      });
      const list = await moderationController.listReports({});
      expect(list.data).toHaveLength(1);

      moderationService.resolveReport.mockResolvedValue({ id: 'r1', status: 'RESOLVED' } as any);
      const res = await moderationController.resolveReport(
        'r1',
        { resolutionAction: 'DISMISSED', resolutionNotes: 'No issue' },
        mockAdminUser,
        mockRequest,
      );
      expect(res.data.status).toBe('RESOLVED');
    });
  });

  describe('AdminSubmissionsController', () => {
    it('listSubmissions should return list', async () => {
      submissionsService.listSubmissions.mockResolvedValue({ items: [{ id: 'sub1' } as any], total: 1 } as any);

      const res = await submissionsController.listSubmissions({});
      expect(res.data.items).toHaveLength(1);
    });

    it('approveSubmission should call service', async () => {
      submissionsService.approveSubmission.mockResolvedValue({ id: 'sub1', status: 'APPROVED' } as any);

      const res = await submissionsController.approveSubmission(
        'sub1',
        { notes: 'Good' },
        mockAdminUser,
        mockRequest,
      );
      expect(res.data.status).toBe('APPROVED');
    });

    it('rejectSubmission should call service', async () => {
      submissionsService.rejectSubmission.mockResolvedValue({ id: 'sub1', status: 'REJECTED' } as any);

      const res = await submissionsController.rejectSubmission(
        'sub1',
        { reason: 'Poor quality' },
        mockAdminUser,
        mockRequest,
      );
      expect(res.data.status).toBe('REJECTED');
    });

    it('requestChanges should call service', async () => {
      submissionsService.requestChanges.mockResolvedValue({ id: 'sub1', status: 'CHANGES_REQUESTED' } as any);

      const res = await submissionsController.requestChanges(
        'sub1',
        { feedback: 'Fix audio' },
        mockAdminUser,
        mockRequest,
      );
      expect(res.data.status).toBe('CHANGES_REQUESTED');
    });
  });

  describe('AdminAuditController', () => {
    it('getAuditTrail should return paginated list', async () => {
      auditService.getAuditTrail.mockResolvedValue({
        items: [{ id: 'a1' } as any],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const res = await auditController.getAuditTrail({});
      expect(res.data).toHaveLength(1);
      expect(res.meta?.total).toBe(1);
    });

    it('getAuditLogById should return log', async () => {
      auditService.getAuditLogById.mockResolvedValue({ id: 'a1' } as any);

      const res = await auditController.getAuditLogById('a1');
      expect(res.data.id).toBe('a1');
    });
  });
});
