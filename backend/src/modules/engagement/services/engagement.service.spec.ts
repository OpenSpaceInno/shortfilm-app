import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EngagementService } from './engagement.service';
import { WatchProgressRepository } from '../repositories/watch-progress.repository';
import { WatchHistoryRepository } from '../repositories/watch-history.repository';
import { XpLedgerRepository } from '../../interactive/repositories/xp-ledger.repository';
import { EpisodesRepository } from '../../content/repositories/episodes.repository';
import { StoryNodesRepository } from '../../interactive/repositories/story-nodes.repository';
import { DRIZZLE_DB } from '../../../database/database.service';

describe('EngagementService', () => {
  let service: EngagementService;
  let watchProgressRepo: jest.Mocked<WatchProgressRepository>;
  let watchHistoryRepo: jest.Mocked<WatchHistoryRepository>;
  let xpLedgerRepo: jest.Mocked<XpLedgerRepository>;
  let episodesRepo: jest.Mocked<EpisodesRepository>;
  let storyNodesRepo: jest.Mocked<StoryNodesRepository>;
  let mockDbService: any;

  const mockUser = { id: '01ARZ3NDEKTSV4RRFFQ69G5FAV' };
  const mockEpisode = {
    id: '01ARZ3NDEKTSV4RRFFQ69G5EP1',
    seasonId: '01ARZ3NDEKTSV4RRFFQ69G5SE1',
    title: 'The Mysterious Caller',
    episodeNumber: 1,
    synopsis: 'A phone rings in the dead of night.',
    thumbnailUrl: 'https://cdn.example.com/thumb1.jpg',
    isFree: true,
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockDbService = {
      getDb: jest.fn().mockReturnValue({
        transaction: jest.fn().mockImplementation(async (cb) => cb({})),
      }),
    };

    const mockWatchProgressRepo = {
      upsert: jest.fn(),
      findByUserAndEpisode: jest.fn(),
      findContinueWatching: jest.fn(),
      deleteByUserAndEpisode: jest.fn(),
    };

    const mockWatchHistoryRepo = {
      create: jest.fn(),
      hasCompleted: jest.fn(),
      findByUser: jest.fn(),
    };

    const mockXpLedgerRepo = {
      create: jest.fn(),
      findByUserId: jest.fn(),
      findByUserActionAndReference: jest.fn(),
      hasAwarded: jest.fn(),
      getTotalXp: jest.fn(),
    };

    const mockEpisodesRepo = {
      findById: jest.fn(),
      create: jest.fn(),
      findBySeasonId: jest.fn(),
      countForSeason: jest.fn(),
      countForStory: jest.fn(),
    };

    const mockStoryNodesRepo = {
      findById: jest.fn(),
      findByVersionId: jest.fn(),
      findRootNode: jest.fn(),
      findByEpisodeId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EngagementService,
        { provide: DRIZZLE_DB, useValue: mockDbService },
        { provide: WatchProgressRepository, useValue: mockWatchProgressRepo },
        { provide: WatchHistoryRepository, useValue: mockWatchHistoryRepo },
        { provide: XpLedgerRepository, useValue: mockXpLedgerRepo },
        { provide: EpisodesRepository, useValue: mockEpisodesRepo },
        { provide: StoryNodesRepository, useValue: mockStoryNodesRepo },
      ],
    }).compile();

    service = module.get<EngagementService>(EngagementService);
    watchProgressRepo = module.get(WatchProgressRepository);
    watchHistoryRepo = module.get(WatchHistoryRepository);
    xpLedgerRepo = module.get(XpLedgerRepository);
    episodesRepo = module.get(EpisodesRepository);
    storyNodesRepo = module.get(StoryNodesRepository);
  });

  describe('syncProgress', () => {
    it('should throw NotFoundException if episode does not exist', async () => {
      episodesRepo.findById.mockResolvedValue(null);

      await expect(
        service.syncProgress(mockUser.id, {
          episodeId: 'nonexistent-ep',
          progressSeconds: 15,
          completed: false,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should upsert progress without completion reward when completed is false', async () => {
      episodesRepo.findById.mockResolvedValue(mockEpisode as any);
      watchProgressRepo.upsert.mockResolvedValue({
        id: '01ARZ3NDEKTSV4RRFFQ69G5WP1',
        userId: mockUser.id,
        episodeId: mockEpisode.id,
        progressSeconds: 45,
        completed: false,
        updatedAt: new Date(),
      });

      const result = await service.syncProgress(mockUser.id, {
        episodeId: mockEpisode.id,
        progressSeconds: 45,
        completed: false,
      });

      expect(watchProgressRepo.upsert).toHaveBeenCalledWith(
        mockUser.id,
        mockEpisode.id,
        45,
        false,
        expect.anything(),
      );
      expect(watchHistoryRepo.hasCompleted).not.toHaveBeenCalled();
      expect(xpLedgerRepo.hasAwarded).not.toHaveBeenCalled();
      expect(result.xpAwarded).toBe(0);
      expect(result.watchProgress.progressSeconds).toBe(45);
      expect(result.watchProgress.completed).toBe(false);
    });

    it('should award 100 XP and insert into watch_history on first completion', async () => {
      episodesRepo.findById.mockResolvedValue(mockEpisode as any);
      storyNodesRepo.findByEpisodeId.mockResolvedValue({
        id: '01ARZ3NDEKTSV4RRFFQ69G5SN1',
        storyVersionId: '01ARZ3NDEKTSV4RRFFQ69G5SV1',
      } as any);

      watchProgressRepo.upsert.mockResolvedValue({
        id: '01ARZ3NDEKTSV4RRFFQ69G5WP1',
        userId: mockUser.id,
        episodeId: mockEpisode.id,
        progressSeconds: 120,
        completed: true,
        updatedAt: new Date(),
      });

      watchHistoryRepo.hasCompleted.mockResolvedValue(false);
      watchHistoryRepo.create.mockResolvedValue({
        id: '01ARZ3NDEKTSV4RRFFQ69G5WH1',
        userId: mockUser.id,
        episodeId: mockEpisode.id,
        storyVersionId: '01ARZ3NDEKTSV4RRFFQ69G5SV1',
        watchedAt: new Date(),
      });

      xpLedgerRepo.hasAwarded.mockResolvedValue(false);
      xpLedgerRepo.create.mockResolvedValue({
        id: '01ARZ3NDEKTSV4RRFFQ69G5XP1',
        userId: mockUser.id,
        action: 'EPISODE_COMPLETED',
        points: 100,
        referenceId: mockEpisode.id,
        createdAt: new Date(),
      });

      const result = await service.syncProgress(mockUser.id, {
        episodeId: mockEpisode.id,
        progressSeconds: 120,
        completed: true,
      });

      expect(watchProgressRepo.upsert).toHaveBeenCalledWith(
        mockUser.id,
        mockEpisode.id,
        120,
        true,
        expect.anything(),
      );
      expect(watchHistoryRepo.create).toHaveBeenCalledWith(
        {
          userId: mockUser.id,
          episodeId: mockEpisode.id,
          storyVersionId: '01ARZ3NDEKTSV4RRFFQ69G5SV1',
        },
        expect.anything(),
      );
      expect(xpLedgerRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          action: 'EPISODE_COMPLETED',
          points: 100,
          referenceId: mockEpisode.id,
        }),
        expect.anything(),
      );
      expect(result.xpAwarded).toBe(100);
      expect(result.watchProgress.completed).toBe(true);
    });

    it('should NOT award duplicate XP or re-insert history if already completed', async () => {
      episodesRepo.findById.mockResolvedValue(mockEpisode as any);
      watchProgressRepo.upsert.mockResolvedValue({
        id: '01ARZ3NDEKTSV4RRFFQ69G5WP1',
        userId: mockUser.id,
        episodeId: mockEpisode.id,
        progressSeconds: 120,
        completed: true,
        updatedAt: new Date(),
      });

      watchHistoryRepo.hasCompleted.mockResolvedValue(true);
      xpLedgerRepo.hasAwarded.mockResolvedValue(true);

      const result = await service.syncProgress(mockUser.id, {
        episodeId: mockEpisode.id,
        progressSeconds: 120,
        completed: true,
      });

      expect(watchHistoryRepo.create).not.toHaveBeenCalled();
      expect(xpLedgerRepo.create).not.toHaveBeenCalled();
      expect(result.xpAwarded).toBe(0);
      expect(result.watchProgress.completed).toBe(true);
    });
  });

  describe('getProgress', () => {
    it('should throw NotFoundException if episode not found', async () => {
      episodesRepo.findById.mockResolvedValue(null);

      await expect(service.getProgress(mockUser.id, 'missing-ep')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return null watchProgress and 0 seconds if no progress exists yet', async () => {
      episodesRepo.findById.mockResolvedValue(mockEpisode as any);
      watchProgressRepo.findByUserAndEpisode.mockResolvedValue(null);

      const result = await service.getProgress(mockUser.id, mockEpisode.id);

      expect(result).toEqual({
        watchProgress: null,
        episodeId: mockEpisode.id,
        progressSeconds: 0,
        completed: false,
      });
    });

    it('should return existing watch progress when present', async () => {
      episodesRepo.findById.mockResolvedValue(mockEpisode as any);
      const updatedAt = new Date();
      watchProgressRepo.findByUserAndEpisode.mockResolvedValue({
        id: '01ARZ3NDEKTSV4RRFFQ69G5WP1',
        userId: mockUser.id,
        episodeId: mockEpisode.id,
        progressSeconds: 88,
        completed: false,
        updatedAt,
      });

      const result = await service.getProgress(mockUser.id, mockEpisode.id);

      expect(result.watchProgress).toEqual({
        id: '01ARZ3NDEKTSV4RRFFQ69G5WP1',
        userId: mockUser.id,
        episodeId: mockEpisode.id,
        progressSeconds: 88,
        completed: false,
        updatedAt,
      });
    });
  });

  describe('getWatchHistory', () => {
    it('should return paginated history with metadata', async () => {
      const mockItems = [
        {
          id: '01ARZ3NDEKTSV4RRFFQ69G5WH1',
          userId: mockUser.id,
          episodeId: mockEpisode.id,
          storyVersionId: '01ARZ3NDEKTSV4RRFFQ69G5SV1',
          watchedAt: new Date(),
          episode: {
            id: mockEpisode.id,
            title: mockEpisode.title,
            episodeNumber: 1,
            thumbnailUrl: mockEpisode.thumbnailUrl,
          },
        },
      ];

      watchHistoryRepo.findByUser.mockResolvedValue({
        items: mockItems,
        total: 1,
      });

      const result = await service.getWatchHistory(mockUser.id, { page: 1, limit: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });
  });

  describe('getContinueWatching', () => {
    it('should return continue watching feed from repository', async () => {
      const mockFeed = [
        {
          id: '01ARZ3NDEKTSV4RRFFQ69G5WP1',
          episodeId: mockEpisode.id,
          progressSeconds: 30,
          completed: false,
          updatedAt: new Date(),
          episode: {
            id: mockEpisode.id,
            title: mockEpisode.title,
            episodeNumber: 1,
            thumbnailUrl: mockEpisode.thumbnailUrl,
          },
        },
      ];

      watchProgressRepo.findContinueWatching.mockResolvedValue(mockFeed);

      const result = await service.getContinueWatching(mockUser.id, { limit: 5 });

      expect(result.items).toEqual(mockFeed);
      expect(watchProgressRepo.findContinueWatching).toHaveBeenCalledWith(mockUser.id, 5);
    });
  });

  describe('getGamificationSummary', () => {
    it('should aggregate total XP and return recent transactions', async () => {
      xpLedgerRepo.getTotalXp.mockResolvedValue(450);
      const createdAt = new Date();
      xpLedgerRepo.findByUserId.mockResolvedValue([
        {
          id: '01ARZ3NDEKTSV4RRFFQ69G5XP1',
          userId: mockUser.id,
          action: 'EPISODE_COMPLETED',
          points: 100,
          referenceId: mockEpisode.id,
          createdAt,
        },
      ]);

      const result = await service.getGamificationSummary(mockUser.id);

      expect(result.totalXp).toBe(450);
      expect(result.streakDays).toBe(0);
      expect(result.badges).toEqual([]);
      expect(result.recentHistory).toHaveLength(1);
      expect(result.recentHistory[0].points).toBe(100);
    });
  });
});
