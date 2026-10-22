import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SocialService } from './social.service';
import { VotesRepository } from '../repositories/votes.repository';
import { PredictionsRepository } from '../repositories/predictions.repository';
import { FollowsRepository } from '../repositories/follows.repository';
import { ChoicesRepository } from '../../interactive/repositories/choices.repository';
import { ChoiceOptionsRepository } from '../../interactive/repositories/choice-options.repository';
import { StoriesRepository } from '../../content/repositories/stories.repository';
import { XpLedgerRepository } from '../../interactive/repositories/xp-ledger.repository';
import { GamificationService } from '../../gamification/services/gamification.service';
import { DRIZZLE_DB } from '../../../database/database.service';

describe('SocialService', () => {
  let service: SocialService;
  let votesRepo: jest.Mocked<VotesRepository>;
  let predictionsRepo: jest.Mocked<PredictionsRepository>;
  let followsRepo: jest.Mocked<FollowsRepository>;
  let choicesRepo: jest.Mocked<ChoicesRepository>;
  let choiceOptionsRepo: jest.Mocked<ChoiceOptionsRepository>;
  let storiesRepo: jest.Mocked<StoriesRepository>;
  let xpLedgerRepo: jest.Mocked<XpLedgerRepository>;
  let gamificationService: jest.Mocked<GamificationService>;

  const mockUserId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const mockChoiceId = '01ARZ3NDEKTSV4RRFFQ69G5CH1';
  const mockOptionId = '01ARZ3NDEKTSV4RRFFQ69G5OP1';
  const mockStoryId = '01ARZ3NDEKTSV4RRFFQ69G5ST1';

  beforeEach(async () => {
    const mockDbService = {
      getDb: jest.fn().mockReturnValue({
        transaction: jest.fn().mockImplementation(async (cb) => cb({})),
      }),
    };

    const mockVotesRepo = {
      create: jest.fn(),
      findByUserAndChoice: jest.fn(),
      getVoteCountsByChoice: jest.fn(),
      countTotalVotesForChoice: jest.fn(),
    };

    const mockPredictionsRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByStoryId: jest.fn(),
      findOptionsByPredictionId: jest.fn(),
      findUserPrediction: jest.fn(),
      createUserPrediction: jest.fn(),
      resolve: jest.fn(),
      markPredictionCorrect: jest.fn(),
      markPredictionIncorrect: jest.fn(),
      getCorrectPredictionsForResolution: jest.fn(),
      getPredictionOptionsWithCounts: jest.fn(),
    };

    const mockFollowsRepo = {
      create: jest.fn(),
      delete: jest.fn(),
      isFollowing: jest.fn(),
      countByTarget: jest.fn(),
      findByUserId: jest.fn(),
    };

    const mockChoicesRepo = {
      findById: jest.fn(),
      findByNodeId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockChoiceOptionsRepo = {
      findById: jest.fn(),
      findByChoiceId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockStoriesRepo = {
      findById: jest.fn(),
      create: jest.fn(),
      findPublished: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockXpLedgerRepo = {
      create: jest.fn(),
      findByUserId: jest.fn(),
      findByUserActionAndReference: jest.fn(),
      hasAwarded: jest.fn(),
      getTotalXp: jest.fn(),
    };

    const mockGamificationService = {
      recordDailyActivity: jest.fn().mockResolvedValue({} as any),
      evaluateBadges: jest.fn().mockResolvedValue([]),
      getGamificationSummary: jest.fn(),
      getAllBadges: jest.fn(),
      getStreakLeaderboard: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialService,
        { provide: DRIZZLE_DB, useValue: mockDbService },
        { provide: VotesRepository, useValue: mockVotesRepo },
        { provide: PredictionsRepository, useValue: mockPredictionsRepo },
        { provide: FollowsRepository, useValue: mockFollowsRepo },
        { provide: ChoicesRepository, useValue: mockChoicesRepo },
        { provide: ChoiceOptionsRepository, useValue: mockChoiceOptionsRepo },
        { provide: StoriesRepository, useValue: mockStoriesRepo },
        { provide: XpLedgerRepository, useValue: mockXpLedgerRepo },
        { provide: GamificationService, useValue: mockGamificationService },
      ],
    }).compile();

    service = module.get<SocialService>(SocialService);
    votesRepo = module.get(VotesRepository);
    predictionsRepo = module.get(PredictionsRepository);
    followsRepo = module.get(FollowsRepository);
    choicesRepo = module.get(ChoicesRepository);
    choiceOptionsRepo = module.get(ChoiceOptionsRepository);
    storiesRepo = module.get(StoriesRepository);
    xpLedgerRepo = module.get(XpLedgerRepository);
    gamificationService = module.get(GamificationService);
  });

  describe('submitVote', () => {
    it('should throw NotFoundException if choice does not exist', async () => {
      choicesRepo.findById.mockResolvedValue(null);

      await expect(
        service.submitVote(mockUserId, {
          choiceId: 'missing-choice',
          choiceOptionId: mockOptionId,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if voting window has expired', async () => {
      choicesRepo.findById.mockResolvedValue({
        id: mockChoiceId,
        votingEndsAt: new Date(Date.now() - 60000), // in the past
      } as any);

      await expect(
        service.submitVote(mockUserId, {
          choiceId: mockChoiceId,
          choiceOptionId: mockOptionId,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should record vote and award 20 XP on first vote', async () => {
      choicesRepo.findById.mockResolvedValue({
        id: mockChoiceId,
        votingEndsAt: new Date(Date.now() + 60000),
      } as any);
      choiceOptionsRepo.findById.mockResolvedValue({
        id: mockOptionId,
        choiceId: mockChoiceId,
      } as any);
      votesRepo.findByUserAndChoice.mockResolvedValue(null);

      votesRepo.create.mockResolvedValue({
        id: '01ARZ3NDEKTSV4RRFFQ69G5VT1',
        userId: mockUserId,
        choiceId: mockChoiceId,
        choiceOptionId: mockOptionId,
        createdAt: new Date(),
      });

      const result = await service.submitVote(mockUserId, {
        choiceId: mockChoiceId,
        choiceOptionId: mockOptionId,
      });

      expect(result.xpAwarded).toBe(20);
      expect(votesRepo.create).toHaveBeenCalledWith(
        mockUserId,
        mockChoiceId,
        mockOptionId,
        expect.anything(),
      );
      expect(xpLedgerRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          action: 'VOTE_CAST',
          points: 20,
          referenceId: mockChoiceId,
        }),
        expect.anything(),
      );
    });

    it('should return existing vote idempotently with 0 XP if already voted', async () => {
      choicesRepo.findById.mockResolvedValue({
        id: mockChoiceId,
        votingEndsAt: null,
      } as any);
      choiceOptionsRepo.findById.mockResolvedValue({
        id: mockOptionId,
        choiceId: mockChoiceId,
      } as any);

      votesRepo.findByUserAndChoice.mockResolvedValue({
        id: '01ARZ3NDEKTSV4RRFFQ69G5VT1',
        userId: mockUserId,
        choiceId: mockChoiceId,
        choiceOptionId: mockOptionId,
        createdAt: new Date(),
      });

      const result = await service.submitVote(mockUserId, {
        choiceId: mockChoiceId,
        choiceOptionId: mockOptionId,
      });

      expect(result.xpAwarded).toBe(0);
      expect(votesRepo.create).not.toHaveBeenCalled();
      expect(xpLedgerRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('getChoiceVoteStats', () => {
    it('should calculate percentages for choice options', async () => {
      choicesRepo.findById.mockResolvedValue({ id: mockChoiceId } as any);
      choiceOptionsRepo.findByChoiceId.mockResolvedValue([
        { id: 'opt_1', choiceId: mockChoiceId, label: 'Turn Left' } as any,
        { id: 'opt_2', choiceId: mockChoiceId, label: 'Turn Right' } as any,
      ]);
      votesRepo.getVoteCountsByChoice.mockResolvedValue([
        { optionId: 'opt_1', voteCount: 75 },
        { optionId: 'opt_2', voteCount: 25 },
      ]);

      const stats = await service.getChoiceVoteStats(mockChoiceId);

      expect(stats.totalVotes).toBe(100);
      expect(stats.options[0].percentage).toBe(75);
      expect(stats.options[1].percentage).toBe(25);
    });
  });

  describe('submitPrediction', () => {
    const mockPredId = '01ARZ3NDEKTSV4RRFFQ69G5PD1';

    it('should record user prediction and award 30 XP', async () => {
      predictionsRepo.findById.mockResolvedValue({
        id: mockPredId,
        status: 'OPEN',
        closesAt: new Date(Date.now() + 100000),
      } as any);
      predictionsRepo.findOptionsByPredictionId.mockResolvedValue([
        { id: 'pred_opt_1', predictionId: mockPredId, optionText: 'Hero Survives' } as any,
      ]);
      predictionsRepo.findUserPrediction.mockResolvedValue(null);
      predictionsRepo.createUserPrediction.mockResolvedValue({
        id: '01ARZ3NDEKTSV4RRFFQ69G5UP1',
        userId: mockUserId,
        predictionId: mockPredId,
        predictionOptionId: 'pred_opt_1',
        isCorrect: null,
        xpAwarded: 0,
        createdAt: new Date(),
      });

      const result = await service.submitPrediction(mockUserId, {
        predictionId: mockPredId,
        predictionOptionId: 'pred_opt_1',
      });

      expect(result.xpAwarded).toBe(30);
      expect(xpLedgerRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          action: 'PREDICTION_CREATED',
          points: 30,
          referenceId: mockPredId,
        }),
        expect.anything(),
      );
    });
  });

  describe('resolvePrediction', () => {
    const mockPredId = '01ARZ3NDEKTSV4RRFFQ69G5PD1';

    it('should award 50 XP to correct predictors', async () => {
      predictionsRepo.findById.mockResolvedValue({
        id: mockPredId,
        status: 'OPEN',
      } as any);
      predictionsRepo.findOptionsByPredictionId.mockResolvedValue([
        { id: 'opt_winner', predictionId: mockPredId, optionText: 'Hero Survives' } as any,
      ]);
      predictionsRepo.getCorrectPredictionsForResolution.mockResolvedValue([
        { id: 'up_1', userId: 'user_winner_1', predictionId: mockPredId } as any,
      ]);

      const result = await service.resolvePrediction(mockPredId, {
        winningOptionId: 'opt_winner',
      });

      expect(result.rewardedUsersCount).toBe(1);
      expect(predictionsRepo.resolve).toHaveBeenCalledWith(
        mockPredId,
        'opt_winner',
        expect.anything(),
      );
      expect(xpLedgerRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user_winner_1',
          action: 'PREDICTION_CORRECT',
          points: 50,
          referenceId: mockPredId,
        }),
        expect.anything(),
      );
    });
  });

  describe('follow', () => {
    it('should follow target and award 15 XP on first follow', async () => {
      followsRepo.isFollowing.mockResolvedValue(false);
      followsRepo.create.mockResolvedValue({
        id: '01ARZ3NDEKTSV4RRFFQ69G5FL1',
        userId: mockUserId,
        targetType: 'CREATOR',
        targetId: 'creator_1',
        createdAt: new Date(),
      });
      xpLedgerRepo.hasAwarded.mockResolvedValue(false);

      const result = await service.follow(mockUserId, {
        targetType: 'CREATOR',
        targetId: 'creator_1',
      });

      expect(result.xpAwarded).toBe(15);
      expect(followsRepo.create).toHaveBeenCalledWith(
        mockUserId,
        'CREATOR',
        'creator_1',
      );
      expect(xpLedgerRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          action: 'FOLLOW_TARGET',
          points: 15,
          referenceId: 'creator_1',
        }),
      );
    });

    it('should not award duplicate XP if already previously followed and re-following', async () => {
      followsRepo.isFollowing.mockResolvedValue(true);
      followsRepo.create.mockResolvedValue({
        id: '01ARZ3NDEKTSV4RRFFQ69G5FL1',
        userId: mockUserId,
        targetType: 'STORY',
        targetId: mockStoryId,
        createdAt: new Date(),
      });

      const result = await service.follow(mockUserId, {
        targetType: 'STORY',
        targetId: mockStoryId,
      });

      expect(result.xpAwarded).toBe(0);
      expect(xpLedgerRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('unfollow', () => {
    it('should remove follow record and return success', async () => {
      followsRepo.delete.mockResolvedValue(true);

      const result = await service.unfollow(mockUserId, 'CHARACTER', 'char_1');

      expect(result.success).toBe(true);
      expect(followsRepo.delete).toHaveBeenCalledWith(
        mockUserId,
        'CHARACTER',
        'char_1',
      );
    });
  });

  describe('getFollowStatus', () => {
    it('should return boolean following state and total count', async () => {
      followsRepo.isFollowing.mockResolvedValue(true);
      followsRepo.countByTarget.mockResolvedValue(42);

      const status = await service.getFollowStatus(mockUserId, 'CREATOR', 'creator_1');

      expect(status.isFollowing).toBe(true);
      expect(status.followerCount).toBe(42);
    });
  });
});
