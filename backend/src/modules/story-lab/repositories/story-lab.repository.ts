import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import { generateUlid } from '../../../database/utils/ulid.util';
import {
  storySignals,
  storyInsights,
  contentOpportunities,
  storyExperiments,
  experimentVariants,
  type StorySignal,
  type NewStorySignal,
  type StoryInsight,
  type NewStoryInsight,
  type ContentOpportunity,
  type NewContentOpportunity,
  type StoryExperiment,
  type NewStoryExperiment,
  type ExperimentVariant,
  type NewExperimentVariant,
  type InsightStatus,
  type OpportunityStatus,
  type ExperimentStatus,
} from '../../../database/schema/story-lab.schema';
import { stories, seasons, episodes } from '../../../database/schema/content.schema';
import {
  storyVersions,
  storyNodes,
  choices,
  choiceOptions,
  userChoices,
} from '../../../database/schema/interactive.schema';
import { watchProgress } from '../../../database/schema/engagement.schema';
import {
  QueryStorySignalsDto,
  QueryStoryInsightsDto,
  QueryContentOpportunitiesDto,
  QueryStoryExperimentsDto,
} from '../dto/query-story-lab.dto';

@Injectable()
export class StoryLabRepository {
  constructor(
    @Inject(DRIZZLE_DB)
    private readonly dbService: DatabaseService,
  ) {}

  private get db() {
    return this.dbService.getDb();
  }

