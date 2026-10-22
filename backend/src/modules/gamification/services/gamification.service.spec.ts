import { Test, TestingModule } from '@nestjs/testing';
import { GamificationService } from './gamification.service';
import { BadgesRepository } from '../repositories/badges.repository';
import { UserBadgesRepository } from '../repositories/user-badges.repository';
import { UserStreaksRepository } from '../repositories/user-streaks.repository';
import { XpLedgerRepository } from '../../interactive/repositories/xp-ledger.repository';
import { WatchHistoryRepository } from '../../engagement/repositories/watch-history.repository';
import { UserChoicesRepository } from '../../interactive/repositories/user-choices.repository';
import { DRIZZLE_DB } from '../../../database/database.service';

describe('GamificationService', () => {
  let service: GamificationService;
  let badgesRepo: jest.Mocked<BadgesRepository>;
  let userBadgesRepo: jest.Mocked<UserBadgesRepository>;
  let userStreaksRepo: jest.Mocked<UserStreaksRepository>;
  let xpLedgerRepo: jest.Mocked<XpLedgerRepository>;
  let watchHistoryRepo: jest.Mocked<WatchHistoryRepository>;
  let userChoicesRepo: jest.Mocked<UserChoicesRepository>;

  const mockUserId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';

  const mockBadges = [
    {
      id: '01ARZ3NDEKTSV4RRFFQ69GBD01',
      slug: 'FIRST_STEP',
      name: 'First Step',
      description: 'Watch your first interactive episode',
      category: 'WATCH',
      criteriaType: 'EPISODES_WATCHED',
      criteriaValue: 1,
      xpReward: 50,
      createdAt: new Date(),
    },
    {
      id: '01ARZ3NDEKTSV4RRFFQ69GBD02',
      slug: 'PATHFINDER',
      name: 'Pathfinder',
      description: 'Make your first choice',
      category: 'CHOICE',
      criteriaType: 'CHOICES_MADE',
      criteriaValue: 1,
      xpReward: 50,
      createdAt: new Date(),
    },
    {
      id: '01ARZ3NDEKTSV4RRFFQ69GBD03',
      slug: 'DAILY_DEVOTION',
      name: 'Daily Devotion',
      description: 'Reach a 3-day streak',
      category: 'STREAK',
      criteriaType: 'STREAK_DAYS',
      criteriaValue: 3,
      xpReward: 75,
      createdAt: new Date(),
    },
    {
      id: '01ARZ3NDEKTSV4RRFFQ69GBD04',
      slug: 'CENTURION',
      name: 'Centurion',
      description: 'Reach 500 XP',
      category: 'XP',
      criteriaType: 'XP_THRESHOLD',
      criteriaValue: 500,
      xpReward: 100,
      createdAt: new Date(),
    },
  ];

  beforeEach(async () => {
    const mockDbService = {
      getDb: jest.fn().mockReturnValue({}),
    };

    const mockBadgesRepo = {
      findAll: jest.fn().mockResolvedValue(mockBadges),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findByCategory: jest.fn(),
      create: jest.fn(),
      ensureDefaultBadges: jest.fn(),
    };

    const mockUserBadgesRepo = {
      create: jest.fn(),
      findByUserId: jest.fn().mockResolvedValue([]),
      hasBadge: jest.fn(),
      findUserBadgesWithDetails: jest.fn(),
    };

    const mockUserStreaksRepo = {
      findByUserId: jest.fn(),
      upsert: jest.fn(),
      getTopStreaks: jest.fn(),
    };

    const mockXpLedgerRepo = {
      create: jest.fn(),
      findByUserId: jest.fn().mockResolvedValue([]),
      findByUserActionAndReference: jest.fn(),
      hasAwarded: jest.fn(),
      getTotalXp: jest.fn().mockResolvedValue(0),
    };

    const mockWatchHistoryRepo = {
      create: jest.fn(),
      hasCompleted: jest.fn(),
      findByUser: jest.fn(),
      countByUser: jest.fn().mockResolvedValue(0),
    };

    const mockUserChoicesRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserAndChoice: jest.fn(),
      findByUserAndVersion: jest.fn(),
      countByOptionId: jest.fn(),
      countByUser: jest.fn().mockResolvedValue(0),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamificationService,
        { provide: DRIZZLE_DB, useValue: mockDbService },
        { provide: BadgesRepository, useValue: mockBadgesRepo },
        { provide: UserBadgesRepository, useValue: mockUserBadgesRepo },
        { provide: UserStreaksRepository, useValue: mockUserStreaksRepo },
        { provide: XpLedgerRepository, useValue: mockXpLedgerRepo },
        { provide: WatchHistoryRepository, useValue: mockWatchHistoryRepo },
        { provide: UserChoicesRepository, useValue: mockUserChoicesRepo },
      ],
    }).compile();

    service = module.get<GamificationService>(GamificationService);
    badgesRepo = module.get(BadgesRepository);
    userBadgesRepo = module.get(UserBadgesRepository);
    userStreaksRepo = module.get(UserStreaksRepository);
    xpLedgerRepo = module.get(XpLedgerRepository);
    watchHistoryRepo = module.get(WatchHistoryRepository);
    userChoicesRepo = module.get(UserChoicesRepository);
  });

  describe('recordDailyActivity', () => {
    it('should initialize Day 1 streak and award 25 XP when no streak record exists', async () => {
      userStreaksRepo.findByUserId.mockResolvedValue(null);

      const result = await service.recordDailyActivity(mockUserId);

      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(1);
      expect(result.isStreakExtended).toBe(true);
      expect(result.xpAwarded).toBe(25);
      expect(userStreaksRepo.upsert).toHaveBeenCalledWith(
        mockUserId,
        1,
        1,
        expect.any(String),
      );
      expect(xpLedgerRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          action: 'DAILY_STREAK',
          points: 25,
        }),
      );
    });

    it('should not extend streak if activity is already recorded for today', async () => {
      const todayStr = new Date().toISOString().slice(0, 10);
      userStreaksRepo.findByUserId.mockResolvedValue({
        id: '01ARZ3NDEKTSV4RRFFQ69G5ST1',
        userId: mockUserId,
        currentStreak: 3,
        longestStreak: 5,
        lastActivityDate: todayStr,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.recordDailyActivity(mockUserId);

      expect(result.currentStreak).toBe(3);
      expect(result.longestStreak).toBe(5);
      expect(result.isStreakExtended).toBe(false);
      expect(result.xpAwarded).toBe(0);
      expect(userStreaksRepo.upsert).not.toHaveBeenCalled();
      expect(xpLedgerRepo.create).not.toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DAILY_STREAK' }),
      );
    });


    it('should increment streak and award multiplier XP on consecutive days', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);

      userStreaksRepo.findByUserId.mockResolvedValue({
        id: '01ARZ3NDEKTSV4RRFFQ69G5ST1',
        userId: mockUserId,
        currentStreak: 2,
        longestStreak: 2,
        lastActivityDate: yesterdayStr,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.recordDailyActivity(mockUserId);

      expect(result.currentStreak).toBe(3);
      expect(result.longestStreak).toBe(3);
      expect(result.isStreakExtended).toBe(true);
      expect(result.xpAwarded).toBe(75); // 25 * 3
      expect(userStreaksRepo.upsert).toHaveBeenCalledWith(
        mockUserId,
        3,
        3,
        expect.any(String),
      );
    });

    it('should reset current streak to 1 if streak was broken (missed day)', async () => {
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const twoDaysAgoStr = twoDaysAgo.toISOString().slice(0, 10);

      userStreaksRepo.findByUserId.mockResolvedValue({
        id: '01ARZ3NDEKTSV4RRFFQ69G5ST1',
        userId: mockUserId,
        currentStreak: 5,
        longestStreak: 10,
        lastActivityDate: twoDaysAgoStr,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.recordDailyActivity(mockUserId);

      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(10); // preserves longest
      expect(result.isStreakExtended).toBe(true);
      expect(result.xpAwarded).toBe(25);
      expect(userStreaksRepo.upsert).toHaveBeenCalledWith(
        mockUserId,
        1,
        10,
        expect.any(String),
      );
    });
  });

  describe('evaluateBadges', () => {
    it('should unlock EPISODES_WATCHED badge and award bonus XP', async () => {
      watchHistoryRepo.countByUser.mockResolvedValue(1);
      userBadgesRepo.findByUserId.mockResolvedValue([]);

      const unlocked = await service.evaluateBadges(mockUserId);

      expect(unlocked).toHaveLength(1);
      expect(unlocked[0].slug).toBe('FIRST_STEP');
      expect(userBadgesRepo.create).toHaveBeenCalledWith(mockUserId, '01ARZ3NDEKTSV4RRFFQ69GBD01');
      expect(xpLedgerRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          action: 'BADGE_UNLOCKED',
          points: 50,
          referenceId: '01ARZ3NDEKTSV4RRFFQ69GBD01',
        }),
      );
    });

    it('should unlock CHOICES_MADE badge when choice count criteria is reached', async () => {
      userChoicesRepo.countByUser.mockResolvedValue(2);
      userBadgesRepo.findByUserId.mockResolvedValue([]);

      const unlocked = await service.evaluateBadges(mockUserId);

      expect(unlocked.some((b) => b.slug === 'PATHFINDER')).toBe(true);
    });

    it('should unlock XP_THRESHOLD badge when total XP is reached', async () => {
      xpLedgerRepo.getTotalXp.mockResolvedValue(600);
      userBadgesRepo.findByUserId.mockResolvedValue([]);

      const unlocked = await service.evaluateBadges(mockUserId);

      expect(unlocked.some((b) => b.slug === 'CENTURION')).toBe(true);
    });

    it('should skip badges that are already unlocked by user', async () => {
      watchHistoryRepo.countByUser.mockResolvedValue(5);
      userBadgesRepo.findByUserId.mockResolvedValue([
        {
          id: '01ARZ3NDEKTSV4RRFFQ69UB01',
          userId: mockUserId,
          badgeId: '01ARZ3NDEKTSV4RRFFQ69GBD01', // FIRST_STEP already unlocked
          unlockedAt: new Date(),
        },
      ]);

      const unlocked = await service.evaluateBadges(mockUserId);

      expect(unlocked.some((b) => b.slug === 'FIRST_STEP')).toBe(false);
      expect(userBadgesRepo.create).not.toHaveBeenCalledWith(mockUserId, '01ARZ3NDEKTSV4RRFFQ69GBD01');
    });
  });

  describe('getGamificationSummary', () => {
    it('should return complete user profile with badge stats and streak stats', async () => {
      xpLedgerRepo.getTotalXp.mockResolvedValue(300);
      userStreaksRepo.findByUserId.mockResolvedValue({
        id: '01ARZ3NDEKTSV4RRFFQ69G5ST1',
        userId: mockUserId,
        currentStreak: 4,
        longestStreak: 7,
        lastActivityDate: '2026-10-08',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      userBadgesRepo.findByUserId.mockResolvedValue([
        {
          id: '01ARZ3NDEKTSV4RRFFQ69UB01',
          userId: mockUserId,
          badgeId: '01ARZ3NDEKTSV4RRFFQ69GBD01',
          unlockedAt: new Date(),
        },
      ]);

      const summary = await service.getGamificationSummary(mockUserId);

      expect(summary.totalXp).toBe(300);
      expect(summary.currentStreak).toBe(4);
      expect(summary.longestStreak).toBe(7);
      expect(summary.badgesCount).toEqual({ total: 4, unlocked: 1 });
      expect(summary.badges).toHaveLength(4);
      expect(summary.badges.find((b) => b.slug === 'FIRST_STEP')?.isUnlocked).toBe(true);
      expect(summary.badges.find((b) => b.slug === 'CENTURION')?.isUnlocked).toBe(false);
    });
  });

  describe('getStreakLeaderboard', () => {
    it('should return ranked leaderboard items', async () => {
      userStreaksRepo.getTopStreaks.mockResolvedValue([
        {
          id: '01ARZ3NDEKTSV4RRFFQ69G5ST1',
          userId: 'user_1',
          currentStreak: 12,
          longestStreak: 15,
          lastActivityDate: '2026-10-08',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      xpLedgerRepo.getTotalXp.mockResolvedValue(1500);

      const leaderboard = await service.getStreakLeaderboard(5);

      expect(leaderboard).toHaveLength(1);
      expect(leaderboard[0]).toEqual({
        rank: 1,
        userId: 'user_1',
        totalXp: 1500,
        currentStreak: 12,
      });
    });
  });
});
