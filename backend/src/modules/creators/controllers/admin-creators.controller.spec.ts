import { Test, TestingModule } from '@nestjs/testing';
import { AdminCreatorsController } from './admin-creators.controller';
import { CreatorsService } from '../services/creators.service';
import { CreatorEarningsService } from '../services/creator-earnings.service';
import { CreatorAnalyticsService } from '../services/creator-analytics.service';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';
import {
  ReviewCreatorApplicationDto,
  ReviewCreatorVerificationDto,
  UpdateCreatorStatusDto,
  UpdateCreatorTierDto,
  CreateCreatorInternalNoteDto,
} from '../dto';

describe('AdminCreatorsController', () => {
  let controller: AdminCreatorsController;
  let service: jest.Mocked<CreatorsService>;
  let earningsService: jest.Mocked<CreatorEarningsService>;
  let analyticsService: jest.Mocked<CreatorAnalyticsService>;

  const mockAdmin: AuthenticatedUser = {
    id: '01ARZ3NDEKTSV4RRFFQ69G5ADM',
    externalSubjectId: 'auth0|admin123',
    externalAuthProvider: 'AUTH0',
    email: 'admin@shortreel.com',
    displayName: 'Admin User',
    avatarUrl: null,
    status: 'ACTIVE',
    roles: ['SUPER_ADMIN'],
    permissions: [],
  };

  const mockCreatorId = '01ARZ3NDEKTSV4RRFFQ69G5CR1';
  const mockAppId = '01ARZ3NDEKTSV4RRFFQ69G5AP1';

  beforeEach(async () => {
    const mockCreatorsService = {
      getPublicCreators: jest.fn(),
      getAdminApplications: jest.fn(),
      getApplicationById: jest.fn(),
      reviewApplication: jest.fn(),
      reviewVerification: jest.fn(),
      updateCreatorStatus: jest.fn(),
      updateCreatorTier: jest.fn(),
      addInternalNote: jest.fn(),
      getInternalNotes: jest.fn(),
      getCreatorById: jest.fn(),
      getAdminSubmissions: jest.fn(),
      getSubmissionById: jest.fn(),
      reviewSubmission: jest.fn(),
    };

    const mockEarningsService = {
      runMonthlySettlement: jest.fn(),
      getAdminEarnings: jest.fn(),
      updateEarningsStatus: jest.fn(),
    };

    const mockAnalyticsService = {
      getOverview: jest.fn(),
      getRetention: jest.fn(),
      getChoices: jest.fn(),
      getStoryPerformance: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminCreatorsController],
      providers: [
        { provide: CreatorsService, useValue: mockCreatorsService },
        { provide: CreatorEarningsService, useValue: mockEarningsService },
        { provide: CreatorAnalyticsService, useValue: mockAnalyticsService },
      ],
    }).compile();

    controller = module.get<AdminCreatorsController>(AdminCreatorsController);
    service = module.get(CreatorsService);
    earningsService = module.get(CreatorEarningsService);
    analyticsService = module.get(CreatorAnalyticsService);
  });

  describe('listCreators', () => {
    it('should return wrapped creators list for admin', async () => {
      service.getPublicCreators.mockResolvedValue({ items: [], total: 0, hasMore: false });

      const response = await controller.listCreators({ limit: 20 });

      expect(response.success).toBe(true);
      expect(service.getPublicCreators).toHaveBeenCalledWith({ limit: 20 });
    });
  });

  describe('listApplications & getApplication', () => {
    it('should list applications', async () => {
      service.getAdminApplications.mockResolvedValue({ items: [], total: 0 });

      const response = await controller.listApplications('PENDING', 10, 0);

      expect(response.success).toBe(true);
      expect(service.getAdminApplications).toHaveBeenCalledWith({
        status: 'PENDING',
        limit: 10,
        offset: 0,
      });
    });

    it('should return application by id', async () => {
      const mockApp = {
        id: mockAppId,
        userId: 'user_1',
        applicantName: 'Applicant',
        creatorName: 'Studio',
        category: 'Drama',
        genres: [],
        languages: [],
        status: 'PENDING' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      service.getApplicationById.mockResolvedValue(mockApp);

      const response = await controller.getApplication(mockAppId);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockApp);
      expect(service.getApplicationById).toHaveBeenCalledWith(mockAppId);
    });
  });

  describe('reviewApplication', () => {
    it('should review application and return wrapped response', async () => {
      const dto: ReviewCreatorApplicationDto = {
        action: 'APPROVE',
        reviewerNotes: 'Approved for platform',
      };
      const mockResult = {
        id: mockAppId,
        userId: 'user_1',
        applicantName: 'Applicant',
        creatorName: 'Studio',
        category: 'Drama',
        genres: [],
        languages: [],
        status: 'APPROVED' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      service.reviewApplication.mockResolvedValue(mockResult);

      const response = await controller.reviewApplication(mockAdmin, mockAppId, dto);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResult);
      expect(service.reviewApplication).toHaveBeenCalledWith(mockAppId, mockAdmin.id, dto);
    });
  });

  describe('reviewVerification', () => {
    it('should review verification and return wrapped response', async () => {
      const dto: ReviewCreatorVerificationDto = {
        status: 'VERIFIED',
        reviewerNotes: 'Verified badge granted',
      };
      const mockResult = {
        id: 'verif_1',
        creatorId: mockCreatorId,
        status: 'VERIFIED' as const,
        createdAt: new Date(),
      };
      service.reviewVerification.mockResolvedValue(mockResult);

      const response = await controller.reviewVerification(mockAdmin, 'verif_1', dto);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResult);
      expect(service.reviewVerification).toHaveBeenCalledWith('verif_1', mockAdmin.id, dto);
    });
  });

  describe('updateStatus & updateTier', () => {
    it('should update creator status', async () => {
      const dto: UpdateCreatorStatusDto = {
        status: 'SUSPENDED',
        suspensionReason: 'Violation',
      };
      const mockCreator = {
        id: mockCreatorId,
        userId: 'user_1',
        displayName: 'Creator',
        tier: 'EMERGING' as const,
        status: 'SUSPENDED' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      service.updateCreatorStatus.mockResolvedValue(mockCreator);

      const response = await controller.updateStatus(mockCreatorId, dto);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockCreator);
      expect(service.updateCreatorStatus).toHaveBeenCalledWith(mockCreatorId, dto);
    });

    it('should update creator tier', async () => {
      const dto: UpdateCreatorTierDto = {
        tier: 'EXCLUSIVE',
      };
      const mockCreator = {
        id: mockCreatorId,
        userId: 'user_1',
        displayName: 'Creator',
        tier: 'EXCLUSIVE' as const,
        status: 'ACTIVE' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      service.updateCreatorTier.mockResolvedValue(mockCreator);

      const response = await controller.updateTier(mockCreatorId, dto);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockCreator);
      expect(service.updateCreatorTier).toHaveBeenCalledWith(mockCreatorId, dto);
    });
  });

  describe('internal notes', () => {
    it('should add and get notes', async () => {
      const noteDto: CreateCreatorInternalNoteDto = { note: 'Internal comment' };
      const mockNote = {
        id: 'note_1',
        creatorId: mockCreatorId,
        authorId: mockAdmin.id,
        note: 'Internal comment',
        createdAt: new Date(),
      };

      service.addInternalNote.mockResolvedValue(mockNote);
      service.getInternalNotes.mockResolvedValue([mockNote]);

      const addRes = await controller.addNote(mockAdmin, mockCreatorId, noteDto);
      expect(addRes.success).toBe(true);
      expect(service.addInternalNote).toHaveBeenCalledWith(mockCreatorId, mockAdmin.id, noteDto);

      const getRes = await controller.getNotes(mockCreatorId);
      expect(getRes.success).toBe(true);
      expect(getRes.data).toEqual([mockNote]);
      expect(service.getInternalNotes).toHaveBeenCalledWith(mockCreatorId);
    });
  });

  describe('editorial submissions review queue (M17)', () => {
    const mockSubmissionId = '01ARZ3NDEKTSV4RRFFQ69SUB01';

    it('should list submissions in review queue', async () => {
      const mockResult: any = {
        items: [],
        total: 0,
        hasMore: false,
      };
      service.getAdminSubmissions.mockResolvedValue(mockResult);

      const response = await controller.listSubmissions({ status: 'SUBMITTED', limit: 20 });

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResult);
      expect(service.getAdminSubmissions).toHaveBeenCalledWith({ status: 'SUBMITTED', limit: 20 });
    });

    it('should get full submission details by id', async () => {
      const mockResult: any = {
        id: mockSubmissionId,
        title: 'The Midnight Train',
        status: 'SUBMITTED',
      };
      service.getSubmissionById.mockResolvedValue(mockResult);

      const response = await controller.getSubmission(mockSubmissionId);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResult);
      expect(service.getSubmissionById).toHaveBeenCalledWith(mockSubmissionId, undefined, true);
    });

    it('should review submission (APPROVE, CHANGES_REQUESTED, etc.)', async () => {
      const mockResult: any = {
        id: mockSubmissionId,
        status: 'APPROVED',
      };
      service.reviewSubmission.mockResolvedValue(mockResult);

      const response = await controller.reviewSubmission(mockAdmin, mockSubmissionId, {
        action: 'APPROVED',
        reviewerNotes: 'Approved for production',
      });

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResult);
      expect(service.reviewSubmission).toHaveBeenCalledWith(
        mockAdmin.id,
        mockSubmissionId,
        { action: 'APPROVED', reviewerNotes: 'Approved for production' },
      );
    });
  });

  describe('Admin Creator Earnings (M19)', () => {
    it('runSettlement should trigger monthly settlement calculation', async () => {
      const mockResult: any = {
        periodMonth: '2026-09-01',
        creatorsProcessed: 5,
        totalGrossAmount: '75000.00',
        totalPlatformFees: '22500.00',
        totalTaxWithheld: '5250.00',
        totalNetPayout: '47250.00',
        statusBreakdown: { PENDING_PAYOUT: 5 },
        dryRun: false,
        executedAt: new Date(),
      };
      earningsService.runMonthlySettlement.mockResolvedValue(mockResult);

      const res = await controller.runSettlement(mockAdmin, {
        periodMonth: '2026-09-01',
      });
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockResult);
      expect(earningsService.runMonthlySettlement).toHaveBeenCalledWith(
        { periodMonth: '2026-09-01' },
        mockAdmin.id,
      );
    });

    it('listEarnings should return paginated list of creator earnings', async () => {
      const mockResult: any = {
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };
      earningsService.getAdminEarnings.mockResolvedValue(mockResult);

      const res = await controller.listEarnings({ page: 1, limit: 20 });
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockResult);
      expect(earningsService.getAdminEarnings).toHaveBeenCalledWith({ page: 1, limit: 20 });
    });

    it('updateEarningsStatus should transition earning status', async () => {
      const mockResult: any = {
        id: 'earn_1',
        status: 'PAID',
        payoutReference: 'RZP_123',
      };
      earningsService.updateEarningsStatus.mockResolvedValue(mockResult);

      const res = await controller.updateEarningsStatus(mockAdmin, 'earn_1', {
        status: 'PAID',
        payoutReference: 'RZP_123',
      });
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockResult);
      expect(earningsService.updateEarningsStatus).toHaveBeenCalledWith(
        'earn_1',
        { status: 'PAID', payoutReference: 'RZP_123' },
        mockAdmin.id,
      );
    });
  });

  describe('Admin Creator Analytics (M20)', () => {
    it('getCreatorAnalyticsOverview should return creator analytics for admin', async () => {
      const mockOverview: any = {
        creatorId: mockCreatorId,
        displayName: 'Creator Name',
        totalViews: 150000,
        uniqueViewers: 108000,
        watchTimeMinutes: 275000,
        watchTimeHours: 4583.3,
        completionRate: 84.5,
        avgEpisodeCompletion: 81.1,
        totalFollowers: 4200,
        engagementRate: 15.2,
        choiceParticipationRate: 88.4,
        predictionVotes: 14200,
        storyShares: 4800,
        returningViewersRate: 68.5,
        totalGrossRevenue: '1250.00',
        totalStories: 3,
        viewsOverTime: [],
        watchTimeOverTime: [],
        followerGrowthOverTime: [],
      };
      analyticsService.getOverview.mockResolvedValue(mockOverview);

      const res = await controller.getCreatorAnalyticsOverview(mockCreatorId, {});
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockOverview);
      expect(analyticsService.getOverview).toHaveBeenCalledWith(mockCreatorId, {});
    });

    it('getCreatorAnalytics should call overview as alias', async () => {
      const mockOverview: any = {
        creatorId: mockCreatorId,
        totalViews: 150000,
      };
      analyticsService.getOverview.mockResolvedValue(mockOverview);

      const res = await controller.getCreatorAnalytics(mockCreatorId, { storyId: 'story_1' });
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockOverview);
      expect(analyticsService.getOverview).toHaveBeenCalledWith(mockCreatorId, {
        storyId: 'story_1',
      });
    });

    it('getCreatorRetention should return retention analytics', async () => {
      const mockRetention: any = {
        creatorId: mockCreatorId,
        withinEpisodeQuartiles: [],
        storyDropOffCurves: [],
      };
      analyticsService.getRetention.mockResolvedValue(mockRetention);

      const res = await controller.getCreatorRetention(mockCreatorId, {});
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockRetention);
      expect(analyticsService.getRetention).toHaveBeenCalledWith(mockCreatorId, {});
    });

    it('getCreatorChoices should return choice analytics', async () => {
      const mockChoices: any = {
        creatorId: mockCreatorId,
        totalVotesCast: 32650,
        avgDecisionTimeSeconds: 8.5,
        choicePoints: [],
      };
      analyticsService.getChoices.mockResolvedValue(mockChoices);

      const res = await controller.getCreatorChoices(mockCreatorId, {});
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockChoices);
      expect(analyticsService.getChoices).toHaveBeenCalledWith(mockCreatorId, {});
    });

    it('getCreatorStoryPerformance should return content performance metrics', async () => {
      const mockPerformance: any = {
        creatorId: mockCreatorId,
        stories: [],
      };
      analyticsService.getStoryPerformance.mockResolvedValue(mockPerformance);

      const res = await controller.getCreatorStoryPerformance(mockCreatorId, {});
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockPerformance);
      expect(analyticsService.getStoryPerformance).toHaveBeenCalledWith(mockCreatorId, {});
    });
  });
});

