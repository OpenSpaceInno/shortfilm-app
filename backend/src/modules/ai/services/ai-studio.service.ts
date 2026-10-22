import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { AiJobsRepository } from '../repositories/ai-jobs.repository';
import { AiUsageLogsRepository } from '../repositories/ai-usage-logs.repository';
import {
  ConceptExpandRequestDto,
  ConceptExpandResponseDto,
  CharacterForgeRequestDto,
  CharacterForgeResponseDto,
  BranchDilemmaRequestDto,
  BranchDilemmaResponseDto,
  CliffhangerRequestDto,
  CliffhangerResponseDto,
  ProductionPackRequestDto,
  ProductionPackJobCreatedDto,
  ProductionPackResponseDto,
  AiJobStatusResponseDto,
  AiUsageSummaryDto,
} from '../dto';

@Injectable()
export class AiStudioService {
  private readonly logger = new Logger(AiStudioService.name);

  constructor(
    private readonly orchestrator: AiOrchestratorService,
    private readonly jobsRepo: AiJobsRepository,
    private readonly usageLogsRepo: AiUsageLogsRepository,
  ) {}

  /**
   * 1. Concept Expand: Turns a raw premise into a formatted 8-episode arc bible proposal
   */
  async expandConcept(
    dto: ConceptExpandRequestDto,
    userId: string,
    creatorId?: string | null,
  ): Promise<ConceptExpandResponseDto> {
    const userPrompt = `Generate a structured vertical series concept expansion.
Premise: ${dto.idea}
Genre: ${dto.genre || 'Drama · Thriller'}
Language: ${dto.language || 'Hindi'}
Target Episodes: ${dto.episodesTarget || 8}
Format: ${dto.format || 'Vertical Short Series (9:16 portrait)'}`;

    const systemPrompt = `You are an elite short-form vertical drama series showrunner.
Return structured JSON with title, genre, language, format, episodes, logline, targetAudience, arc (array of {label, text}), characters (array of {name, age, role, note}).`;

    const res = await this.orchestrator.execute<ConceptExpandResponseDto>({
      request: {
        systemPrompt,
        userPrompt,
        temperature: 0.7,
      },
      feature: 'CONCEPT_EXPAND',
      userId,
      creatorId,
    });

    return res.data;
  }

  /**
   * 2. Character Forge: Generates multidimensional characters with motivations and flaws
   */
  async forgeCharacters(
    dto: CharacterForgeRequestDto,
    userId: string,
    creatorId?: string | null,
  ): Promise<CharacterForgeResponseDto> {
    const archetypesText = dto.archetypes?.length
      ? `Archetypes: ${dto.archetypes.join(', ')}`
      : '';
    const userPrompt = `Forge dramatic characters for a mobile vertical series.
Premise: ${dto.storyPremise}
Genre: ${dto.genre || 'Drama'}
Desired Count: ${dto.characterCount || 3}
${archetypesText}`;

    const systemPrompt = `You are a character dramatist for fast-paced vertical video fiction.
Return structured JSON with characters: array of {name, age, role, coreDesire, fatalFlaw, secret, dialogueVoice, visualCue}.`;

    const res = await this.orchestrator.execute<CharacterForgeResponseDto>({
      request: {
        systemPrompt,
        userPrompt,
        temperature: 0.75,
      },
      feature: 'CHARACTER_FORGE',
      userId,
      creatorId,
    });

    return res.data;
  }

  /**
   * 3. Branch Dilemma: Creates high-stakes bifurcations for interactive episodes
   */
  async generateDilemma(
    dto: BranchDilemmaRequestDto,
    userId: string,
    creatorId?: string | null,
  ): Promise<BranchDilemmaResponseDto> {
    const userPrompt = `Generate an intense interactive decision fork for this vertical episode.
Scene Context: ${dto.episodeContext}
Characters: ${dto.characters.join(', ')}
Theme: ${dto.dilemmaTheme || 'Duty vs Survival'}`;

    const systemPrompt = `You are an interactive fiction game writer specializing in branching paths.
Create two stark, irreversible choices with no easy compromise.
Return structured JSON with prompt, optionA, optionB, consequenceA, consequenceB, tensionScore (1-100), moralDilemmaAxis.`;

    const res = await this.orchestrator.execute<BranchDilemmaResponseDto>({
      request: {
        systemPrompt,
        userPrompt,
        temperature: 0.7,
      },
      feature: 'BRANCH_DILEMMA',
      userId,
      creatorId,
    });

    return res.data;
  }

