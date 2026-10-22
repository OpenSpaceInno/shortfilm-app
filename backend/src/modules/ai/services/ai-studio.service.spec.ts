import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { AiStudioService } from './ai-studio.service';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { AiJobsRepository } from '../repositories/ai-jobs.repository';
import { AiUsageLogsRepository } from '../repositories/ai-usage-logs.repository';

describe('AiStudioService', () => {
  let service: AiStudioService;
  let orchestrator: jest.Mocked<AiOrchestratorService>;
  let jobsRepo: jest.Mocked<AiJobsRepository>;
  let usageLogsRepo: jest.Mocked<AiUsageLogsRepository>;

  beforeEach(async () => {
    orchestrator = {
      execute: jest.fn(),
    } as any;

    jobsRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      updateJob: jest.fn(),
    } as any;

    usageLogsRepo = {
      getUserUsageSummary: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiStudioService,
        { provide: AiOrchestratorService, useValue: orchestrator },
        { provide: AiJobsRepository, useValue: jobsRepo },
        { provide: AiUsageLogsRepository, useValue: usageLogsRepo },
      ],
    }).compile();

    service = module.get<AiStudioService>(AiStudioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('expandConcept', () => {
    it('should invoke orchestrator with CONCEPT_EXPAND and return concept proposal', async () => {
      const mockResult = {
        title: 'Messages From Tomorrow',
        genre: 'Mystery · Romance',
        language: 'Hindi',
        format: 'Vertical Short Series (9:16 portrait)',
        episodes: 8,
        logline: 'A young woman receives voice notes from the future.',
        targetAudience: '18-30 thriller lovers',
        arc: [],
        characters: [],
      };

      orchestrator.execute.mockResolvedValueOnce({
        data: mockResult,
        promptTokens: 100,
        completionTokens: 200,
        totalTokens: 300,
        provider: 'MOCK_PROVIDER',
        model: 'mock-creative-sonnet-v1',
        latencyMs: 50,
      });

      const res = await service.expandConcept(
        {
          idea: 'Voice notes from tomorrow',
          genre: 'Mystery',
        },
        'user-123',
      );

      expect(res.title).toBe('Messages From Tomorrow');
      expect(orchestrator.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          feature: 'CONCEPT_EXPAND',
          userId: 'user-123',
        }),
      );
    });
  });

  describe('forgeCharacters', () => {
    it('should invoke orchestrator with CHARACTER_FORGE and return forged characters', async () => {
      const mockResult = {
        characters: [
          {
            name: 'Dev Malhotra',
            age: '31',
            role: 'Protagonist',
            coreDesire: 'Clear family name',
            fatalFlaw: 'Obsessive distrust',
            secret: 'Burned the log',
            dialogueVoice: 'Cynical Hindi',
            visualCue: 'Unbuckled watch',
          },
        ],
      };

      orchestrator.execute.mockResolvedValueOnce({
        data: mockResult,
        promptTokens: 100,
        completionTokens: 200,
        totalTokens: 300,
        provider: 'MOCK_PROVIDER',
        model: 'mock-creative-sonnet-v1',
        latencyMs: 50,
      });

      const res = await service.forgeCharacters(
        {
          storyPremise: 'Detective solving future crime',
          characterCount: 1,
        },
        'user-123',
      );

      expect(res.characters).toHaveLength(1);
      expect(res.characters[0].name).toBe('Dev Malhotra');
      expect(orchestrator.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          feature: 'CHARACTER_FORGE',
          userId: 'user-123',
        }),
      );
    });
  });

  describe('generateDilemma', () => {
    it('should invoke orchestrator with BRANCH_DILEMMA and return bifurcation', async () => {
      const mockResult = {
        prompt: 'Subway track power failure',
        optionA: 'Retrieve decryptor',
        optionB: 'Tackle suspect',
        consequenceA: 'Secures cipher, but gets trapped',
        consequenceB: 'Apprehends suspect, key destroyed',
        tensionScore: 94,
        moralDilemmaAxis: 'Duty vs Truth',
      };

      orchestrator.execute.mockResolvedValueOnce({
        data: mockResult,
        promptTokens: 100,
        completionTokens: 200,
        totalTokens: 300,
        provider: 'MOCK_PROVIDER',
        model: 'mock-creative-sonnet-v1',
        latencyMs: 50,
      });

      const res = await service.generateDilemma(
        {
          episodeContext: 'Power cuts in subway',
          characters: ['Dev', 'Ananya'],
        },
        'user-123',
      );

      expect(res.tensionScore).toBe(94);
      expect(orchestrator.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          feature: 'BRANCH_DILEMMA',
          userId: 'user-123',
        }),
      );
    });
  });

  describe('craftCliffhanger', () => {
    it('should invoke orchestrator with CLIFFHANGER and return hook cues', async () => {
      const mockResult = {
        cliffhangerHook: 'Voicemail plays screams from her current room',
        visualFinalFrame: 'Close-up of cracked screen',
        audioEndingCue: 'Sub-bass drop to silence',
        urgencyLevel: 'CRITICAL',
        retentionTriggers: ['Disorientation', 'Peril'],
      };

      orchestrator.execute.mockResolvedValueOnce({
        data: mockResult,
        promptTokens: 100,
        completionTokens: 200,
        totalTokens: 300,
        provider: 'MOCK_PROVIDER',
        model: 'mock-creative-sonnet-v1',
        latencyMs: 50,
      });

      const res = await service.craftCliffhanger(
        {
          episodeContext: 'Maya plays voicemail',
        },
        'user-123',
      );

      expect(res.urgencyLevel).toBe('CRITICAL');
      expect(orchestrator.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          feature: 'CLIFFHANGER',
          userId: 'user-123',
        }),
      );
    });
  });

  describe('queueProductionPack & Job Polling', () => {
    it('should queue asynchronous job and return 202 payload with status QUEUED', async () => {
      jobsRepo.create.mockResolvedValueOnce({
        id: 'job-999',
        userId: 'user-123',
        jobType: 'PRODUCTION_PACK',
        status: 'QUEUED',
        inputPayload: {},
        resultData: null,
        errorMessage: null,
        progressPercent: 0,
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      orchestrator.execute.mockResolvedValueOnce({
        data: { title: 'Neon Karma 2099' },
        promptTokens: 200,
        completionTokens: 400,
        totalTokens: 600,
        provider: 'MOCK_PROVIDER',
        model: 'mock-creative-sonnet-v1',
        latencyMs: 100,
      });

      const res = await service.queueProductionPack(
        {
          conceptSeed: 'Cyberpunk memory hacker',
          episodesTarget: 8,
        },
        'user-123',
      );

      expect(res.jobId).toBe('job-999');
      expect(res.status).toBe('QUEUED');
      expect(jobsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          jobType: 'PRODUCTION_PACK',
        }),
      );
    });

    it('should return job details when job exists and caller is owner', async () => {
      jobsRepo.findById.mockResolvedValueOnce({
        id: 'job-999',
        userId: 'user-123',
        jobType: 'PRODUCTION_PACK',
        status: 'COMPLETE',
        progressPercent: 100,
        inputPayload: {},
        resultData: { title: 'Neon Karma' },
        errorMessage: null,
        startedAt: new Date(),
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await service.getJobStatus('job-999', 'user-123');
      expect(res.jobId).toBe('job-999');
      expect(res.status).toBe('COMPLETE');
      expect(res.progressPercent).toBe(100);
      expect(res.resultData).toEqual({ title: 'Neon Karma' });
    });

    it('should throw NotFoundException if job does not exist', async () => {
      jobsRepo.findById.mockResolvedValueOnce(null);

      await expect(service.getJobStatus('non-existent-job', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if caller is not job owner', async () => {
      jobsRepo.findById.mockResolvedValueOnce({
        id: 'job-999',
        userId: 'different-user',
        jobType: 'PRODUCTION_PACK',
        status: 'COMPLETE',
        progressPercent: 100,
        inputPayload: {},
        resultData: null,
        errorMessage: null,
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.getJobStatus('job-999', 'user-123')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getUserUsage', () => {
    it('should retrieve usage summary from repository', async () => {
      const summary = {
        totalCalls: 10,
        totalTokens: 12000,
        totalPromptTokens: 4000,
        totalCompletionTokens: 8000,
        totalEstimatedCostUsd: '0.045000',
        featureBreakdown: {
          CONCEPT_EXPAND: { calls: 5, tokens: 6000 },
        },
      };

      usageLogsRepo.getUserUsageSummary.mockResolvedValueOnce(summary);

      const res = await service.getUserUsage('user-123');
      expect(res.totalCalls).toBe(10);
      expect(res.totalTokens).toBe(12000);
      expect(usageLogsRepo.getUserUsageSummary).toHaveBeenCalledWith('user-123');
    });
  });
});