  /**
   * Query detected story signals with optional filters
   */
  async findSignals(query: QueryStorySignalsDto): Promise<(StorySignal & { storyTitle?: string })[]> {
    const conditions = [];

    if (query.storyId) {
      conditions.push(eq(storySignals.storyId, query.storyId));
    }
    if (query.signalType) {
      conditions.push(eq(storySignals.signalType, query.signalType));
    }
    if (query.strength) {
      conditions.push(eq(storySignals.strength, query.strength));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await this.db
      .select({
        signal: storySignals,
        storyTitle: stories.title,
      })
      .from(storySignals)
      .leftJoin(stories, eq(storySignals.storyId, stories.id))
      .where(whereClause)
      .orderBy(desc(storySignals.detectedAt))
      .limit(query.limit ?? 50)
      .offset(query.offset ?? 0);

    return rows.map((r) => ({
      ...r.signal,
      storyTitle: r.storyTitle ?? undefined,
    }));
  }

  async findSignalById(id: string): Promise<StorySignal | null> {
    const [row] = await this.db
      .select()
      .from(storySignals)
      .where(eq(storySignals.id, id))
      .limit(1);
    return row ?? null;
  }

  async createSignal(data: Omit<NewStorySignal, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<StorySignal> {
    const id = data.id || generateUlid();
    await this.db.insert(storySignals).values({
      ...data,
      id,
    });
    const created = await this.findSignalById(id);
    return created!;
  }

  /**
   * Query story insights
   */
  async findInsights(query: QueryStoryInsightsDto): Promise<(StoryInsight & { storyTitle?: string })[]> {
    const conditions = [];

    if (query.storyId) {
      conditions.push(eq(storyInsights.storyId, query.storyId));
    }
    if (query.status) {
      conditions.push(eq(storyInsights.status, query.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await this.db
      .select({
        insight: storyInsights,
        storyTitle: stories.title,
      })
      .from(storyInsights)
      .leftJoin(stories, eq(storyInsights.storyId, stories.id))
      .where(whereClause)
      .orderBy(desc(storyInsights.createdAt))
      .limit(query.limit ?? 50)
      .offset(query.offset ?? 0);

    return rows.map((r) => ({
      ...r.insight,
      storyTitle: r.storyTitle ?? undefined,
    }));
  }

  async findInsightById(id: string): Promise<StoryInsight | null> {
    const [row] = await this.db
      .select()
      .from(storyInsights)
      .where(eq(storyInsights.id, id))
      .limit(1);
    return row ?? null;
  }

  async createInsight(data: Omit<NewStoryInsight, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<StoryInsight> {
    const id = data.id || generateUlid();
    await this.db.insert(storyInsights).values({
      ...data,
      id,
    });
    const created = await this.findInsightById(id);
    return created!;
  }

  async updateInsightStatus(id: string, status: InsightStatus, actionPlan?: string): Promise<StoryInsight | null> {
    const updateValues: Record<string, any> = { status, updatedAt: new Date() };
    if (actionPlan !== undefined) {
      updateValues.actionPlan = actionPlan;
    }

    await this.db.update(storyInsights).set(updateValues).where(eq(storyInsights.id, id));
    return this.findInsightById(id);
  }

  /**
   * Query content opportunities
   */
  async findOpportunities(query: QueryContentOpportunitiesDto): Promise<(ContentOpportunity & { storyTitle?: string })[]> {
    const conditions = [];

    if (query.storyId) {
      conditions.push(eq(contentOpportunities.storyId, query.storyId));
    }
    if (query.opportunityType) {
      conditions.push(eq(contentOpportunities.opportunityType, query.opportunityType));
    }
    if (query.status) {
      conditions.push(eq(contentOpportunities.status, query.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await this.db
      .select({
        opportunity: contentOpportunities,
        storyTitle: stories.title,
      })
      .from(contentOpportunities)
      .leftJoin(stories, eq(contentOpportunities.storyId, stories.id))
      .where(whereClause)
      .orderBy(desc(contentOpportunities.createdAt))
      .limit(query.limit ?? 50)
      .offset(query.offset ?? 0);

    return rows.map((r) => ({
      ...r.opportunity,
      storyTitle: r.storyTitle ?? undefined,
    }));
  }

  async findOpportunityById(id: string): Promise<ContentOpportunity | null> {
    const [row] = await this.db
      .select()
      .from(contentOpportunities)
      .where(eq(contentOpportunities.id, id))
      .limit(1);
    return row ?? null;
  }

  async createOpportunity(data: Omit<NewContentOpportunity, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<ContentOpportunity> {
    const id = data.id || generateUlid();
    await this.db.insert(contentOpportunities).values({
      ...data,
      id,
    });
    const created = await this.findOpportunityById(id);
    return created!;
  }

  async updateOpportunityStatus(id: string, status: OpportunityStatus, reviewerNotes?: string): Promise<ContentOpportunity | null> {
    const updateValues: Record<string, any> = { status, updatedAt: new Date() };
    if (reviewerNotes !== undefined) {
      updateValues.reviewerNotes = reviewerNotes;
    }

    await this.db.update(contentOpportunities).set(updateValues).where(eq(contentOpportunities.id, id));
    return this.findOpportunityById(id);
  }

  /**
   * Query experiments with variants
   */
  async findExperiments(query: QueryStoryExperimentsDto): Promise<(StoryExperiment & { storyTitle?: string; variants: ExperimentVariant[] })[]> {
    const conditions = [];

    if (query.storyId) {
      conditions.push(eq(storyExperiments.storyId, query.storyId));
    }
    if (query.status) {
      conditions.push(eq(storyExperiments.status, query.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const exps = await this.db
      .select({
        exp: storyExperiments,
        storyTitle: stories.title,
      })
      .from(storyExperiments)
      .leftJoin(stories, eq(storyExperiments.storyId, stories.id))
      .where(whereClause)
      .orderBy(desc(storyExperiments.createdAt))
      .limit(query.limit ?? 50)
      .offset(query.offset ?? 0);

    if (exps.length === 0) return [];

    const expIds = exps.map((e) => e.exp.id);
    const variants = await this.db
      .select()
      .from(experimentVariants)
      .where(inArray(experimentVariants.experimentId, expIds));

    return exps.map((e) => ({
      ...e.exp,
      storyTitle: e.storyTitle ?? undefined,
      variants: variants.filter((v) => v.experimentId === e.exp.id),
    }));
  }

  async findExperimentById(id: string): Promise<(StoryExperiment & { storyTitle?: string; variants: ExperimentVariant[] }) | null> {
    const [row] = await this.db
      .select({
        exp: storyExperiments,
        storyTitle: stories.title,
      })
      .from(storyExperiments)
      .leftJoin(stories, eq(storyExperiments.storyId, stories.id))
      .where(eq(storyExperiments.id, id))
      .limit(1);

    if (!row) return null;

    const variants = await this.db
      .select()
      .from(experimentVariants)
      .where(eq(experimentVariants.experimentId, id));

    return {
      ...row.exp,
      storyTitle: row.storyTitle ?? undefined,
      variants,
    };
  }

  /**
   * Create experiment along with its Control (A) and Candidate (B) variants atomically
   */
  async createExperimentWithVariants(
    expData: Omit<NewStoryExperiment, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
    variantA: Omit<NewExperimentVariant, 'id' | 'experimentId' | 'variantKey' | 'createdAt' | 'updatedAt'>,
    variantB: Omit<NewExperimentVariant, 'id' | 'experimentId' | 'variantKey' | 'createdAt' | 'updatedAt'>,
  ): Promise<StoryExperiment & { variants: ExperimentVariant[] }> {
    const expId = expData.id || generateUlid();
    const varAId = generateUlid();
    const varBId = generateUlid();

    return await this.db.transaction(async (tx) => {
      await tx.insert(storyExperiments).values({
        ...expData,
        id: expId,
      });

      await tx.insert(experimentVariants).values([
        {
          ...variantA,
          id: varAId,
          experimentId: expId,
          variantKey: 'A',
          trafficAllocationPct: 100 - (expData.splitPercentage ?? 50),
        },
        {
          ...variantB,
          id: varBId,
          experimentId: expId,
          variantKey: 'B',
          trafficAllocationPct: expData.splitPercentage ?? 50,
        },
      ]);

      const [createdExp] = await tx
        .select()
        .from(storyExperiments)
        .where(eq(storyExperiments.id, expId))
        .limit(1);

      const createdVariants = await tx
        .select()
        .from(experimentVariants)
        .where(eq(experimentVariants.experimentId, expId));

      return {
        ...createdExp,
        variants: createdVariants,
      };
    });
  }

  async updateExperiment(id: string, updates: Partial<StoryExperiment>): Promise<StoryExperiment | null> {
    await this.db
      .update(storyExperiments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(storyExperiments.id, id));

    const result = await this.findExperimentById(id);
    return result;
  }

  async recordVariantImpression(variantId: string): Promise<void> {
    await this.db
      .update(experimentVariants)
      .set({
        impressionsCount: sql`${experimentVariants.impressionsCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(experimentVariants.id, variantId));
  }

  async recordVariantCompletion(variantId: string): Promise<void> {
    await this.db
      .update(experimentVariants)
      .set({
        completionsCount: sql`${experimentVariants.completionsCount} + 1`,
        conversionRate: sql`(${experimentVariants.completionsCount} + 1) / GREATEST(${experimentVariants.impressionsCount}, 1)`,
        updatedAt: new Date(),
      })
      .where(eq(experimentVariants.id, variantId));
  }

  /**
   * Graph details for story node heatmaps & path clustering
   */
  async getStoryGraphDetails(storyId: string) {
    const storyEpisodes = await this.db
      .select({
        id: episodes.id,
        seasonId: episodes.seasonId,
        title: episodes.title,
        episodeNumber: episodes.episodeNumber,
        synopsis: episodes.synopsis,
        thumbnailUrl: episodes.thumbnailUrl,
        isFree: episodes.isFree,
        publishedAt: episodes.publishedAt,
        createdAt: episodes.createdAt,
        updatedAt: episodes.updatedAt,
      })
      .from(episodes)
      .innerJoin(seasons, eq(episodes.seasonId, seasons.id))
      .where(eq(seasons.storyId, storyId))
      .orderBy(episodes.episodeNumber);

    const [publishedVersion] = await this.db
      .select()
      .from(storyVersions)
      .where(and(eq(storyVersions.storyId, storyId), eq(storyVersions.status, 'PUBLISHED')))
      .limit(1);

    let nodes: typeof storyNodes.$inferSelect[] = [];
    let choiceList: typeof choices.$inferSelect[] = [];
    let optionList: typeof choiceOptions.$inferSelect[] = [];

    if (publishedVersion) {
      nodes = await this.db
        .select()
        .from(storyNodes)
        .where(eq(storyNodes.storyVersionId, publishedVersion.id))
        .orderBy(storyNodes.sequenceOrder);

      if (nodes.length > 0) {
        const nodeIds = nodes.map((n) => n.id);
        choiceList = await this.db
          .select()
          .from(choices)
          .where(inArray(choices.storyNodeId, nodeIds));

        if (choiceList.length > 0) {
          const choiceIds = choiceList.map((c) => c.id);
          optionList = await this.db
            .select()
            .from(choiceOptions)
            .where(inArray(choiceOptions.choiceId, choiceIds))
            .orderBy(choiceOptions.displayOrder);
        }
      }
    }

    return {
      episodes: storyEpisodes,
      version: publishedVersion ?? null,
      nodes,
      choices: choiceList,
      options: optionList,
    };
  }

  /**
   * Watch progress stats per episode for heatmap completion/drop-off
   */
  async getEpisodeWatchStats(storyId: string) {
    const epRows = await this.db
      .select({
        episodeId: episodes.id,
        episodeNumber: episodes.episodeNumber,
        title: episodes.title,
        totalViewers: sql<number>`COUNT(${watchProgress.id})`,
        completedViewers: sql<number>`SUM(CASE WHEN ${watchProgress.completed} = 1 THEN 1 ELSE 0 END)`,
        avgProgressSec: sql<number>`AVG(${watchProgress.progressSeconds})`,
      })
      .from(episodes)
      .innerJoin(seasons, eq(episodes.seasonId, seasons.id))
      .leftJoin(watchProgress, eq(episodes.id, watchProgress.episodeId))
      .where(eq(seasons.storyId, storyId))
      .groupBy(episodes.id, episodes.episodeNumber, episodes.title)
      .orderBy(episodes.episodeNumber);

    return epRows;
  }

  /**
   * User choice decisions for path clustering
   */
  async getUserChoicesForStory(storyId: string) {
    const rows = await this.db
      .select({
        userId: userChoices.userId,
        choiceId: userChoices.choiceId,
        choiceOptionId: userChoices.choiceOptionId,
        isFallback: userChoices.isFallback,
        createdAt: userChoices.createdAt,
      })
      .from(userChoices)
      .innerJoin(choices, eq(userChoices.choiceId, choices.id))
      .innerJoin(storyNodes, eq(choices.storyNodeId, storyNodes.id))
      .innerJoin(storyVersions, eq(storyNodes.storyVersionId, storyVersions.id))
      .where(eq(storyVersions.storyId, storyId))
      .orderBy(userChoices.createdAt);

    return rows;
  }
}
