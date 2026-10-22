import { Test, TestingModule } from '@nestjs/testing';
import { StoryLabService } from './story-lab.service';
import { StoryLabRepository } from '../repositories/story-lab.repository';
import { ExperimentEngineService } from './experiment-engine.service';
import { NodeHeatmapService } from './node-heatmap.service';
import { NarrativeInsightService } from './narrative-insight.service';

describe('StoryLabService', () => {
  let service: StoryLabService;
  let repository: jest.Mocked<StoryLabRepository>;
  let experimentEngine: jest.Mocked<ExperimentEngineService>;
  let nodeHeatmapService: jest.Mocked<NodeHeatmapService>;
  let narrativeInsightService: jest.Mocked<NarrativeInsightService>;

  beforeEach(async () => {
    const mockRepo = {
      findSignals: jest.fn(),
      findSignalById: jest.fn(),
      createSignal: jest.fn(),
      findInsights: jest.fn(),
      findInsightById: jest.fn(),
      findOpportunities: jest.fn(),
      findOpportunityById: jest.fn(),
      findExperiments: jest.fn(),
      findExperimentById: jest.fn(),
    };

    const mockExpEngine = {
      allocateVariant: jest.fn(),
      createExperiment: jest.fn(),
      updateExperimentStatus: jest.fn(),
      updateExperiment: jest.fn(),
      recordImpression: jest.fn(),
      recordCompletion: jest.fn(),
    };

    const mockHeatmap = {
      computeStoryHeatmap: jest.fn(),
      computePathClustering: jest.fn(),
    };

    const mockNarrative = {
      detectSignalsForStory: jest.fn(),
      generateInsights: jest.fn(),
      updateInsightStatus: jest.fn(),
      updateOpportunityStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoryLabService,
        { provide: StoryLabRepository, useValue: mockRepo },
        { provide: ExperimentEngineService, useValue: mockExpEngine },
        { provide: NodeHeatmapService, useValue: mockHeatmap },
        { provide: NarrativeInsightService, useValue: mockNarrative },
      ],
    }).compile();

    service = module.get<StoryLabService>(StoryLabService);
    repository = module.get(StoryLabRepository);
    experimentEngine = module.get(ExperimentEngineService);
    nodeHeatmapService = module.get(NodeHeatmapService);
    narrativeInsightService = module.get(NarrativeInsightService);
  });

  it('should get signals through repository', async () => {
    repository.findSignals.mockResolvedValue([]);
    const res = await service.getSignals({});
    expect(res).toEqual([]);
    expect(repository.findSignals).toHaveBeenCalled();
  });

  it('should get experiments through repository', async () => {
    repository.findExperiments.mockResolvedValue([]);
    const res = await service.getExperiments({});
    expect(res).toEqual([]);
    expect(repository.findExperiments).toHaveBeenCalled();
  });

  it('should allocate variant through experiment engine', async () => {
    const mockAllocation = {
      experimentId: 'exp-1',
      userId: 'user-1',
      bucket: 42,
      allocatedVariant: 'A' as const,
      variantId: 'var-a',
      variantKey: 'A',
      variantName: 'Control',
      status: 'RUNNING',
    };
    experimentEngine.allocateVariant.mockResolvedValue(mockAllocation);

    const res = await service.allocateVariant({ experimentId: 'exp-1', userId: 'user-1' });
    expect(res).toEqual(mockAllocation);
    expect(experimentEngine.allocateVariant).toHaveBeenCalledWith('exp-1', 'user-1');
  });

  it('should compute node heatmap through heatmap service', async () => {
    const mockHeatmap = {
      storyId: 'story-1',
      storyTitle: 'Story 1',
      totalViewers: 500,
      overallCompletionRate: 0.75,
      nodes: [],
    };
    nodeHeatmapService.computeStoryHeatmap.mockResolvedValue(mockHeatmap);

    const res = await service.getStoryNodeHeatmap('story-1');
    expect(res).toEqual(mockHeatmap);
    expect(nodeHeatmapService.computeStoryHeatmap).toHaveBeenCalledWith('story-1');
  });

  it('should compute path clusters through heatmap service', async () => {
    const mockClusters = {
      storyId: 'story-1',
      storyTitle: 'Story 1',
      totalInteractiveSessions: 300,
      clusters: [],
    };
    nodeHeatmapService.computePathClustering.mockResolvedValue(mockClusters);

    const res = await service.getStoryPathClustering('story-1');
    expect(res).toEqual(mockClusters);
    expect(nodeHeatmapService.computePathClustering).toHaveBeenCalledWith('story-1');
  });
});
