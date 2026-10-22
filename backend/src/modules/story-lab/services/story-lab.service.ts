import { Injectable, Logger } from '@nestjs/common';
import { StoryLabRepository } from '../repositories/story-lab.repository';
import { ExperimentEngineService } from './experiment-engine.service';
import { NodeHeatmapService } from './node-heatmap.service';
import { NarrativeInsightService } from './narrative-insight.service';
import {
  QueryStorySignalsDto,
  QueryStoryInsightsDto,
  QueryContentOpportunitiesDto,
  QueryStoryExperimentsDto,
} from '../dto/query-story-lab.dto';
import { CreateExperimentDto } from '../dto/create-experiment.dto';
import { UpdateExperimentStatusDto, UpdateExperimentDto } from '../dto/update-experiment.dto';
import { AllocateVariantRequestDto } from '../dto/variant-allocation.dto';
import { UpdateInsightStatusDto, GenerateInsightsRequestDto } from '../dto/story-insights.dto';
import { UpdateOpportunityStatusDto } from '../dto/content-opportunity.dto';
import { type NewStorySignal } from '../../../database/schema/story-lab.schema';

@Injectable()
export class StoryLabService {
  private readonly logger = new Logger(StoryLabService.name);

  constructor(
    private readonly repository: StoryLabRepository,
    private readonly experimentEngine: ExperimentEngineService,
    private readonly nodeHeatmapService: NodeHeatmapService,
    private readonly narrativeInsightService: NarrativeInsightService,
  ) {}

  // -------------------------------------------------------------------------
  // Signals API
  // -------------------------------------------------------------------------

  async getSignals(query: QueryStorySignalsDto) {
    return await this.repository.findSignals(query);
  }

  async getSignalById(id: string) {
    return await this.repository.findSignalById(id);
  }

  async createSignal(dto: Omit<NewStorySignal, 'id' | 'createdAt' | 'updatedAt'>) {
    return await this.repository.createSignal(dto);
  }

  async detectSignalsForStory(storyId: string) {
    return await this.narrativeInsightService.detectSignalsForStory(storyId);
  }

  // -------------------------------------------------------------------------
  // Insights API
  // -------------------------------------------------------------------------

  async getInsights(query: QueryStoryInsightsDto) {
    return await this.repository.findInsights(query);
  }

  async getInsightById(id: string) {
    return await this.repository.findInsightById(id);
  }

  async updateInsightStatus(id: string, dto: UpdateInsightStatusDto) {
    return await this.narrativeInsightService.updateInsightStatus(id, dto.status, dto.actionPlan);
  }

  async generateInsights(dto: GenerateInsightsRequestDto) {
    return await this.narrativeInsightService.generateInsights(dto.storyId, dto.minConfidence);
  }

  // -------------------------------------------------------------------------
  // Content Opportunities API
  // -------------------------------------------------------------------------

  async getOpportunities(query: QueryContentOpportunitiesDto) {
    return await this.repository.findOpportunities(query);
  }

  async getOpportunityById(id: string) {
    return await this.repository.findOpportunityById(id);
  }

  async updateOpportunityStatus(id: string, dto: UpdateOpportunityStatusDto) {
    return await this.narrativeInsightService.updateOpportunityStatus(id, dto.status, dto.reviewerNotes);
  }

  // -------------------------------------------------------------------------
  // Story Experiments & A/B Engine
  // -------------------------------------------------------------------------

  async getExperiments(query: QueryStoryExperimentsDto) {
    return await this.repository.findExperiments(query);
  }

  async getExperimentById(id: string) {
    return await this.repository.findExperimentById(id);
  }

  async createExperiment(dto: CreateExperimentDto, creatorUserId?: string) {
    return await this.experimentEngine.createExperiment(dto, creatorUserId);
  }

  async updateExperimentStatus(id: string, dto: UpdateExperimentStatusDto) {
    return await this.experimentEngine.updateExperimentStatus(id, dto);
  }

  async updateExperiment(id: string, dto: UpdateExperimentDto) {
    return await this.experimentEngine.updateExperiment(id, dto);
  }

  async allocateVariant(dto: AllocateVariantRequestDto) {
    return await this.experimentEngine.allocateVariant(dto.experimentId, dto.userId);
  }

  async recordVariantImpression(variantId: string) {
    return await this.experimentEngine.recordImpression(variantId);
  }

  async recordVariantCompletion(variantId: string, experimentId?: string) {
    return await this.experimentEngine.recordCompletion(variantId, experimentId);
  }

  // -------------------------------------------------------------------------
  // Story Node Heatmaps & Audience Path Clustering
  // -------------------------------------------------------------------------

  async getStoryNodeHeatmap(storyId: string) {
    return await this.nodeHeatmapService.computeStoryHeatmap(storyId);
  }

  async getStoryPathClustering(storyId: string) {
    return await this.nodeHeatmapService.computePathClustering(storyId);
  }
}
