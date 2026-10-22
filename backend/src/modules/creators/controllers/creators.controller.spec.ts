import { Test, TestingModule } from '@nestjs/testing';
import { CreatorsController } from './creators.controller';
import { CreatorsService } from '../services/creators.service';
import { CreatorEarningsService } from '../services/creator-earnings.service';
import { CreatorAnalyticsService } from '../services/creator-analytics.service';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';
import {
  SubmitCreatorApplicationDto,
  UpdateCreatorProfileDto,
  SubmitCreatorVerificationDto,
} from '../dto';

describe('CreatorsController', () => {
  let controller: CreatorsController;
  let service: jest.Mocked<CreatorsService>;
  let earningsService: jest.Mocked<CreatorEarningsService>;
  let analyticsService: jest.Mocked<CreatorAnalyticsService>;

  const mockUser: AuthenticatedUser = {
    id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    externalSubjectId: 'auth0|123456',
    externalAuthProvider: 'AUTH0',
    email: 'test@shortreel.com',
    displayName: 'Test User',
    avatarUrl: null,
    status: 'ACTIVE',
    roles: ['USER'],
    permissions: [],
  };

  const mockCreatorId = '01ARZ3NDEKTSV4RRFFQ69G5CR1';

  beforeEach(async () => {
    const mockCreatorsService = {
      getPublicCreators: jest.fn(),
      getMyCreatorProfile: jest.fn(),
      updateMyCreatorProfile: jest.fn(),
      submitApplication: jest.fn(),
      getMyApplications: jest.fn(),
      submitVerification: jest.fn(),
      getCreatorById: jest.fn(),
      createSubmission: jest.fn(),
      getMySubmissions: jest.fn(),
      getSubmissionById: jest.fn(),
      updateSubmission: jest.fn(),
      submitSubmission: jest.fn(),
      getMyDashboard: jest.fn(),
      getMyStories: jest.fn(),
    };

    const mockEarningsService = {
      getCreatorEarnings: jest.fn(),
      getCreatorEarningsSummary: jest.fn(),
    };

    const mockAnalyticsService = {
      getOverviewForUser: jest.fn(),
      getRetentionForUser: jest.fn(),
      getChoicesForUser: jest.fn(),
      getStoryPerformanceForUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreatorsController],
      providers: [
        { provide: CreatorsService, useValue: mockCreatorsService },
        { provide: CreatorEarningsService, useValue: mockEarningsService },
        { provide: CreatorAnalyticsService, useValue: mockAnalyticsService },
      ],
    }).compile();

    controller = module.get<CreatorsController>(CreatorsController);
    service = module.get(CreatorsService);
    earningsService = module.get(CreatorEarningsService);
    analyticsService = module.get(CreatorAnalyticsService);
  });

  describe('getCreators', () => {
    it('should return wrapped paginated creators directory', async () => {
      const mockResult = {
        items: [],
        total: 0,
        hasMore: false,
      };

      service.getPublicCreators.mockResolvedValue(mockResult);

      const response = await controller.getCreators({ limit: 10, offset: 0 });

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResult);
      expect(service.getPublicCreators).toHaveBeenCalledWith({ limit: 10, offset: 0 });
    });
  });

  describe('getMyProfile', () => {
    it('should return wrapped authenticated creator profile', async () => {
      const mockResult = {
        id: mockCreatorId,
        userId: mockUser.id,
        displayName: 'Creator Name',
        tier: 'EMERGING' as const,
        status: 'ACTIVE' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      service.getMyCreatorProfile.mockResolvedValue(mockResult);

      const response = await controller.getMyProfile(mockUser);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResult);
      expect(service.getMyCreatorProfile).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('getMyDashboard', () => {
    it('should return wrapped unified creator studio dashboard', async () => {
      const mockDashboard = {
        registered: true,
        creator: { id: mockCreatorId, displayName: 'Creator Name' },
        metrics: {
          totalStories: 3,
          publishedStories: 2,
          inReviewSubmissions: 1,
          totalViews: 12000,
          followersCount: 450,
        },
        stories: [],
        submissions: [],
        earningsSummary: null,
        analyticsOverview: null,
      };

      service.getMyDashboard.mockResolvedValue(mockDashboard);

      const response = await controller.getMyDashboard(mockUser);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockDashboard);
      expect(service.getMyDashboard).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('getMyStories', () => {
    it('should return wrapped stories catalog for creator', async () => {
      const mockStories = [{ id: 'story-1', title: 'Story One' }];

      service.getMyStories.mockResolvedValue(mockStories);

      const response = await controller.getMyStories(mockUser);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockStories);
      expect(service.getMyStories).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('updateMyProfile', () => {
    it('should update profile and return wrapped response', async () => {
      const dto: UpdateCreatorProfileDto = {
        tagline: 'New tagline',
      };
      const mockResult = {
        id: mockCreatorId,
        userId: mockUser.id,
        displayName: 'Creator Name',
        tier: 'EMERGING' as const,
        status: 'ACTIVE' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      service.updateMyCreatorProfile.mockResolvedValue(mockResult);

      const response = await controller.updateMyProfile(mockUser, dto);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResult);
      expect(service.updateMyCreatorProfile).toHaveBeenCalledWith(mockUser.id, dto);
    });
  });

  describe('submitApplication', () => {
    it('should submit onboarding application', async () => {
      const dto: SubmitCreatorApplicationDto = {
        applicantName: 'John',
        creatorName: 'Studio John',
        category: 'Drama',
      };
      const mockResult = {
        id: 'app_1',
        userId: mockUser.id,
        applicantName: 'John',
        creatorName: 'Studio John',
        category: 'Drama',
        genres: [],
        languages: [],
        status: 'PENDING' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      service.submitApplication.mockResolvedValue(mockResult);

      const response = await controller.submitApplication(mockUser, dto);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResult);
      expect(service.submitApplication).toHaveBeenCalledWith(mockUser.id, dto);
    });
  });

  describe('getMyApplications', () => {
    it('should return list of user applications', async () => {
      service.getMyApplications.mockResolvedValue([]);

      const response = await controller.getMyApplications(mockUser);

      expect(response.success).toBe(true);
      expect(response.data).toEqual([]);
      expect(service.getMyApplications).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('submitVerification', () => {
    it('should submit verification document', async () => {
      const dto: SubmitCreatorVerificationDto = {
        documentType: 'ID_CARD',
        documentUrl: 'https://docs.com/id.pdf',
      };
      const mockResult = {
        id: 'verif_1',
        creatorId: mockCreatorId,
        status: 'PENDING' as const,
        createdAt: new Date(),
      };

      service.submitVerification.mockResolvedValue(mockResult);

      const response = await controller.submitVerification(mockUser, dto);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResult);
      expect(service.submitVerification).toHaveBeenCalledWith(mockUser.id, dto);
    });
  });

  describe('getCreatorById', () => {
    it('should return creator profile detail', async () => {
      const mockResult = {
        id: mockCreatorId,
        userId: mockUser.id,
        displayName: 'Creator Name',
        tier: 'EMERGING' as const,
        status: 'ACTIVE' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      service.getCreatorById.mockResolvedValue(mockResult);

      const response = await controller.getCreatorById(mockCreatorId);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResult);
      expect(service.getCreatorById).toHaveBeenCalledWith(mockCreatorId);
    });
  });

  describe('createSubmission', () => {
    it('should create submission draft and return wrapped response', async () => {
      const mockResult: any = {
        id: 'sub_1',
        creatorId: mockCreatorId,
        title: 'Pitch Title',
        status: 'DRAFT',
      };
      service.createSubmission.mockResolvedValue(mockResult);

      const response = await controller.createSubmission(mockUser, { title: 'Pitch Title' });

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResult);
      expect(service.createSubmission).toHaveBeenCalledWith(mockUser.id, { title: 'Pitch Title' });
    });
  });

  describe('getMySubmissions', () => {
    it('should return creator submissions list', async () => {
      const mockResult: any = {
        items: [],
        total: 0,
        hasMore: false,
      };
      service.getMySubmissions.mockResolvedValue(mockResult);

      const response = await controller.getMySubmissions(mockUser, { limit: 10 });

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResult);
      expect(service.getMySubmissions).toHaveBeenCalledWith(mockUser.id, { limit: 10 });
    });
  });

  describe('getSubmissionById', () => {
    it('should return submission detail for creator', async () => {
      const mockResult: any = {
        id: 'sub_1',
        creatorId: mockCreatorId,
        title: 'Pitch Title',
      };
      service.getSubmissionById.mockResolvedValue(mockResult);

      const response = await controller.getSubmissionById(mockUser, 'sub_1');

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResult);
      expect(service.getSubmissionById).toHaveBeenCalledWith('sub_1', mockUser.id, false);
    });
  });

  describe('updateSubmission', () => {
    it('should update submission and return wrapped response', async () => {
      const mockResult: any = {
        id: 'sub_1',
        title: 'Updated Title',
      };
      service.updateSubmission.mockResolvedValue(mockResult);

      const response = await controller.updateSubmission(mockUser, 'sub_1', { title: 'Updated Title' });

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResult);
      expect(service.updateSubmission).toHaveBeenCalledWith(mockUser.id, 'sub_1', { title: 'Updated Title' });
    });
  });

  describe('submitForReview', () => {
    it('should submit submission into review queue', async () => {
      const mockResult: any = {
        id: 'sub_1',
        status: 'SUBMITTED',
      };
      service.submitSubmission.mockResolvedValue(mockResult);

      const response = await controller.submitForReview(mockUser, 'sub_1');

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResult);
      expect(service.submitSubmission).toHaveBeenCalledWith(mockUser.id, 'sub_1');
    });
  });

  describe('Creator Earnings (M19)', () => {
    it('getMyEarnings should return paginated earnings ledger', async () => {
      const mockEarnings = {
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };
      earningsService.getCreatorEarnings.mockResolvedValue(mockEarnings as any);

      const res = await controller.getMyEarnings(mockUser, { page: 1, limit: 20 });
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockEarnings);
      expect(earningsService.getCreatorEarnings).toHaveBeenCalledWith(mockUser.id, {
        page: 1,
        limit: 20,
      });
    });

    it('getMyEarningsSummary should return summary metrics', async () => {
      const mockSummary = {
        creatorId: mockCreatorId,
        totalGross: '15000.00',
        totalNet: '9450.00',
        totalPaid: '0.00',
        pendingPayout: '9450.00',
        heldAmount: '0.00',
        currency: 'INR',
        lastSettlementMonth: '2026-09-01',
        lifetimePayoutsCount: 0,
      };
      earningsService.getCreatorEarningsSummary.mockResolvedValue(mockSummary);

      const res = await controller.getMyEarningsSummary(mockUser);
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockSummary);
      expect(earningsService.getCreatorEarningsSummary).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('Creator Analytics (M20)', () => {
    it('getMyAnalyticsOverview should return overview analytics for user', async () => {
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
      analyticsService.getOverviewForUser.mockResolvedValue(mockOverview);

      const res = await controller.getMyAnalyticsOverview(mockUser, {});
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockOverview);
      expect(analyticsService.getOverviewForUser).toHaveBeenCalledWith(mockUser.id, {});
    });

    it('getMyAnalytics should call overview as alias', async () => {
      const mockOverview: any = {
        creatorId: mockCreatorId,
        totalViews: 150000,
      };
      analyticsService.getOverviewForUser.mockResolvedValue(mockOverview);

      const res = await controller.getMyAnalytics(mockUser, { storyId: 'story_1' });
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockOverview);
      expect(analyticsService.getOverviewForUser).toHaveBeenCalledWith(mockUser.id, {
        storyId: 'story_1',
      });
    });

    it('getMyRetentionAnalytics should return retention curves', async () => {
      const mockRetention: any = {
        creatorId: mockCreatorId,
        withinEpisodeQuartiles: [],
        storyDropOffCurves: [],
      };
      analyticsService.getRetentionForUser.mockResolvedValue(mockRetention);

      const res = await controller.getMyRetentionAnalytics(mockUser, {});
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockRetention);
      expect(analyticsService.getRetentionForUser).toHaveBeenCalledWith(mockUser.id, {});
    });

    it('getMyChoiceAnalytics should return choice decision distributions', async () => {
      const mockChoices: any = {
        creatorId: mockCreatorId,
        totalVotesCast: 32650,
        avgDecisionTimeSeconds: 8.5,
        choicePoints: [],
      };
      analyticsService.getChoicesForUser.mockResolvedValue(mockChoices);

      const res = await controller.getMyChoiceAnalytics(mockUser, {});
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockChoices);
      expect(analyticsService.getChoicesForUser).toHaveBeenCalledWith(mockUser.id, {});
    });

    it('getMyStoryPerformance should return content performance ranking', async () => {
      const mockPerformance: any = {
        creatorId: mockCreatorId,
        stories: [],
      };
      analyticsService.getStoryPerformanceForUser.mockResolvedValue(mockPerformance);

      const res = await controller.getMyStoryPerformance(mockUser, {});
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockPerformance);
      expect(analyticsService.getStoryPerformanceForUser).toHaveBeenCalledWith(mockUser.id, {});
    });
  });
});

