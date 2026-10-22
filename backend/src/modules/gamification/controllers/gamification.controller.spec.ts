import { Test, TestingModule } from '@nestjs/testing';
import { GamificationController } from './gamification.controller';
import { GamificationService } from '../services/gamification.service';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';

describe('GamificationController', () => {
  let controller: GamificationController;
  let service: jest.Mocked<GamificationService>;

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

  beforeEach(async () => {
    const mockGamificationService = {
      getGamificationSummary: jest.fn(),
      getAllBadges: jest.fn(),
      recordDailyActivity: jest.fn(),
      evaluateBadges: jest.fn(),
      getStreakLeaderboard: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GamificationController],
      providers: [{ provide: GamificationService, useValue: mockGamificationService }],
    }).compile();

    controller = module.get<GamificationController>(GamificationController);
    service = module.get(GamificationService);
  });

  describe('getProfile', () => {
    it('should return wrapped gamification summary profile', async () => {
      const mockProfile = {
        totalXp: 450,
        currentStreak: 3,
        longestStreak: 5,
        lastActivityDate: '2026-10-08',
        badgesCount: { total: 8, unlocked: 2 },
        badges: [],
        recentXp: [],
      };

      service.getGamificationSummary.mockResolvedValue(mockProfile);

      const response = await controller.getProfile(mockUser);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockProfile);
      expect(service.getGamificationSummary).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('getBadges', () => {
    it('should return catalog of badges with user unlocked state', async () => {
      const mockBadges = [
        {
          id: '01ARZ3NDEKTSV4RRFFQ69GBD01',
          slug: 'FIRST_STEP',
          name: 'First Step',
          description: 'Watch first episode',
          category: 'WATCH',
          criteriaType: 'EPISODES_WATCHED',
          criteriaValue: 1,
          xpReward: 50,
          createdAt: new Date(),
          isUnlocked: true,
          unlockedAt: new Date(),
        },
      ];

      service.getAllBadges.mockResolvedValue(mockBadges);

      const response = await controller.getBadges(mockUser);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockBadges);
      expect(service.getAllBadges).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('pingActivity', () => {
    it('should record activity and return streak update result', async () => {
      const mockResult = {
        currentStreak: 2,
        longestStreak: 2,
        lastActivityDate: '2026-10-08',
        isStreakExtended: true,
        xpAwarded: 50,
        newBadges: [],
      };

      service.recordDailyActivity.mockResolvedValue(mockResult);

      const response = await controller.pingActivity(mockUser);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResult);
      expect(service.recordDailyActivity).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('evaluateBadges', () => {
    it('should trigger badge evaluation and return newly unlocked badges', async () => {
      const mockNewBadges = [
        {
          id: '01ARZ3NDEKTSV4RRFFQ69GBD01',
          slug: 'FIRST_STEP',
          name: 'First Step',
          description: 'Watch first episode',
          category: 'WATCH',
          criteriaType: 'EPISODES_WATCHED',
          criteriaValue: 1,
          xpReward: 50,
          createdAt: new Date(),
          isUnlocked: true,
          unlockedAt: new Date(),
        },
      ];

      service.evaluateBadges.mockResolvedValue(mockNewBadges);

      const response = await controller.evaluateBadges(mockUser);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockNewBadges);
      expect(service.evaluateBadges).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard items with default or specified limit', async () => {
      const mockLeaderboard = [
        {
          rank: 1,
          userId: 'user_1',
          totalXp: 2000,
          currentStreak: 10,
        },
      ];

      service.getStreakLeaderboard.mockResolvedValue(mockLeaderboard);

      const response = await controller.getLeaderboard(5);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockLeaderboard);
      expect(service.getStreakLeaderboard).toHaveBeenCalledWith(5);
    });
  });
});
