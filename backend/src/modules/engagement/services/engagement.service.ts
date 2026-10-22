import {
  Injectable,
  Inject,
  NotFoundException,
  Logger,
  Optional,
  forwardRef,
} from '@nestjs/common';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import { WatchProgressRepository } from '../repositories/watch-progress.repository';
import { WatchHistoryRepository } from '../repositories/watch-history.repository';
import { XpLedgerRepository } from '../../interactive/repositories/xp-ledger.repository';
import { EpisodesRepository } from '../../content/repositories/episodes.repository';
import { StoryNodesRepository } from '../../interactive/repositories/story-nodes.repository';
import { GamificationService } from '../../gamification/services/gamification.service';
import {
  SyncProgressDto,
  SyncProgressResponseDto,
  WatchHistoryQueryDto,
  WatchHistoryResponseDto,
  ContinueWatchingQueryDto,
  ContinueWatchingItemDto,
  GamificationSummaryDto,
} from '../dto';
import { WatchProgress } from '../../../database/schema';
import { generateUlid } from '../../../database/utils/ulid.util';

@Injectable()
export class EngagementService {
  private readonly logger = new Logger(EngagementService.name);

  constructor(
    @Inject(DRIZZLE_DB) private readonly dbService: DatabaseService,
    private readonly watchProgressRepo: WatchProgressRepository,
    private readonly watchHistoryRepo: WatchHistoryRepository,
    private readonly xpLedgerRepo: XpLedgerRepository,
    private readonly episodesRepo: EpisodesRepository,
    private readonly storyNodesRepo: StoryNodesRepository,
    @Optional()
    @Inject(forwardRef(() => GamificationService))
    private readonly gamificationService?: GamificationService,
  ) {}


  /**
   * Synchronize playback progress for a user and episode.
   * If completed = true:
   *   1. Records entry into watch_history (if not present).
   *   2. Awards 100 XP into xp_ledger exactly once per episode completion.
   */
  async syncProgress(userId: string, dto: SyncProgressDto): Promise<SyncProgressResponseDto> {
    const episode = await this.episodesRepo.findById(dto.episodeId);
    if (!episode) {
      throw new NotFoundException(`Episode with ID '${dto.episodeId}' not found`);
    }

    let updatedProgress: WatchProgress | null = null;
    let xpAwarded = 0;

    const db = this.dbService.getDb();
    await db.transaction(async (tx) => {
      // 1. Upsert progress state
      updatedProgress = await this.watchProgressRepo.upsert(
        userId,
        dto.episodeId,
        dto.progressSeconds,
        dto.completed,
        tx,
      );

      // 2. If completed, handle history and gamification
      if (dto.completed) {
        let storyVersionId = dto.storyVersionId || null;
        if (!storyVersionId) {
          const node = await this.storyNodesRepo.findByEpisodeId(dto.episodeId);
          if (node) {
            storyVersionId = node.storyVersionId;
          }
        }

        // Record in watch history if not recorded yet
        const hasHistory = await this.watchHistoryRepo.hasCompleted(userId, dto.episodeId, tx);
        if (!hasHistory) {
          await this.watchHistoryRepo.create(
            {
              userId,
              episodeId: dto.episodeId,
              storyVersionId,
            },
            tx,
          );
        }

        // Award 100 XP once per episode completion
        const alreadyAwarded = await this.xpLedgerRepo.hasAwarded(
          userId,
          'EPISODE_COMPLETED',
          dto.episodeId,
          tx,
        );

        if (!alreadyAwarded) {
          await this.xpLedgerRepo.create(
            {
              id: generateUlid(),
              userId,
              action: 'EPISODE_COMPLETED',
              points: 100,
              referenceId: dto.episodeId,
            },
            tx,
          );
          xpAwarded = 100;
          this.logger.log(
            `Awarded 100 XP to user '${userId}' for completing episode '${dto.episodeId}'`,
          );
        }
      }
    });

    return {
      watchProgress: {
        id: updatedProgress!.id,
        userId: updatedProgress!.userId,
        episodeId: updatedProgress!.episodeId,
        progressSeconds: updatedProgress!.progressSeconds,
        completed: updatedProgress!.completed,
        updatedAt: updatedProgress!.updatedAt,
      },
      xpAwarded,
    };
  }

  /**
   * Retrieve resume position and current watch progress for an episode.
   */
  async getProgress(userId: string, episodeId: string) {
    const episode = await this.episodesRepo.findById(episodeId);
    if (!episode) {
      throw new NotFoundException(`Episode with ID '${episodeId}' not found`);
    }

    const progress = await this.watchProgressRepo.findByUserAndEpisode(userId, episodeId);
    if (!progress) {
      return {
        watchProgress: null,
        episodeId,
        progressSeconds: 0,
        completed: false,
      };
    }

    return {
      watchProgress: {
        id: progress.id,
        userId: progress.userId,
        episodeId: progress.episodeId,
        progressSeconds: progress.progressSeconds,
        completed: progress.completed,
        updatedAt: progress.updatedAt,
      },
    };
  }

  /**
   * Paginated viewing history of completed nodes.
   */
  async getWatchHistory(
    userId: string,
    query: WatchHistoryQueryDto,
  ): Promise<WatchHistoryResponseDto> {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const { items, total } = await this.watchHistoryRepo.findByUser(userId, page, limit);
    const totalPages = Math.ceil(total / limit) || (total === 0 ? 0 : 1);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Continue watching feed for in-progress stories.
   */
  async getContinueWatching(
    userId: string,
    query: ContinueWatchingQueryDto,
  ): Promise<{ items: ContinueWatchingItemDto[] }> {
    const limit = query.limit || 10;
    const items = await this.watchProgressRepo.findContinueWatching(userId, limit);
    return { items };
  }

  /**
   * Gamification summary (total XP, streak days, badges and recent ledger entries).
   */
  async getGamificationSummary(userId: string): Promise<GamificationSummaryDto> {
    if (this.gamificationService) {
      const summary = await this.gamificationService.getGamificationSummary(userId);
      return {
        totalXp: summary.totalXp,
        streakDays: summary.currentStreak,
        badges: summary.badges.filter((b) => b.isUnlocked),
        recentHistory: summary.recentXp,
      };
    }

    const totalXp = await this.xpLedgerRepo.getTotalXp(userId);
    const recentHistory = await this.xpLedgerRepo.findByUserId(userId, 20);

    return {
      totalXp,
      streakDays: 0,
      badges: [],
      recentHistory: recentHistory.map((item) => ({
        id: item.id,
        action: item.action,
        points: item.points,
        referenceId: item.referenceId,
        createdAt: item.createdAt,
      })),
    };
  }
}

