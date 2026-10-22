import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
  Optional,
} from '@nestjs/common';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import { VotesRepository } from '../repositories/votes.repository';
import { PredictionsRepository } from '../repositories/predictions.repository';
import { FollowsRepository } from '../repositories/follows.repository';
import { ChoicesRepository } from '../../interactive/repositories/choices.repository';
import { ChoiceOptionsRepository } from '../../interactive/repositories/choice-options.repository';
import { StoriesRepository } from '../../content/repositories/stories.repository';
import { XpLedgerRepository } from '../../interactive/repositories/xp-ledger.repository';
import { GamificationService } from '../../gamification/services/gamification.service';
import {
  SubmitVoteDto,
  VoteResponseDto,
  ChoiceVoteStatsDto,
  CreatePredictionDto,
  SubmitPredictionDto,
  ResolvePredictionDto,
  PredictionResponseDto,
  CreateFollowDto,
  FollowResponseDto,
  FollowStatusDto,
} from '../dto';
import { FollowTargetType } from '../../../database/schema';
import { generateUlid } from '../../../database/utils/ulid.util';

@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);

  constructor(
    @Inject(DRIZZLE_DB) private readonly dbService: DatabaseService,
    private readonly votesRepo: VotesRepository,
    private readonly predictionsRepo: PredictionsRepository,
    private readonly followsRepo: FollowsRepository,
    private readonly choicesRepo: ChoicesRepository,
    private readonly choiceOptionsRepo: ChoiceOptionsRepository,
    private readonly storiesRepo: StoriesRepository,
    private readonly xpLedgerRepo: XpLedgerRepository,
    @Optional() private readonly gamificationService?: GamificationService,
  ) {}

  /**
   * Submit audience vote on a story choice point.
   * Awards 20 XP once per choice point.
   */
  async submitVote(userId: string, dto: SubmitVoteDto): Promise<VoteResponseDto> {
    const choice = await this.choicesRepo.findById(dto.choiceId);
    if (!choice) {
      throw new NotFoundException(`Choice with ID '${dto.choiceId}' not found`);
    }

    if (choice.votingEndsAt && choice.votingEndsAt < new Date()) {
      throw new BadRequestException('Voting for this choice dilemma has closed');
    }

    const option = await this.choiceOptionsRepo.findById(dto.choiceOptionId);
    if (!option || option.choiceId !== dto.choiceId) {
      throw new BadRequestException('Selected option does not belong to this choice');
    }

    // Idempotency: each user votes once per choice
    const existing = await this.votesRepo.findByUserAndChoice(userId, dto.choiceId);
    if (existing) {
      return {
        id: existing.id,
        userId: existing.userId,
        choiceId: existing.choiceId,
        choiceOptionId: existing.choiceOptionId,
        xpAwarded: 0,
        createdAt: existing.createdAt,
      };
    }

    let createdVote: any;
    const db = this.dbService.getDb();
    await db.transaction(async (tx) => {
      createdVote = await this.votesRepo.create(
        userId,
        dto.choiceId,
        dto.choiceOptionId,
        tx,
      );

      await this.xpLedgerRepo.create(
        {
          id: generateUlid(),
          userId,
          action: 'VOTE_CAST',
          points: 20,
          referenceId: dto.choiceId,
        },
        tx,
      );
    });

    if (this.gamificationService) {
      await this.gamificationService.recordDailyActivity(userId).catch(() => {});
    }

    return {
      id: createdVote.id,
      userId: createdVote.userId,
      choiceId: createdVote.choiceId,
      choiceOptionId: createdVote.choiceOptionId,
      xpAwarded: 20,
      createdAt: createdVote.createdAt,
    };
  }

  /**
   * Retrieve community poll breakdown for a choice point.
   */
  async getChoiceVoteStats(choiceId: string): Promise<ChoiceVoteStatsDto> {
    const choice = await this.choicesRepo.findById(choiceId);
    if (!choice) {
      throw new NotFoundException(`Choice with ID '${choiceId}' not found`);
    }

    const options = await this.choiceOptionsRepo.findByChoiceId(choiceId);
    const voteCounts = await this.votesRepo.getVoteCountsByChoice(choiceId);
    const countMap = new Map<string, number>();
    for (const v of voteCounts) {
      countMap.set(v.optionId, v.voteCount);
    }

    const totalVotes = options.reduce((sum, opt) => sum + (countMap.get(opt.id) || 0), 0);

    const optionStats = options.map((opt) => {
      const count = countMap.get(opt.id) || 0;
      const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
      return {
        optionId: opt.id,
        optionText: opt.label,
        voteCount: count,
        percentage,
      };
    });

    return {
      choiceId,
      totalVotes,
      options: optionStats,
    };
  }

  /**
   * Create narrative plot prediction question.
   */
  async createPrediction(dto: CreatePredictionDto) {
    const story = await this.storiesRepo.findById(dto.storyId);
    if (!story) {
      throw new NotFoundException(`Story with ID '${dto.storyId}' not found`);
    }

    const closesAtDate = new Date(dto.closesAt);
    if (isNaN(closesAtDate.getTime()) || closesAtDate <= new Date()) {
      throw new BadRequestException('closesAt must be a valid future timestamp');
    }

    return this.predictionsRepo.create(
      {
        storyId: dto.storyId,
        question: dto.question,
        closesAt: closesAtDate,
        revealEpisodeId: dto.revealEpisodeId || null,
        status: 'OPEN',
        winningOptionId: null,
      },
      dto.options,
    );
  }

  /**
   * Submit audience outcome prediction.
   * Awards 30 XP upon submission.
   */
  async submitPrediction(userId: string, dto: SubmitPredictionDto) {
    const prediction = await this.predictionsRepo.findById(dto.predictionId);
    if (!prediction) {
      throw new NotFoundException(`Prediction with ID '${dto.predictionId}' not found`);
    }

    if (prediction.status !== 'OPEN' || prediction.closesAt <= new Date()) {
      throw new BadRequestException('This prediction is closed for answers');
    }

    const options = await this.predictionsRepo.findOptionsByPredictionId(dto.predictionId);
    if (!options.some((o) => o.id === dto.predictionOptionId)) {
      throw new BadRequestException('Selected option does not belong to this prediction');
    }

    // Idempotency: user predicts once per prediction
    const existing = await this.predictionsRepo.findUserPrediction(
      userId,
      dto.predictionId,
    );
    if (existing) {
      return {
        id: existing.id,
        userId: existing.userId,
        predictionId: existing.predictionId,
        predictionOptionId: existing.predictionOptionId,
        isCorrect: existing.isCorrect,
        xpAwarded: 0,
        createdAt: existing.createdAt,
      };
    }

    let createdUserPred: any;
    const db = this.dbService.getDb();
    await db.transaction(async (tx) => {
      createdUserPred = await this.predictionsRepo.createUserPrediction(
        userId,
        dto.predictionId,
        dto.predictionOptionId,
        tx,
      );

      await this.xpLedgerRepo.create(
        {
          id: generateUlid(),
          userId,
          action: 'PREDICTION_CREATED',
          points: 30,
          referenceId: dto.predictionId,
        },
        tx,
      );
    });

    if (this.gamificationService) {
      await this.gamificationService.recordDailyActivity(userId).catch(() => {});
    }

    return {
      id: createdUserPred.id,
      userId: createdUserPred.userId,
      predictionId: createdUserPred.predictionId,
      predictionOptionId: createdUserPred.predictionOptionId,
      isCorrect: createdUserPred.isCorrect,
      xpAwarded: 30,
      createdAt: createdUserPred.createdAt,
    };
  }

  /**
   * Resolve prediction outcome and award 50 XP to correct audience predictors.
   */
  async resolvePrediction(predictionId: string, dto: ResolvePredictionDto) {
    const prediction = await this.predictionsRepo.findById(predictionId);
    if (!prediction) {
      throw new NotFoundException(`Prediction with ID '${predictionId}' not found`);
    }

    if (prediction.status !== 'OPEN') {
      throw new BadRequestException('Only OPEN predictions can be resolved');
    }

    const options = await this.predictionsRepo.findOptionsByPredictionId(predictionId);
    if (!options.some((o) => o.id === dto.winningOptionId)) {
      throw new BadRequestException('Winning option does not belong to this prediction');
    }

    const db = this.dbService.getDb();
    let rewardedCount = 0;

    await db.transaction(async (tx) => {
      await this.predictionsRepo.resolve(predictionId, dto.winningOptionId, tx);
      await this.predictionsRepo.markPredictionIncorrect(predictionId, dto.winningOptionId, tx);

      const winners = await this.predictionsRepo.getCorrectPredictionsForResolution(
        predictionId,
        dto.winningOptionId,
        tx,
      );

      rewardedCount = winners.length;

      for (const winner of winners) {
        await this.predictionsRepo.markPredictionCorrect(winner.id, 50, tx);
        await this.xpLedgerRepo.create(
          {
            id: generateUlid(),
            userId: winner.userId,
            action: 'PREDICTION_CORRECT',
            points: 50,
            referenceId: predictionId,
          },
          tx,
        );
      }
    });

    return {
      predictionId,
      winningOptionId: dto.winningOptionId,
      rewardedUsersCount: rewardedCount,
    };
  }

  /**
   * Retrieve active and past predictions for a story.
   */
  async getPredictionsForStory(
    storyId: string,
    userId?: string,
  ): Promise<PredictionResponseDto[]> {
    const predictionList = await this.predictionsRepo.findByStoryId(storyId);

    const results: PredictionResponseDto[] = [];
    for (const pred of predictionList) {
      const options = await this.predictionsRepo.getPredictionOptionsWithCounts(pred.id);
      let userPred: any = null;
      if (userId) {
        userPred = await this.predictionsRepo.findUserPrediction(userId, pred.id);
      }

      results.push({
        id: pred.id,
        storyId: pred.storyId,
        question: pred.question,
        status: pred.status,
        closesAt: pred.closesAt,
        winningOptionId: pred.winningOptionId,
        options: options.map((o) => ({
          id: o.id,
          optionText: o.optionText,
          voteCount: o.voteCount,
        })),
        userPrediction: userPred
          ? {
              predictionOptionId: userPred.predictionOptionId,
              isCorrect: userPred.isCorrect,
              xpAwarded: userPred.xpAwarded,
            }
          : null,
      });
    }

    return results;
  }

  /**
   * Follow a creator, character, or story.
   * Awards 15 XP upon first follow of a target.
   */
  async follow(userId: string, dto: CreateFollowDto): Promise<FollowResponseDto> {
    const isAlreadyFollowing = await this.followsRepo.isFollowing(
      userId,
      dto.targetType,
      dto.targetId,
    );

    const follow = await this.followsRepo.create(userId, dto.targetType, dto.targetId);

    let xpAwarded = 0;
    if (!isAlreadyFollowing) {
      const hasAwarded = await this.xpLedgerRepo.hasAwarded(
        userId,
        'FOLLOW_TARGET',
        dto.targetId,
      );
      if (!hasAwarded) {
        await this.xpLedgerRepo.create({
          id: generateUlid(),
          userId,
          action: 'FOLLOW_TARGET',
          points: 15,
          referenceId: dto.targetId,
        });
        xpAwarded = 15;
      }
    }

    if (this.gamificationService) {
      await this.gamificationService.recordDailyActivity(userId).catch(() => {});
    }

    return {
      id: follow.id,
      userId: follow.userId,
      targetType: follow.targetType,
      targetId: follow.targetId,
      xpAwarded,
      createdAt: follow.createdAt,
    };
  }

  /**
   * Unfollow a target.
   */
  async unfollow(userId: string, targetType: FollowTargetType, targetId: string) {
    await this.followsRepo.delete(userId, targetType, targetId);
    return { success: true };
  }

  /**
   * Check follow state and total followers count.
   */
  async getFollowStatus(
    userId: string,
    targetType: FollowTargetType,
    targetId: string,
  ): Promise<FollowStatusDto> {
    const isFollowing = await this.followsRepo.isFollowing(userId, targetType, targetId);
    const followerCount = await this.followsRepo.countByTarget(targetType, targetId);
    return {
      isFollowing,
      followerCount,
    };
  }

  /**
   * List all entities followed by user.
   */
  async getUserFollows(userId: string) {
    return this.followsRepo.findByUserId(userId);
  }
}