  /**
   * 4. Cliffhanger: Generates gripping end-of-episode retention hooks
   */
  async craftCliffhanger(
    dto: CliffhangerRequestDto,
    userId: string,
    creatorId?: string | null,
  ): Promise<CliffhangerResponseDto> {
    const userPrompt = `Craft an irresistible ending cliffhanger hook for a 90-second vertical episode.
Episode Context: ${dto.episodeContext}
${dto.currentEnding ? `Current Draft Ending: ${dto.currentEnding}` : ''}
${dto.hookStyle ? `Desired Hook Style: ${dto.hookStyle}` : ''}`;

    const systemPrompt = `You are a viral retention specialist for episodic mobile storytelling.
Return structured JSON with cliffhangerHook, visualFinalFrame, audioEndingCue, urgencyLevel (LOW, MEDIUM, HIGH, CRITICAL), retentionTriggers (array of strings).`;

    const res = await this.orchestrator.execute<CliffhangerResponseDto>({
      request: {
        systemPrompt,
        userPrompt,
        temperature: 0.8,
      },
      feature: 'CLIFFHANGER',
      userId,
      creatorId,
    });

    return res.data;
  }

  /**
   * 5. Production Pack: Queues asynchronous job for comprehensive multi-part bible generation
   */
  async queueProductionPack(
    dto: ProductionPackRequestDto,
    userId: string,
    creatorId?: string | null,
  ): Promise<ProductionPackJobCreatedDto> {
    const job = await this.jobsRepo.create({
      userId,
      jobType: 'PRODUCTION_PACK',
      inputPayload: dto as any,
    });

    // Fire asynchronous background generation
    setImmediate(async () => {
      await this.processProductionPackJob(job.id, dto, userId, creatorId);
    });

    return {
      jobId: job.id,
      status: 'QUEUED',
      estimatedWaitSeconds: 6,
      message: 'Production pack generation job queued successfully',
    };
  }

  /**
   * Background processor for asynchronous production pack generation
   */
  private async processProductionPackJob(
    jobId: string,
    dto: ProductionPackRequestDto,
    userId: string,
    creatorId?: string | null,
  ): Promise<void> {
    try {
      await this.jobsRepo.updateJob(jobId, {
        status: 'PROCESSING',
        progressPercent: 20,
        startedAt: new Date(),
      });

      const userPrompt = `Generate a full production pack bible for a vertical series.
Premise Seed: ${dto.conceptSeed}
Genre: ${dto.genre || 'Cyberpunk · Thriller'}
Language: ${dto.language || 'Hinglish'}
Episodes Count: ${dto.episodesTarget || 8}
${dto.creatorNotes ? `Creator Notes: ${dto.creatorNotes}` : ''}`;

      const systemPrompt = `You are a master showrunner and production designer for premium vertical micro-dramas.
Return a full series outline JSON with title, genre, language, episodesCount, logline, arc, characters, episodeList, choices, productionPack.`;

      const res = await this.orchestrator.execute<ProductionPackResponseDto>({
        request: {
          systemPrompt,
          userPrompt,
          temperature: 0.7,
        },
        feature: 'PRODUCTION_PACK',
        userId,
        creatorId,
      });

      await this.jobsRepo.updateJob(jobId, {
        status: 'COMPLETE',
        progressPercent: 100,
        resultData: res.data as any,
        completedAt: new Date(),
      });
    } catch (err: any) {
      this.logger.error(`Production pack job ${jobId} failed: ${err.message}`, err.stack);
      await this.jobsRepo.updateJob(jobId, {
        status: 'FAILED',
        progressPercent: 0,
        errorMessage: err.message,
        completedAt: new Date(),
      });
    }
  }

  /**
   * Poll asynchronous job state
   */
  async getJobStatus(jobId: string, userId: string): Promise<AiJobStatusResponseDto> {
    const job = await this.jobsRepo.findById(jobId);
    if (!job) {
      throw new NotFoundException(`AI job with ID "${jobId}" not found.`);
    }

    if (job.userId !== userId) {
      throw new ForbiddenException('You do not have access to this generation job.');
    }

    return {
      jobId: job.id,
      jobType: job.jobType,
      status: job.status,
      progressPercent: job.progressPercent,
      resultData: job.resultData,
      errorMessage: job.errorMessage,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      createdAt: job.createdAt,
    };
  }

  /**
   * Usage summary auditing for the authenticated user
   */
  async getUserUsage(userId: string): Promise<AiUsageSummaryDto> {
    return this.usageLogsRepo.getUserUsageSummary(userId);
  }
}
