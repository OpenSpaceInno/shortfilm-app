import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UserModerationService } from './user-moderation.service';
import { AdminUsersRepository } from '../repositories/admin-users.repository';
import { ModerationReportsRepository } from '../repositories/moderation-reports.repository';
import { AdminContentRepository } from '../repositories/admin-content.repository';
import { AuditService } from './audit.service';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';

describe('UserModerationService', () => {
  let service: UserModerationService;
  let usersRepo: jest.Mocked<AdminUsersRepository>;
  let reportsRepo: jest.Mocked<ModerationReportsRepository>;
  let contentRepo: jest.Mocked<AdminContentRepository>;
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

  const mockTargetUser = {
    id: 'user_target_01',
    email: 'target@example.com',
    displayName: 'Target User',
    avatarUrl: null,
    status: 'ACTIVE' as any,
    roles: ['CREATOR'],
    permissions: [],
    creatorProfile: null,
    reportsAgainstCount: 2,
    lastLoginAt: new Date('2026-10-10T12:00:00Z'),
    createdAt: new Date('2026-10-01T12:00:00Z'),
  };

  const mockReport = {
    id: 'rep_01',
    reporterUserId: 'user_reporter',
    targetType: 'USER' as any,
    targetId: 'user_target_01',
    reason: 'HARASSMENT' as any,
    details: 'Abusive comments in forum',
    status: 'PENDING' as any,
    resolutionAction: null,
    resolutionNotes: null,
    resolvedBy: null,
    resolvedAt: null,
    createdAt: new Date('2026-10-11T12:00:00Z'),
    updatedAt: new Date('2026-10-11T12:00:00Z'),
  };

  beforeEach(async () => {
    const mockUsersRepo = {
      findUsersPaginated: jest.fn(),
      findUserDetail: jest.fn(),
      updateStatus: jest.fn(),
      setUserRoles: jest.fn(),
      countByStatus: jest.fn(),
    };

    const mockReportsRepo = {
      findMany: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      updateResolution: jest.fn(),
      countPending: jest.fn(),
    };

    const mockContentRepo = {
      findStoriesPaginated: jest.fn(),
      findStoryDetail: jest.fn(),
      updateStatus: jest.fn(),
      updateMetadata: jest.fn(),
      countStoriesByStatus: jest.fn(),
    };

    const mockAudit = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserModerationService,
        { provide: AdminUsersRepository, useValue: mockUsersRepo },
        { provide: ModerationReportsRepository, useValue: mockReportsRepo },
        { provide: AdminContentRepository, useValue: mockContentRepo },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<UserModerationService>(UserModerationService);
    usersRepo = module.get(AdminUsersRepository);
    reportsRepo = module.get(ModerationReportsRepository);
    contentRepo = module.get(AdminContentRepository);
    auditService = module.get(AuditService);
  });

  describe('listUsers', () => {
    it('should return paginated list of users', async () => {
      usersRepo.findUsersPaginated.mockResolvedValue({
        items: [mockTargetUser as any],
        total: 1,
      });

      const res = await service.listUsers({ page: 1, limit: 10 });
      expect(res.items).toHaveLength(1);
      expect(res.total).toBe(1);
    });
  });

  describe('getUserDetail', () => {
    it('should return user detail', async () => {
      usersRepo.findUserDetail.mockResolvedValue(mockTargetUser as any);

      const res = await service.getUserDetail('user_target_01');
      expect(res.id).toBe('user_target_01');
      expect(res.reportsAgainstCount).toBe(2);
    });

    it('should throw NotFoundException if user not found', async () => {
      usersRepo.findUserDetail.mockResolvedValue(null);

      await expect(service.getUserDetail('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUserStatus', () => {
    it('should throw BadRequestException if super admin attempts to self-suspend', async () => {
      usersRepo.findUserDetail.mockResolvedValue({
        ...mockTargetUser,
        id: 'user_admin',
      } as any);

      await expect(
        service.updateUserStatus('user_admin', { status: 'SUSPENDED', reason: 'Self suspension test' }, mockAdminUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update user status and create audit log', async () => {
      usersRepo.findUserDetail
        .mockResolvedValueOnce(mockTargetUser as any)
        .mockResolvedValueOnce({
          ...mockTargetUser,
          status: 'SUSPENDED',
        } as any);

      usersRepo.updateStatus.mockResolvedValue(mockTargetUser as any);

      const res = await service.updateUserStatus(
        'user_target_01',
        { status: 'SUSPENDED', reason: 'Repeated guideline violations' },
        mockAdminUser,
      );

      expect(usersRepo.updateStatus).toHaveBeenCalledWith('user_target_01', 'SUSPENDED');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_STATUS_SUSPENDED',
          entityId: 'user_target_01',
        }),
      );
      expect(res.status).toBe('SUSPENDED');
    });
  });

  describe('updateUserRoles', () => {
    it('should throw BadRequestException if roles array is empty', async () => {
      usersRepo.findUserDetail.mockResolvedValue(mockTargetUser as any);

      await expect(
        service.updateUserRoles('user_target_01', { roles: [] }, mockAdminUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update user roles and create audit log', async () => {
      usersRepo.findUserDetail
        .mockResolvedValueOnce(mockTargetUser as any)
        .mockResolvedValueOnce({
          ...mockTargetUser,
          roles: ['CREATOR', 'CONTENT_ADMIN'],
        } as any);

      usersRepo.setUserRoles.mockResolvedValue(['CREATOR', 'CONTENT_ADMIN']);

      const res = await service.updateUserRoles(
        'user_target_01',
        { roles: ['CREATOR', 'CONTENT_ADMIN'] },
        mockAdminUser,
      );

      expect(usersRepo.setUserRoles).toHaveBeenCalledWith('user_target_01', [
        'CREATOR',
        'CONTENT_ADMIN',
      ]);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_ROLES_UPDATED',
          entityId: 'user_target_01',
        }),
      );
      expect(res.roles).toEqual(['CREATOR', 'CONTENT_ADMIN']);
    });
  });

  describe('createReport', () => {
    it('should file a moderation report', async () => {
      reportsRepo.create.mockResolvedValue(mockReport as any);

      const res = await service.createReport(
        {
          targetType: 'USER',
          targetId: 'user_target_01',
          reason: 'HARASSMENT',
          details: 'Abusive comments in forum',
        },
        'user_reporter',
      );

      expect(reportsRepo.create).toHaveBeenCalled();
      expect(res.id).toBe('rep_01');
      expect(res.status).toBe('PENDING');
    });
  });

  describe('listReports', () => {
    it('should list moderation reports with pagination', async () => {
      reportsRepo.findMany.mockResolvedValue({
        items: [mockReport as any],
        total: 1,
      });

      const res = await service.listReports({ page: 1, limit: 10 });
      expect(res.items).toHaveLength(1);
      expect(res.total).toBe(1);
    });
  });

  describe('resolveReport', () => {
    it('should resolve report and suspend user when resolutionAction is USER_SUSPENDED', async () => {
      reportsRepo.findById.mockResolvedValue(mockReport as any);
      reportsRepo.updateResolution.mockResolvedValue({
        ...mockReport,
        status: 'RESOLVED',
        resolutionAction: 'USER_SUSPENDED',
        resolutionNotes: 'Suspended for 30 days',
        resolvedBy: 'user_admin',
        resolvedAt: new Date(),
      } as any);

      const res = await service.resolveReport(
        'rep_01',
        {
          resolutionAction: 'USER_SUSPENDED',
          resolutionNotes: 'Suspended for 30 days',
        },
        mockAdminUser,
      );

      expect(usersRepo.updateStatus).toHaveBeenCalledWith('user_target_01', 'SUSPENDED');
      expect(reportsRepo.updateResolution).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MODERATION_REPORT_RESOLVED',
          entityId: 'rep_01',
        }),
      );
      expect(res.resolutionAction).toBe('USER_SUSPENDED');
    });

    it('should resolve report and archive story when resolutionAction is CONTENT_REMOVED and target is STORY', async () => {
      const storyReport = {
        ...mockReport,
        targetType: 'STORY' as any,
        targetId: 'story_01',
      };

      reportsRepo.findById.mockResolvedValue(storyReport as any);
      reportsRepo.updateResolution.mockResolvedValue({
        ...storyReport,
        status: 'RESOLVED',
        resolutionAction: 'CONTENT_REMOVED',
        resolvedBy: 'user_admin',
        resolvedAt: new Date(),
      } as any);

      await service.resolveReport(
        'rep_01',
        {
          resolutionAction: 'CONTENT_REMOVED',
          resolutionNotes: 'Violates content standards',
        },
        mockAdminUser,
      );

      expect(contentRepo.updateStatus).toHaveBeenCalledWith('story_01', 'ARCHIVED');
      expect(auditService.log).toHaveBeenCalled();
    });
  });
});
