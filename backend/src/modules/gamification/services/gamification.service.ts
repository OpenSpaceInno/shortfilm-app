import { Injectable, Inject, Logger } from '@nestjs/common';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import { BadgesRepository } from '../repositories/badges.repository';
import { UserBadgesRepository } from '../repositories/user-badges.repository';
import { UserStreaksRepository } from '../repositories/user-streaks.repository';
import { XpLedgerRepository } from '../../interactive/repositories/xp-ledger.repository';
import { WatchHistoryRepository } from '../../engagement/repositories/watch-history.repository';
import { UserChoicesRepository } from '../../interactive/repositories/user-choices.repository';
import {
  BadgeDto,
  StreakActivityResponseDto,
  GamificationProfileDto,
  LeaderboardItemDto,
} from '../dto';
import { generateUlid } from '../../../database/utils/ulid.util';

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(
    @Inject(DRIZZLE_DB) private readonly dbService: DatabaseService,
    private readonly badgesRepo: BadgesRepository,
    private readonly userBadgesRepo: UserBadgesRepository,
    private readonly userStreaksRepo: UserStreaksRepository,
    private readonly xpLedgerRepo: XpLedgerRepository,
    private readonly watchHistoryRepo: WatchHistoryRepository,
    private readonly userChoicesRepo: UserChoicesRepository,
  ) {}

  /**
   * Record user engagement activity for UTC today.
   * Handles consecutive streak calculation and awards streak XP multipliers.
   */
  async recordDailyActivity(userId: string): Promise<StreakActivityResponseDto> {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const streakRecord = await this.userStreaksRepo.findByUserId(userId);

    let currentStreak = 1;
    let longestStreak = 1;
    let isStreakExtended = false;
    let xpAwarded = 0;

    if (!streakRecord) {
      currentStreak = 1;
      longestStreak = 1;
      isStreakExtended = true;
      xpAwarded = 25;

      await this.userStreaksRepo.upsert(userId, 1, 1, todayStr);
      await this.xpLedgerRepo.create({
        id: generateUlid(),
        userId,
        action: 'DAILY_STREAK',
        points: xpAwarded,
        referenceId: null,
      });
      this.logger.log(`Created Day 1 streak for user '${userId}', awarded 25 XP`);
    } else {
      if (streakRecord.lastActivityDate === todayStr) {
        currentStreak = streakRecord.currentStreak;
        longestStreak = streakRecord.longestStreak;
        isStreakExtended = false;
        xpAwarded = 0;
      } else if (streakRecord.lastActivityDate === yesterdayStr) {
        currentStreak = streakRecord.currentStreak + 1;
        longestStreak = Math.max(streakRecord.longestStreak, currentStreak);
        isStreakExtended = true;
        xpAwarded = 25 * currentStreak;

        await this.userStreaksRepo.upsert(userId, currentStreak, longestStreak, todayStr);
        await this.xpLedgerRepo.create({
          id: generateUlid(),
          userId,
          action: 'DAILY_STREAK',
          points: xpAwarded,
          referenceId: null,
        });
        this.logger.log(
          `Extended streak to Day ${currentStreak} for user '${userId}', awarded ${xpAwarded} XP`,
        );
      } else {
        // Streak broken
        currentStreak = 1;
        longestStreak = streakRecord.longestStreak;
        isStreakExtended = true;
        xpAwarded = 25;

        await this.userStreaksRepo.upsert(userId, 1, longestStreak, todayStr);
        await this.xpLedgerRepo.create({
          id: generateUlid(),
          userId,
          action: 'DAILY_STREAK',
          points: xpAwarded,
          referenceId: null,
        });
        this.logger.log(`Streak reset to Day 1 for user '${userId}', awarded 25 XP`);
      }
    }

    const newBadges = await this.evaluateBadges(userId);

    return {
      currentStreak,
      longestStreak,
      lastActivityDate: todayStr,
      isStreakExtended,
      xpAwarded,
      newBadges,
    };
  }

  /**
   * Evaluate unearned badge thresholds (XP, Streak, Choices, Episodes Watched).
   * Unlocks eligible badges and awards achievement bonus XP.
   */
  async evaluateBadges(userId: string): Promise<BadgeDto[]> {
    const [totalXp, streakRecord, episodesWatched, choicesCount, allBadges, userBadgesList] =
      await Promise.all([
        this.xpLedgerRepo.getTotalXp(userId),
        this.userStreaksRepo.findByUserId(userId),
        this.watchHistoryRepo.countByUser(userId),
        this.userChoicesRepo.countByUser(userId),
        this.badgesRepo.findAll(),
        this.userBadgesRepo.findByUserId(userId),
      ]);

    const currentStreak = streakRecord?.currentStreak || 0;
    const unlockedBadgeIds = new Set(userBadgesList.map((ub) => ub.badgeId));
    const newlyUnlocked: BadgeDto[] = [];

    for (const badge of allBadges) {
      if (unlockedBadgeIds.has(badge.id)) {
        continue;
      }

      let criteriaMet = false;

      switch (badge.criteriaType) {
        case 'XP_THRESHOLD':
          criteriaMet = totalXp >= badge.criteriaValue;
          break;
        case 'STREAK_DAYS':
          criteriaMet = currentStreak >= badge.criteriaValue;
          break;
        case 'EPISODES_WATCHED':
          criteriaMet = episodesWatched >= badge.criteriaValue;
          break;
        case 'CHOICES_MADE':
          criteriaMet = choicesCount >= badge.criteriaValue;
          break;
        default:
          criteriaMet = false;
      }

      if (criteriaMet) {
        await this.userBadgesRepo.create(userId, badge.id);

        if (badge.xpReward > 0) {
          await this.xpLedgerRepo.create({
            id: generateUlid(),
            userId,
            action: 'BADGE_UNLOCKED',
            points: badge.xpReward,
            referenceId: badge.id,
          });
        }

        this.logger.log(`Unlocked badge '${badge.slug}' (${badge.name}) for user '${userId}'`);

        newlyUnlocked.push({
          id: badge.id,
          slug: badge.slug,
          name: badge.name,
          description: badge.description,
          iconUrl: badge.iconUrl,
          category: badge.category,
          criteriaType: badge.criteriaType,
          criteriaValue: badge.criteriaValue,
          xpReward: badge.xpReward,
          createdAt: badge.createdAt,
          isUnlocked: true,
          unlockedAt: new Date(),
        });
      }
    }

    return newlyUnlocked;
  }

  /**
   * Return full gamification status (lifetime XP, streak stats, badges collection).
   */
  async getGamificationSummary(userId: string): Promise<GamificationProfileDto> {
    const [totalXp, streakRecord, allBadges, userBadgesList, recentXp] = await Promise.all([
      this.xpLedgerRepo.getTotalXp(userId),
      this.userStreaksRepo.findByUserId(userId),
      this.badgesRepo.findAll(),
      this.userBadgesRepo.findByUserId(userId),
      this.xpLedgerRepo.findByUserId(userId, 20),
    ]);

    const unlockedMap = new Map<string, Date>();
    for (const ub of userBadgesList) {
      unlockedMap.set(ub.badgeId, ub.unlockedAt);
    }

    const badgeDtos: BadgeDto[] = allBadges.map((badge) => {
      const isUnlocked = unlockedMap.has(badge.id);
      return {
        id: badge.id,
        slug: badge.slug,
        name: badge.name,
        description: badge.description,
        iconUrl: badge.iconUrl,
        category: badge.category,
        criteriaType: badge.criteriaType,
        criteriaValue: badge.criteriaValue,
        xpReward: badge.xpReward,
        createdAt: badge.createdAt,
        isUnlocked,
        unlockedAt: isUnlocked ? unlockedMap.get(badge.id) : null,
      };
    });

    return {
      totalXp,
      currentStreak: streakRecord?.currentStreak || 0,
      longestStreak: streakRecord?.longestStreak || 0,
      lastActivityDate: streakRecord?.lastActivityDate || null,
      badgesCount: {
        total: allBadges.length,
        unlocked: userBadgesList.length,
      },
      badges: badgeDtos,
      recentXp: recentXp.map((r) => ({
        id: r.id,
        action: r.action,
        points: r.points,
        referenceId: r.referenceId,
        createdAt: r.createdAt,
      })),
    };
  }

  /**
   * Get all badges with unlocked state for the current user.
   */
  async getAllBadges(userId?: string): Promise<BadgeDto[]> {
    const allBadges = await this.badgesRepo.findAll();

    if (!userId) {
      return allBadges.map((b) => ({
        ...b,
        isUnlocked: false,
        unlockedAt: null,
      }));
    }

    const userBadgesList = await this.userBadgesRepo.findByUserId(userId);
    const unlockedMap = new Map<string, Date>();
    for (const ub of userBadgesList) {
      unlockedMap.set(ub.badgeId, ub.unlockedAt);
    }

    return allBadges.map((badge) => {
      const isUnlocked = unlockedMap.has(badge.id);
      return {
        id: badge.id,
        slug: badge.slug,
        name: badge.name,
        description: badge.description,
        iconUrl: badge.iconUrl,
        category: badge.category,
        criteriaType: badge.criteriaType,
        criteriaValue: badge.criteriaValue,
        xpReward: badge.xpReward,
        createdAt: badge.createdAt,
        isUnlocked,
        unlockedAt: isUnlocked ? unlockedMap.get(badge.id) : null,
      };
    });
  }

  /**
   * Get streak leaderboard.
   */
  async getStreakLeaderboard(limit = 10): Promise<LeaderboardItemDto[]> {
    const topStreaks = await this.userStreaksRepo.getTopStreaks(limit);

    const items: LeaderboardItemDto[] = [];
    let rank = 1;

    for (const streak of topStreaks) {
      const totalXp = await this.xpLedgerRepo.getTotalXp(streak.userId);
      items.push({
        rank: rank++,
        userId: streak.userId,
        totalXp,
        currentStreak: streak.currentStreak,
      });
    }

    return items;
  }
}
