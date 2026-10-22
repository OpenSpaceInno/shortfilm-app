import { Test, TestingModule } from '@nestjs/testing';
import { AdminSubmissionsService } from './admin-submissions.service';
import { CreatorsService } from '../../creators/services/creators.service';
import { AuditService } from './audit.service';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';

describe('AdminSubmissionsService', () => {
  let service: AdminSubmissionsService;
  let creatorsService: jest.Mocked<CreatorsService>;
  let auditService: jest.Mocked<AuditService>;

  const mockAdminUser: AuthenticatedUser = {
    id: 'user_admin',
    externalSubjectId: 'auth0|admin',
    externalAuthProvider: 'AUTH0',
    email: 'admin@shortreel.com',
    displayName: 'Admin User',
    avatarUrl: null,
    status: 'ACTIVE',
    roles: ['CONTENT_ADMIN'],
    permissions: [],
  };

  const mockSubmission = {
    id: 'sub_01',
    creatorId: 'creator_01',
    title: 'The Great Expedition',
    synopsis: 'A thrilling drama',
    submissionType: 'FULL_SERIES' as any,
    status: 'UNDER_REVIEW' as any,
    scriptUrl: 'https://cdn.example.com/script.pdf',
    videoPreviewUrl: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockCreatorsService = {
      getAdminSubmissions: jest.fn(),
      getSubmissionById: jest.fn(),
      reviewSubmission: jest.fn(),
    };

    const mockAudit = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminSubmissionsService,
        { provide: CreatorsService, useValue: mockCreatorsService },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<AdminSubmissionsService>(AdminSubmissionsService);
    creatorsService = module.get(CreatorsService);
    auditService = module.get(AuditService);
  });

  describe('listSubmissions', () => {
    it('should query submissions with pagination and filters', async () => {
      creatorsService.getAdminSubmissions.mockResolvedValue({
        items: [mockSubmission as any],
        total: 1,
        hasMore: false,
      });

      const res = await service.listSubmissions({ status: 'UNDER_REVIEW', page: 1, limit: 20 });
      expect(creatorsService.getAdminSubmissions).toHaveBeenCalledWith({
        status: 'UNDER_REVIEW',
        submissionType: undefined,
        creatorId: undefined,
        search: undefined,
        limit: 20,
        offset: 0,
      });
      expect(res.items).toHaveLength(1);
    });
  });

  describe('getSubmissionById', () => {
    it('should return submission detail', async () => {
      creatorsService.getSubmissionById.mockResolvedValue(mockSubmission as any);

      const res = await service.getSubmissionById('sub_01');
      expect(creatorsService.getSubmissionById).toHaveBeenCalledWith('sub_01', undefined, true);
      expect(res.id).toBe('sub_01');
    });
  });

  describe('approveSubmission', () => {
    it('should approve submission and log audit entry', async () => {
      creatorsService.getSubmissionById.mockResolvedValue(mockSubmission as any);
      creatorsService.reviewSubmission.mockResolvedValue({
        ...mockSubmission,
        status: 'APPROVED',
      } as any);

      const res = await service.approveSubmission(
        'sub_01',
        { notes: 'Great quality and adherence to guidelines', publishImmediately: false },
        mockAdminUser,
      );

      expect(creatorsService.reviewSubmission).toHaveBeenCalledWith('user_admin', 'sub_01', {
        action: 'APPROVED',
        reviewerNotes: 'Great quality and adherence to guidelines',
      });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SUBMISSION_APPROVED',
          entityId: 'sub_01',
        }),
      );
      expect(res.status).toBe('APPROVED');
    });

    it('should publish immediately when flag is true', async () => {
      creatorsService.getSubmissionById.mockResolvedValue(mockSubmission as any);
      creatorsService.reviewSubmission.mockResolvedValue({
        ...mockSubmission,
        status: 'PUBLISHED',
      } as any);

      const res = await service.approveSubmission(
        'sub_01',
        { publishImmediately: true },
        mockAdminUser,
      );

      expect(creatorsService.reviewSubmission).toHaveBeenCalledWith('user_admin', 'sub_01', {
        action: 'PUBLISHED',
        reviewerNotes: undefined,
      });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SUBMISSION_PUBLISHED',
        }),
      );
      expect(res.status).toBe('PUBLISHED');
    });
  });

  describe('rejectSubmission', () => {
    it('should reject submission with reason and notes', async () => {
      creatorsService.getSubmissionById.mockResolvedValue(mockSubmission as any);
      creatorsService.reviewSubmission.mockResolvedValue({
        ...mockSubmission,
        status: 'REJECTED',
      } as any);

      const res = await service.rejectSubmission(
        'sub_01',
        { reason: 'Copyright issue', feedback: 'Please verify audio rights' },
        mockAdminUser,
      );

      expect(creatorsService.reviewSubmission).toHaveBeenCalledWith('user_admin', 'sub_01', {
        action: 'REJECTED',
        reviewerNotes: 'Reason: Copyright issue - Please verify audio rights',
      });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SUBMISSION_REJECTED',
          entityId: 'sub_01',
        }),
      );
      expect(res.status).toBe('REJECTED');
    });
  });

  describe('requestChanges', () => {
    it('should request changes with feedback and required modifications checklist', async () => {
      creatorsService.getSubmissionById.mockResolvedValue(mockSubmission as any);
      creatorsService.reviewSubmission.mockResolvedValue({
        ...mockSubmission,
        status: 'CHANGES_REQUESTED',
      } as any);

      const res = await service.requestChanges(
        'sub_01',
        {
          feedback: 'Audio levels need adjustment',
          requiredModifications: ['Fix audio sync', 'Higher resolution thumbnail'],
        },
        mockAdminUser,
      );

      expect(creatorsService.reviewSubmission).toHaveBeenCalledWith('user_admin', 'sub_01', {
        action: 'CHANGES_REQUESTED',
        reviewerNotes: 'Audio levels need adjustment',
        checklist: {
          requiredModifications: ['Fix audio sync', 'Higher resolution thumbnail'],
        },
      });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SUBMISSION_CHANGES_REQUESTED',
          entityId: 'sub_01',
        }),
      );
      expect(res.status).toBe('CHANGES_REQUESTED');
    });
  });
});
