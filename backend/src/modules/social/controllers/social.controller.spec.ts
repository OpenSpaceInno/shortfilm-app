import { Test, TestingModule } from '@nestjs/testing';
import { SocialController } from './social.controller';
import { SocialService } from '../services/social.service';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';
import {
  SubmitVoteDto,
  SubmitPredictionDto,
  CreatePredictionDto,
  ResolvePredictionDto,
  CreateFollowDto,
  VoteResponseDto,
  ChoiceVoteStatsDto,
  FollowResponseDto,
} from '../dto';

describe('SocialController', () => {
  let controller: SocialController;
  let service: jest.Mocked<SocialService>;

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

  const mockChoiceId = '01ARZ3NDEKTSV4RRFFQ69G5CH1';
  const mockOptionId = '01ARZ3NDEKTSV4RRFFQ69G5OP1';
  const mockStoryId = '01ARZ3NDEKTSV4RRFFQ69G5ST1';
  const mockPredId = '01ARZ3NDEKTSV4RRFFQ69G5PD1';

  beforeEach(async () => {
    const mockSocialService = {
      submitVote: jest.fn(),
      getChoiceVoteStats: jest.fn(),
      submitPrediction: jest.fn(),
      getPredictionsForStory: jest.fn(),
      createPrediction: jest.fn(),
      resolvePrediction: jest.fn(),
      follow: jest.fn(),
      unfollow: jest.fn(),
      getFollowStatus: jest.fn(),
      getUserFollows: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SocialController],
      providers: [{ provide: SocialService, useValue: mockSocialService }],
    }).compile();

    controller = module.get<SocialController>(SocialController);
    service = module.get(SocialService);
  });

  describe('submitVote', () => {
    it('should submit vote and return wrapped response with XP awarded', async () => {
      const dto: SubmitVoteDto = {
        choiceId: mockChoiceId,
        choiceOptionId: mockOptionId,
      };
      const mockResult: VoteResponseDto = {
        id: 'vote_1',
        userId: mockUser.id,
        choiceId: mockChoiceId,
        choiceOptionId: mockOptionId,
        xpAwarded: 20,
        createdAt: new Date(),
      };

      service.submitVote.mockResolvedValue(mockResult);

      const response = await controller.submitVote(mockUser, dto);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResult);
      expect(service.submitVote).toHaveBeenCalledWith(mockUser.id, dto);
    });
  });

  describe('getChoiceVoteStats', () => {
    it('should return aggregated vote stats for a choice', async () => {
      const mockStats: ChoiceVoteStatsDto = {
        choiceId: mockChoiceId,
        totalVotes: 100,
        options: [
          { optionId: 'opt_1', optionText: 'Option A', voteCount: 60, percentage: 60 },
          { optionId: 'opt_2', optionText: 'Option B', voteCount: 40, percentage: 40 },
        ],
      };

      service.getChoiceVoteStats.mockResolvedValue(mockStats);

      const response = await controller.getChoiceVoteStats(mockChoiceId);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockStats);
      expect(service.getChoiceVoteStats).toHaveBeenCalledWith(mockChoiceId);
    });
  });

  describe('submitPrediction', () => {
    it('should submit prediction wager and return result', async () => {
      const dto: SubmitPredictionDto = {
        predictionId: mockPredId,
        predictionOptionId: 'pred_opt_1',
      };
      const mockResult = {
        id: 'up_1',
        userId: mockUser.id,
        predictionId: mockPredId,
        predictionOptionId: 'pred_opt_1',
        isCorrect: null,
        xpAwarded: 30,
        createdAt: new Date(),
      };

      service.submitPrediction.mockResolvedValue(mockResult);

      const response = await controller.submitPrediction(mockUser, dto);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResult);
      expect(service.submitPrediction).toHaveBeenCalledWith(mockUser.id, dto);
    });
  });

  describe('getStoryPredictions', () => {
    it('should return list of predictions for story', async () => {
      const mockPredictions = [
        {
          id: mockPredId,
          storyId: mockStoryId,
          question: 'Will protagonist survive?',
          status: 'OPEN' as const,
          closesAt: new Date(),
          totalPredictions: 10,
          userSelection: null,
          options: [],
        },
      ];

      service.getPredictionsForStory.mockResolvedValue(mockPredictions);

      const response = await controller.getStoryPredictions(mockUser, mockStoryId);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockPredictions);
      expect(service.getPredictionsForStory).toHaveBeenCalledWith(mockStoryId, mockUser.id);
    });
  });

  describe('createPrediction', () => {
    it('should allow creators/admins to create prediction', async () => {
      const dto: CreatePredictionDto = {
        storyId: mockStoryId,
        question: 'Who is the culprit?',
        closesAt: new Date(Date.now() + 86400000).toISOString(),
        options: ['Character A', 'Character B'],
      };
      const mockResult = {
        prediction: {
          id: mockPredId,
          storyId: mockStoryId,
          question: dto.question,
          status: 'OPEN' as const,
          revealEpisodeId: null,
          winningOptionId: null,
          closesAt: new Date(dto.closesAt),
          createdAt: new Date(),
        },
        options: [
          { id: 'opt_1', predictionId: mockPredId, optionText: 'Character A' },
          { id: 'opt_2', predictionId: mockPredId, optionText: 'Character B' },
        ],
      };

      service.createPrediction.mockResolvedValue(mockResult as any);

      const response = await controller.createPrediction(dto);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResult);
      expect(service.createPrediction).toHaveBeenCalledWith(dto);
    });
  });

  describe('resolvePrediction', () => {
    it('should resolve prediction and award XP to correct predictors', async () => {
      const dto: ResolvePredictionDto = {
        winningOptionId: 'opt_winner',
      };
      const mockResult = {
        predictionId: mockPredId,
        winningOptionId: 'opt_winner',
        rewardedUsersCount: 5,
      };

      service.resolvePrediction.mockResolvedValue(mockResult);

      const response = await controller.resolvePrediction(mockPredId, dto);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResult);
      expect(service.resolvePrediction).toHaveBeenCalledWith(mockPredId, dto);
    });
  });

  describe('follow', () => {
    it('should follow target entity and return follow response', async () => {
      const dto: CreateFollowDto = {
        targetType: 'CREATOR',
        targetId: 'creator_1',
      };
      const mockResult: FollowResponseDto = {
        id: 'fl_1',
        userId: mockUser.id,
        targetType: 'CREATOR',
        targetId: 'creator_1',
        xpAwarded: 15,
        createdAt: new Date(),
      };

      service.follow.mockResolvedValue(mockResult);

      const response = await controller.follow(mockUser, dto);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResult);
      expect(service.follow).toHaveBeenCalledWith(mockUser.id, dto);
    });
  });

  describe('unfollow', () => {
    it('should unfollow target entity and return success flag', async () => {
      service.unfollow.mockResolvedValue({ success: true });

      const response = await controller.unfollow(mockUser, 'CREATOR', 'creator_1');

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ success: true });
      expect(service.unfollow).toHaveBeenCalledWith(mockUser.id, 'CREATOR', 'creator_1');
    });
  });

  describe('getFollowStatus', () => {
    it('should return follow status and count', async () => {
      const mockStatus = {
        isFollowing: true,
        followerCount: 150,
      };

      service.getFollowStatus.mockResolvedValue(mockStatus);

      const response = await controller.getFollowStatus(mockUser, 'CREATOR', 'creator_1');

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockStatus);
      expect(service.getFollowStatus).toHaveBeenCalledWith(mockUser.id, 'CREATOR', 'creator_1');
    });
  });

  describe('getUserFollows', () => {
    it('should return list of targets followed by user', async () => {
      const mockFollows = [
        {
          id: 'fl_1',
          userId: mockUser.id,
          targetType: 'CREATOR' as const,
          targetId: 'creator_1',
          createdAt: new Date(),
        },
      ];

      service.getUserFollows.mockResolvedValue(mockFollows);

      const response = await controller.getUserFollows(mockUser);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockFollows);
      expect(service.getUserFollows).toHaveBeenCalledWith(mockUser.id);
    });
  });
});
