import { Test, TestingModule } from '@nestjs/testing';
import { AiStudioController } from './ai-studio.controller';
import { AiStudioService } from '../services/ai-studio.service';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';

describe('AiStudioController', () => {
  let controller: AiStudioController;
  let service: jest.Mocked<AiStudioService>;

  const mockUser: AuthenticatedUser = {
    id: 'user-auth-123',
    externalSubjectId: 'auth0|123',
    externalAuthProvider: 'AUTH0',
    email: 'creator@shortreel.com',
    displayName: 'Test Creator',
    avatarUrl: null,
    status: 'ACTIVE',
    roles: ['CREATOR'],
    permissions: [],
  };

  beforeEach(async () => {
    service = {
      expandConcept: jest.fn(),
      forgeCharacters: jest.fn(),
      generateDilemma: jest.fn(),
      craftCliffhanger: jest.fn(),
      queueProductionPack: jest.fn(),
      getJobStatus: jest.fn(),
      getUserUsage: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiStudioController],
      providers: [{ provide: AiStudioService, useValue: service }],
    }).compile();

    controller = module.get<AiStudioController>(AiStudioController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('expandConcept should return wrapped ApiResponseDto', async () => {
    const mockData = {
      title: 'Neon Odyssey',
      genre: 'Sci-Fi',
      language: 'Hindi',
      format: 'Vertical',
      episodes: 8,
      logline: 'Logline text',
      targetAudience: '18-25',
      arc: [],
      characters: [],
    };
    service.expandConcept.mockResolvedValueOnce(mockData as any);

    const res = await controller.expandConcept(mockUser, { idea: 'Sci fi show' });
    expect(res.success).toBe(true);
    expect(res.data).toEqual(mockData);
    expect(service.expandConcept).toHaveBeenCalledWith({ idea: 'Sci fi show' }, mockUser.id);
  });

  it('forgeCharacters should return wrapped ApiResponseDto', async () => {
    const mockData = { characters: [] };
    service.forgeCharacters.mockResolvedValueOnce(mockData as any);

    const res = await controller.forgeCharacters(mockUser, {
      storyPremise: 'Cyberpunk world',
    });
    expect(res.success).toBe(true);
    expect(res.data).toEqual(mockData);
    expect(service.forgeCharacters).toHaveBeenCalledWith(
      { storyPremise: 'Cyberpunk world' },
      mockUser.id,
    );
  });

  it('generateDilemma should return wrapped ApiResponseDto', async () => {
    const mockData = {
      prompt: 'Save chip or friend',
      optionA: 'Chip',
      optionB: 'Friend',
      consequenceA: 'Got chip',
      consequenceB: 'Saved friend',
      tensionScore: 90,
      moralDilemmaAxis: 'Duty vs Loyalty',
    };
    service.generateDilemma.mockResolvedValueOnce(mockData as any);

    const res = await controller.generateDilemma(mockUser, {
      episodeContext: 'Action climax',
      characters: ['Dev'],
    });
    expect(res.success).toBe(true);
    expect(res.data).toEqual(mockData);
    expect(service.generateDilemma).toHaveBeenCalledWith(
      { episodeContext: 'Action climax', characters: ['Dev'] },
      mockUser.id,
    );
  });

  it('craftCliffhanger should return wrapped ApiResponseDto', async () => {
    const mockData = {
      cliffhangerHook: 'Lights turn off',
      visualFinalFrame: 'Close up',
      audioEndingCue: 'Sub bass',
      urgencyLevel: 'CRITICAL',
      retentionTriggers: ['Mystery'],
    };
    service.craftCliffhanger.mockResolvedValueOnce(mockData as any);

    const res = await controller.craftCliffhanger(mockUser, {
      episodeContext: 'Tense call',
    });
    expect(res.success).toBe(true);
    expect(res.data).toEqual(mockData);
    expect(service.craftCliffhanger).toHaveBeenCalledWith(
      { episodeContext: 'Tense call' },
      mockUser.id,
    );
  });

  it('queueProductionPack should return wrapped ApiResponseDto with 202 Accepted status payload', async () => {
    const mockData = {
      jobId: 'job-123',
      status: 'QUEUED',
      estimatedWaitSeconds: 6,
      message: 'Job queued',
    };
    service.queueProductionPack.mockResolvedValueOnce(mockData);

    const res = await controller.queueProductionPack(mockUser, {
      conceptSeed: 'High stakes premise',
    });
    expect(res.success).toBe(true);
    expect(res.data).toEqual(mockData);
    expect(service.queueProductionPack).toHaveBeenCalledWith(
      { conceptSeed: 'High stakes premise' },
      mockUser.id,
    );
  });

  it('getJobStatus should return wrapped ApiResponseDto', async () => {
    const mockData = {
      jobId: 'job-123',
      jobType: 'PRODUCTION_PACK',
      status: 'COMPLETE',
      progressPercent: 100,
      createdAt: new Date(),
    };
    service.getJobStatus.mockResolvedValueOnce(mockData as any);

    const res = await controller.getJobStatus(mockUser, 'job-123');
    expect(res.success).toBe(true);
    expect(res.data).toEqual(mockData);
    expect(service.getJobStatus).toHaveBeenCalledWith('job-123', mockUser.id);
  });

  it('getUsage should return wrapped ApiResponseDto', async () => {
    const mockData = {
      totalCalls: 5,
      totalTokens: 5000,
      totalPromptTokens: 2000,
      totalCompletionTokens: 3000,
      totalEstimatedCostUsd: '0.025000',
      featureBreakdown: {},
    };
    service.getUserUsage.mockResolvedValueOnce(mockData as any);

    const res = await controller.getUsage(mockUser);
    expect(res.success).toBe(true);
    expect(res.data).toEqual(mockData);
    expect(service.getUserUsage).toHaveBeenCalledWith(mockUser.id);
  });
});
