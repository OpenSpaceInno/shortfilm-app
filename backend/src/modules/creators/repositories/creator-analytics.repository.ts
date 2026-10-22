import { Injectable, Inject } from '@nestjs/common';
import { eq, inArray, sql, and } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import {
  stories,
  seasons,
  episodes,
  watchProgress,
  follows,
  choices,
  choiceOptions,
  storyNodes,
  storyVersions,
  userPredictions,
  predictions,
  creatorEarnings,
  creators,
  Story,
  Episode,
} from '../../../database/schema';

@Injectable()
export class CreatorAnalyticsRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async getCreatorStories(creatorId: string): Promise<Story[]> {
    return this.db
      .select()
      .from(stories)
      .where(eq(stories.creatorId, creatorId));
  }

  async getEpisodesByStoryIds(
    storyIds: string[],
  ): Promise<Array<Episode & { storyId: string }>> {
    if (!storyIds.length) return [];
    const rows = await this.db
      .select({
        episode: episodes,
        storyId: seasons.storyId,
      })
      .from(episodes)
      .innerJoin(seasons, eq(episodes.seasonId, seasons.id))
      .where(inArray(seasons.storyId, storyIds))
      .orderBy(seasons.storyId, episodes.episodeNumber);

    return rows.map((r) => ({
      ...r.episode,
      storyId: r.storyId,
    }));
  }

  async getFollowersCount(creatorId: string): Promise<number> {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(
        and(
          eq(follows.targetType, 'CREATOR'),
          eq(follows.targetId, creatorId),
        ),
      );
    return Number(result?.count || 0);
  }

  async getWatchProgressStats(episodeIds: string[]): Promise<{
    uniqueUsers: number;
    totalWatchSeconds: number;
    completedCount: number;
    startedCount: number;
  }> {
    if (!episodeIds.length) {
      return { uniqueUsers: 0, totalWatchSeconds: 0, completedCount: 0, startedCount: 0 };
    }

    const [row] = await this.db
      .select({
        uniqueUsers: sql<number>`count(distinct ${watchProgress.userId})`,
        totalWatchSeconds: sql<number>`coalesce(sum(${watchProgress.progressSeconds}), 0)`,
        completedCount: sql<number>`coalesce(sum(case when ${watchProgress.completed} = true then 1 else 0 end), 0)`,
        startedCount: sql<number>`count(*)`,
      })
      .from(watchProgress)
      .where(inArray(watchProgress.episodeId, episodeIds));

    return {
      uniqueUsers: Number(row?.uniqueUsers || 0),
      totalWatchSeconds: Number(row?.totalWatchSeconds || 0),
      completedCount: Number(row?.completedCount || 0),
      startedCount: Number(row?.startedCount || 0),
    };
  }

  async getEpisodeWatchCounts(episodeIds: string[]): Promise<
    Record<string, { viewCount: number; completedCount: number }>
  > {
    if (!episodeIds.length) return {};

    const rows = await this.db
      .select({
        episodeId: watchProgress.episodeId,
        viewCount: sql<number>`count(*)`,
        completedCount: sql<number>`coalesce(sum(case when ${watchProgress.completed} = true then 1 else 0 end), 0)`,
      })
      .from(watchProgress)
      .where(inArray(watchProgress.episodeId, episodeIds))
      .groupBy(watchProgress.episodeId);

    const map: Record<string, { viewCount: number; completedCount: number }> = {};
    for (const r of rows) {
      map[r.episodeId] = {
        viewCount: Number(r.viewCount || 0),
        completedCount: Number(r.completedCount || 0),
      };
    }
    return map;
  }

  async getInteractiveChoicesForStories(storyIds: string[]): Promise<
    Array<{
      choiceId: string;
      prompt: string;
      storyId: string;
      storyTitle: string;
      optionId: string;
      optionLabel: string;
      voteCount: number;
    }>
  > {
    if (!storyIds.length) return [];

    const rows = await this.db
      .select({
        choiceId: choices.id,
        prompt: choices.prompt,
        storyId: stories.id,
        storyTitle: stories.title,
        optionId: choiceOptions.id,
        optionLabel: choiceOptions.label,
        voteCount: choiceOptions.voteCount,
      })
      .from(stories)
      .innerJoin(storyVersions, eq(stories.id, storyVersions.storyId))
      .innerJoin(storyNodes, eq(storyVersions.id, storyNodes.storyVersionId))
      .innerJoin(choices, eq(storyNodes.id, choices.storyNodeId))
      .innerJoin(choiceOptions, eq(choices.id, choiceOptions.choiceId))
      .where(inArray(stories.id, storyIds));

    return rows.map((r) => ({
      choiceId: r.choiceId,
      prompt: r.prompt,
      storyId: r.storyId,
      storyTitle: r.storyTitle,
      optionId: r.optionId,
      optionLabel: r.optionLabel,
      voteCount: Number(r.voteCount || 0),
    }));
  }

  async getPredictionVotesCount(storyIds: string[]): Promise<number> {
    if (!storyIds.length) return 0;

    const [row] = await this.db
      .select({
        totalVotes: sql<number>`count(*)`,
      })
      .from(predictions)
      .innerJoin(userPredictions, eq(predictions.id, userPredictions.predictionId))
      .where(inArray(predictions.storyId, storyIds));

    return Number(row?.totalVotes || 0);
  }

  async getTotalGrossEarnings(creatorId: string): Promise<string> {
    const [row] = await this.db
      .select({
        totalGross: sql<string>`coalesce(sum(${creatorEarnings.grossAmount}), '0.00')`,
      })
      .from(creatorEarnings)
      .where(eq(creatorEarnings.creatorId, creatorId));

    return parseFloat(row?.totalGross || '0').toFixed(2);
  }
}
