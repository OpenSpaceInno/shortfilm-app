import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreatorAnalyticsService } from './creator-analytics.service';
import { CreatorAnalyticsRepository } from '../repositories/creator-analytics.repository';
import { CreatorsRepository } from '../repositories/creators.repository';

describe('CreatorAnalyticsService', () => {
  let service: CreatorAnalyticsService;
  let analyticsRepo: jest.Mocked<CreatorAnalyticsRepository>;
  let creatorsRepo: jest.Mocked<CreatorsRepository>;

  const mockCreatorId = '01ARZ3NDEKTSV4RRFFQ69G5CR1';
  const mockUserId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';

  const mockCreator: any = {
    id: mockCreatorId,
    userId: mockUserId,
    displayName: 'Aarav Sharma',
    tier: 'EXCLUSIVE',
    status: 'ACTIVE',
  };

  const mockStories: any[] = [
    {
      id: 'story_1',
      creatorId: mockCreatorId,
      title: 'Neon Karma 2099',
      viewCount: 350000,
      contentRating: 'Sci-Fi · Thriller',
      status: 'PUBLISHED',
    },
    {
      id: 'story_2',
      creatorId: mockCreatorId,
      title: 'Midnight in Old Delhi',
      viewCount: 180000,
      contentRating: 'Mystery · Noir',
      status: 'PUBLISHED',
    },
  ];

  const mockEpisodes: any[] = [
    {
      id: 'ep_1',
      storyId: 'story_1',
      title: 'Chapter 1: The Glitch',
      episodeNumber: 1,
      seasonId: 'season_1',
    },
    {
      id: 'ep_2',
      storyId: 'story_1',
      title: 'Chapter 2: Neural Net',
      episodeNumber: 2,
      seasonId: 'season_1',
    },
    {
      id: 'ep_3',
      storyId: 'story_2',
      title: 'Act 1: Red Alley',
      episodeNumber: 1,
      seasonId: 'season_2',
    },
  ];

  beforeEach(async () => {
    const mockAnalyticsRepo = {
      getCreatorStories: jest.fn(),
      getEpisodesByStoryIds: jest.fn(),
      getFollowersCount: jest.fn(),
      getWatchProgressStats: jest.fn(),
      getEpisodeWatchCounts: jest.fn(),
      getInteractiveChoicesForStories: jest.fn(),
      getPredictionVotesCount: jest.fn(),
      getTotalGrossEarnings: jest.fn(),
    };

    const mockCreatorsRepo = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatorAnalyticsService,
        { provide: CreatorAnalyticsRepository, useValue: mockAnalyticsRepo },
        { provide: CreatorsRepository, useValue: mockCreatorsRepo },
      ],
    }).compile();

    service = module.get<CreatorAnalyticsService>(CreatorAnalyticsService);
    analyticsRepo = module.get(CreatorAnalyticsRepository);
    creatorsRepo = module.get(CreatorsRepository);
  });

  describe('getOverview', () => {
    it('should throw NotFoundException if creator does not exist', async () => {
      creatorsRepo.findById.mockResolvedValue(null);

      await expect(service.getOverview('non_existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return 11 core KPIs and monthly time series curves', async () => {
      creatorsRepo.findById.mockResolvedValue(mockCreator);
      analyticsRepo.getCreatorStories.mockResolvedValue(mockStories);
      analyticsRepo.getEpisodesByStoryIds.mockResolvedValue(mockEpisodes);
      analyticsRepo.getWatchProgressStats.mockResolvedValue({
        uniqueUsers: 95000,
        totalWatchSeconds: 42000000,
        completedCount: 82000,
        startedCount: 100000,
      });
      analyticsRepo.getFollowersCount.mockResolvedValue(6500);
      analyticsRepo.getPredictionVotesCount.mockResolvedValue(18500);
      analyticsRepo.getTotalGrossEarnings.mockResolvedValue('14500.50');

      const result = await service.getOverview(mockCreatorId, {});

      expect(result.creatorId).toBe(mockCreatorId);
      expect(result.displayName).toBe('Aarav Sharma');
      expect(result.totalStories).toBe(2);
      expect(result.totalViews).toBeGreaterThanOrEqual(530000);
      expect(result.uniqueViewers).toBeGreaterThanOrEqual(95000);
      expect(result.completionRate).toBe(82);
      expect(result.totalFollowers).toBe(6500);
      expect(result.predictionVotes).toBe(18500);
      expect(result.totalGrossRevenue).toBe('14500.50');
      expect(result.viewsOverTime).toHaveLength(6);
      expect(result.watchTimeOverTime).toHaveLength(6);
      expect(result.followerGrowthOverTime).toHaveLength(6);
    });

    it('should filter stats by storyId if query.storyId is provided', async () => {
      creatorsRepo.findById.mockResolvedValue(mockCreator);
      analyticsRepo.getCreatorStories.mockResolvedValue(mockStories);
      analyticsRepo.getEpisodesByStoryIds.mockResolvedValue([mockEpisodes[0], mockEpisodes[1]]);
      analyticsRepo.getWatchProgressStats.mockResolvedValue({
        uniqueUsers: 60000,
        totalWatchSeconds: 25000000,
        completedCount: 50000,
        startedCount: 60000,
      });
      analyticsRepo.getFollowersCount.mockResolvedValue(4200);
      analyticsRepo.getPredictionVotesCount.mockResolvedValue(9000);
      analyticsRepo.getTotalGrossEarnings.mockResolvedValue('8000.00');

      const result = await service.getOverview(mockCreatorId, { storyId: 'story_1' });

      expect(result.totalStories).toBe(1);
      expect(analyticsRepo.getEpisodesByStoryIds).toHaveBeenCalledWith(['story_1']);
    });
  });

  describe('getRetention', () => {
    it('should throw NotFoundException if creator does not exist', async () => {
      creatorsRepo.findById.mockResolvedValue(null);

      await expect(service.getRetention('non_existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return drop-off curves per story and within-episode quartiles', async () => {
      creatorsRepo.findById.mockResolvedValue(mockCreator);
      analyticsRepo.getCreatorStories.mockResolvedValue(mockStories);
      analyticsRepo.getEpisodesByStoryIds.mockResolvedValue(mockEpisodes);
      analyticsRepo.getEpisodeWatchCounts.mockResolvedValue({
        ep_1: { viewCount: 50000, completedCount: 45000 },
        ep_2: { viewCount: 42000, completedCount: 38000 },
        ep_3: { viewCount: 30000, completedCount: 26000 },
      });

      const result = await service.getRetention(mockCreatorId, {});

      expect(result.creatorId).toBe(mockCreatorId);
      expect(result.withinEpisodeQuartiles).toHaveLength(5);
      expect(result.storyDropOffCurves).toHaveLength(2);

      const story1Curve = result.storyDropOffCurves.find((c) => c.storyId === 'story_1');
      expect(story1Curve).toBeDefined();
      expect(story1Curve!.episodes).toHaveLength(2);
      expect(story1Curve!.episodes[0].retentionPercentage).toBe(100);
      expect(story1Curve!.episodes[1].viewCount).toBe(42000);
      expect(story1Curve!.episodes[1].dropOffRate).toBe(16);
    });

    it('should generate fallback retention curves if a story has no published episodes', async () => {
      creatorsRepo.findById.mockResolvedValue(mockCreator);
      analyticsRepo.getCreatorStories.mockResolvedValue([
        { id: 'story_empty', creatorId: mockCreatorId, title: 'Upcoming Series', viewCount: 20000 } as any,
      ]);
      analyticsRepo.getEpisodesByStoryIds.mockResolvedValue([]);
      analyticsRepo.getEpisodeWatchCounts.mockResolvedValue({});

      const result = await service.getRetention(mockCreatorId, {});

      expect(result.storyDropOffCurves).toHaveLength(1);
      expect(result.storyDropOffCurves[0].episodes).toHaveLength(6);
      expect(result.storyDropOffCurves[0].episodes[0].retentionPercentage).toBe(100);
    });
  });

  describe('getChoices', () => {
    it('should throw NotFoundException if creator does not exist', async () => {
      creatorsRepo.findById.mockResolvedValue(null);

      await expect(service.getChoices('non_existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should compute option splits and classify consensus (OVERWHELMING, DECISIVE, SPLIT)', async () => {
      creatorsRepo.findById.mockResolvedValue(mockCreator);
      analyticsRepo.getCreatorStories.mockResolvedValue(mockStories);
      analyticsRepo.getInteractiveChoicesForStories.mockResolvedValue([
        {
          choiceId: 'choice_1',
          prompt: 'Cut the red wire or blue wire?',
          storyId: 'story_1',
          storyTitle: 'Neon Karma 2099',
          optionId: 'opt_1',
          optionLabel: 'Cut red wire',
          voteCount: 850,
        },
        {
          choiceId: 'choice_1',
          prompt: 'Cut the red wire or blue wire?',
          storyId: 'story_1',
          storyTitle: 'Neon Karma 2099',
          optionId: 'opt_2',
          optionLabel: 'Cut blue wire',
          voteCount: 150,
        },
      ]);

      const result = await service.getChoices(mockCreatorId, {});

      expect(result.creatorId).toBe(mockCreatorId);
      expect(result.totalVotesCast).toBe(1000);
      expect(result.choicePoints).toHaveLength(1);

      const choice = result.choicePoints[0];
      expect(choice.choiceId).toBe('choice_1');
      expect(choice.consensusType).toBe('OVERWHELMING'); // 85% >= 80%
      expect(choice.options[0].isDominant).toBe(true);
      expect(choice.options[0].percentage).toBe(85);
      expect(choice.options[1].isDominant).toBe(false);
      expect(choice.options[1].percentage).toBe(15);
    });

    it('should return simulated interactive decisions if DB has no choice forks', async () => {
      creatorsRepo.findById.mockResolvedValue(mockCreator);
      analyticsRepo.getCreatorStories.mockResolvedValue(mockStories);
      analyticsRepo.getInteractiveChoicesForStories.mockResolvedValue([]);

      const result = await service.getChoices(mockCreatorId, {});

      expect(result.choicePoints.length).toBeGreaterThan(0);
      expect(result.totalVotesCast).toBe(32650);
      expect(result.choicePoints[0].consensusType).toBe('DECISIVE');
      expect(result.choicePoints[1].consensusType).toBe('SPLIT');
    });
  });

  describe('getStoryPerformance', () => {
    it('should throw NotFoundException if creator does not exist', async () => {
      creatorsRepo.findById.mockResolvedValue(null);

      await expect(service.getStoryPerformance('non_existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return ranking of creator catalog stories', async () => {
      creatorsRepo.findById.mockResolvedValue(mockCreator);
      analyticsRepo.getCreatorStories.mockResolvedValue(mockStories);
      analyticsRepo.getEpisodesByStoryIds.mockResolvedValue(mockEpisodes);
      analyticsRepo.getEpisodeWatchCounts.mockResolvedValue({});

      const result = await service.getStoryPerformance(mockCreatorId, {});

      expect(result.creatorId).toBe(mockCreatorId);
      expect(result.stories).toHaveLength(2);
      expect(result.stories[0].id).toBe('story_1');
      expect(result.stories[0].title).toBe('Neon Karma 2099');
      expect(result.stories[0].episodesCount).toBe(2);
      expect(result.stories[1].id).toBe('story_2');
      expect(result.stories[1].title).toBe('Midnight in Old Delhi');
      expect(result.stories[1].episodesCount).toBe(1);
    });
  });

  describe('Authenticated Creator Wrappers', () => {
    it('should throw ForbiddenException if user is not a creator', async () => {
      creatorsRepo.findByUserId.mockResolvedValue(null);

      await expect(service.getOverviewForUser(mockUserId)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.getRetentionForUser(mockUserId)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.getChoicesForUser(mockUserId)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.getStoryPerformanceForUser(mockUserId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should resolve analytics when user is a registered creator', async () => {
      creatorsRepo.findByUserId.mockResolvedValue(mockCreator);
      creatorsRepo.findById.mockResolvedValue(mockCreator);
      analyticsRepo.getCreatorStories.mockResolvedValue(mockStories);
      analyticsRepo.getEpisodesByStoryIds.mockResolvedValue(mockEpisodes);
      analyticsRepo.getWatchProgressStats.mockResolvedValue({
        uniqueUsers: 1000,
        totalWatchSeconds: 200000,
        completedCount: 800,
        startedCount: 1000,
      });
      analyticsRepo.getFollowersCount.mockResolvedValue(500);
      analyticsRepo.getPredictionVotesCount.mockResolvedValue(100);
      analyticsRepo.getTotalGrossEarnings.mockResolvedValue('500.00');

      const overview = await service.getOverviewForUser(mockUserId);
      expect(overview.creatorId).toBe(mockCreatorId);

      const retention = await service.getRetentionForUser(mockUserId);
      expect(retention.creatorId).toBe(mockCreatorId);

      analyticsRepo.getInteractiveChoicesForStories.mockResolvedValue([]);
      const choices = await service.getChoicesForUser(mockUserId);
      expect(choices.creatorId).toBe(mockCreatorId);

      const stories = await service.getStoryPerformanceForUser(mockUserId);
      expect(stories.creatorId).toBe(mockCreatorId);
    });
  });
});
