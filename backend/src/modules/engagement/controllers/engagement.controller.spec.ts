import { Test, TestingModule } from '@nestjs/testing';
import { EngagementController } from './engagement.controller';
import { EngagementService } from '../services/engagement.service';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';

describe('EngagementController', () => {
  let controller: EngagementController;
  let service: jest.Mocked<EngagementService>;

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


  const mockEpisodeId = '01ARZ3NDEKTSV4RRFFQ69G5EP1';

  beforeEach(async () => {
    const mockEngagementService = {
      syncProgress: jest.fn(),
      getProgress: jest.fn(),
      getWatchHistory: jest.fn(),
      getContinueWatching: jest.fn(),
      getGamificationSummary: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EngagementController],
      providers: [{ provide: EngagementService, useValue: mockEngagementService }],
    }).compile();

    controller = module.get<EngagementController>(EngagementController);
    service = module.get(EngagementService);
  });

  describe('syncProgress', () => {
    it('should return ApiResponseDto wrapping sync result', async () => {
      const mockResult = {
        watchProgress: {
          id: '01ARZ3NDEKTSV4RRFFQ69G5WP1',
          userId: mockUser.id,
          episodeId: mockEpisodeId,
          progressSeconds: 60,
          completed: false,
          updatedAt: new Date(),
        },
        xpAwarded: 0,
      };

      service.syncProgress.mockResolvedValue(mockResult);

      const response = await controller.syncProgress(mockUser, {
        episodeId: mockEpisodeId,
        progressSeconds: 60,
        completed: false,
      });

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResult);
      expect(service.syncProgress).toHaveBeenCalledWith(mockUser.id, {
        episodeId: mockEpisodeId,
        progressSeconds: 60,
        completed: false,
      });
    });
  });

  describe('getProgress', () => {
    it('should return ApiResponseDto wrapping resume position', async () => {
      const mockResult = {
        watchProgress: {
          id: '01ARZ3NDEKTSV4RRFFQ69G5WP1',
          userId: mockUser.id,
          episodeId: mockEpisodeId,
          progressSeconds: 85,
          completed: false,
          updatedAt: new Date(),
        },
      };

      service.getProgress.mockResolvedValue(mockResult);

      const response = await controller.getProgress(mockUser, mockEpisodeId);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResult);
      expect(service.getProgress).toHaveBeenCalledWith(mockUser.id, mockEpisodeId);
    });
  });

  describe('getWatchHistory', () => {
    it('should return ApiResponseDto with history and pagination meta', async () => {
      const mockResult = {
        items: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      };

      service.getWatchHistory.mockResolvedValue(mockResult);

      const response = await controller.getWatchHistory(mockUser, { page: 1, limit: 20 });

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResult);
      expect(response.meta).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
    });
  });

  describe('getContinueWatching', () => {
    it('should return continue watching items', async () => {
      const mockResult = {
        items: [],
      };

      service.getContinueWatching.mockResolvedValue(mockResult);

      const response = await controller.getContinueWatching(mockUser, { limit: 10 });

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResult);
      expect(service.getContinueWatching).toHaveBeenCalledWith(mockUser.id, { limit: 10 });
    });
  });

  describe('getGamification', () => {
    it('should return gamification points summary', async () => {
      const mockResult = {
        totalXp: 250,
        streakDays: 0,
        badges: [],
        recentHistory: [],
      };

      service.getGamificationSummary.mockResolvedValue(mockResult);

      const response = await controller.getGamification(mockUser);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResult);
      expect(service.getGamificationSummary).toHaveBeenCalledWith(mockUser.id);
    });
  });
});
