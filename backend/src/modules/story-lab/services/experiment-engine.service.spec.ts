import { Test, TestingModule } from '@nestjs/testing';
import { ExperimentEngineService, murmurHash3 } from './experiment-engine.service';
import { StoryLabRepository } from '../repositories/story-lab.repository';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ExperimentEngineService', () => {
  let service: ExperimentEngineService;
  let repository: jest.Mocked<StoryLabRepository>;

  const mockExperiment = {
    id: '01HVGEXP000000000000000001',
    storyId: '01HVGSTORY0000000000000001',
    name: 'Cliffhanger Cold Open Test',
    hypothesis: 'Testing shorter cliffhanger pause',
    targetMetric: 'completion_rate',
    status: 'RUNNING' as const,
    splitPercentage: 50,
    startedAt: new Date(),
    concludedAt: null,
    createdBy: '01HVGUSER00000000000000001',
    createdAt: new Date(),
    updatedAt: new Date(),
    variants: [
      {
        id: '01HVGVAR00000000000000000A',
        experimentId: '01HVGEXP000000000000000001',
        variantKey: 'A',
        versionId: null,
        nodeId: null,
        name: 'Control (30s intro)',
        description: 'Original pacing',
        configJson: { introSec: 30 },
        trafficAllocationPct: 50,
        impressionsCount: 100,
        completionsCount: 80,
        conversionRate: '0.8000',
        metricsJson: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '01HVGVAR00000000000000000B',
        experimentId: '01HVGEXP000000000000000001',
        variantKey: 'B',
        versionId: null,
        nodeId: null,
        name: 'Candidate (15s intro)',
        description: 'Tighter pacing',
        configJson: { introSec: 15 },
        trafficAllocationPct: 50,
        impressionsCount: 100,
        completionsCount: 85,
        conversionRate: '0.8500',
        metricsJson: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  beforeEach(async () => {
    const mockRepo = {
      findExperimentById: jest.fn(),
      createExperimentWithVariants: jest.fn(),
      updateExperiment: jest.fn(),
      recordVariantImpression: jest.fn(),
      recordVariantCompletion: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExperimentEngineService,
        {
          provide: StoryLabRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<ExperimentEngineService>(ExperimentEngineService);
    repository = module.get(StoryLabRepository);
  });

  describe('murmurHash3', () => {
    it('should be deterministic for same key', () => {
      const h1 = murmurHash3('test-exp:user-123');
      const h2 = murmurHash3('test-exp:user-123');
      expect(h1).toBe(h2);
    });

    it('should produce different hashes for different keys', () => {
      const h1 = murmurHash3('test-exp:user-1');
      const h2 = murmurHash3('test-exp:user-2');
      expect(h1).not.toBe(h2);
    });
  });

  describe('allocateVariant', () => {
    it('should allocate deterministically between Variant A and B based on splitPercentage', async () => {
      repository.findExperimentById.mockResolvedValue(mockExperiment as any);

      const res1 = await service.allocateVariant(mockExperiment.id, 'user-abc');
      const res2 = await service.allocateVariant(mockExperiment.id, 'user-abc');

      expect(res1.allocatedVariant).toBe(res2.allocatedVariant);
      expect(res1.variantId).toBe(res2.variantId);
      expect(res1.bucket).toBe(res2.bucket);
      expect(['A', 'B']).toContain(res1.allocatedVariant);
    });

    it('should default to Variant A (Control) when experiment is not RUNNING', async () => {
      repository.findExperimentById.mockResolvedValue({
        ...mockExperiment,
        status: 'PAUSED',
      } as any);

      const res = await service.allocateVariant(mockExperiment.id, 'user-xyz');
      expect(res.allocatedVariant).toBe('A');
      expect(res.variantKey).toBe('A');
      expect(res.status).toBe('PAUSED');
    });

    it('should throw NotFoundException if experiment does not exist', async () => {
      repository.findExperimentById.mockResolvedValue(null);
      await expect(service.allocateVariant('unknown-exp', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createExperiment', () => {
    it('should create experiment with variants via repository', async () => {
      repository.createExperimentWithVariants.mockResolvedValue(mockExperiment as any);

      const dto = {
        storyId: '01HVGSTORY0000000000000001',
        name: 'New Test',
        hypothesis: 'Hypothesis A',
        targetMetric: 'completion_rate',
        splitPercentage: 50,
        variantA: { name: 'Control', configJson: { mode: 'A' } },
        variantB: { name: 'Candidate', configJson: { mode: 'B' } },
      };

      const result = await service.createExperiment(dto, 'user-admin');
      expect(repository.createExperimentWithVariants).toHaveBeenCalled();
      expect(result.id).toBe(mockExperiment.id);
    });
  });

  describe('checkFailsafe', () => {
    it('should auto-pause experiment if candidate drop exceeds 15% threshold', async () => {
      const failingExp = {
        ...mockExperiment,
        variants: [
          {
            ...mockExperiment.variants[0],
            conversionRate: '0.8000',
            impressionsCount: 50,
          },
          {
            ...mockExperiment.variants[1],
            conversionRate: '0.6000', // 20% drop (> 15%)
            impressionsCount: 50,
          },
        ],
      };

      repository.findExperimentById.mockResolvedValue(failingExp as any);
      repository.updateExperiment.mockResolvedValue({ ...failingExp, status: 'PAUSED' } as any);

      const failsafeTriggered = await service.checkFailsafe(mockExperiment.id);
      expect(failsafeTriggered).toBe(true);
      expect(repository.updateExperiment).toHaveBeenCalledWith(mockExperiment.id, {
        status: 'PAUSED',
      });
    });

    it('should not pause experiment if drop is within acceptable margin', async () => {
      repository.findExperimentById.mockResolvedValue(mockExperiment as any);
      const failsafeTriggered = await service.checkFailsafe(mockExperiment.id);
      expect(failsafeTriggered).toBe(false);
      expect(repository.updateExperiment).not.toHaveBeenCalled();
    });
  });
});
