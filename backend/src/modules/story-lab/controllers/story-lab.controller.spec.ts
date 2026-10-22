import { Test, TestingModule } from '@nestjs/testing';
import { StoryLabController } from './story-lab.controller';
import { StoryLabService } from '../services/story-lab.service';

describe('StoryLabController', () => {
  let controller: StoryLabController;
  let service: jest.Mocked<StoryLabService>;

  beforeEach(async () => {
    const mockService = {
      getSignals: jest.fn().mockResolvedValue([]),
      getSignalById: jest.fn().mockResolvedValue({ id: 'sig-1' }),
      detectSignalsForStory: jest.fn().mockResolvedValue([]),
      getInsights: jest.fn().mockResolvedValue([]),
      getInsightById: jest.fn().mockResolvedValue({ id: 'ins-1' }),
      updateInsightStatus: jest.fn().mockResolvedValue({ id: 'ins-1', status: 'REVIEWED' }),
      generateInsights: jest.fn().mockResolvedValue([]),
      getOpportunities: jest.fn().mockResolvedValue([]),
      getOpportunityById: jest.fn().mockResolvedValue({ id: 'opp-1' }),
      updateOpportunityStatus: jest.fn().mockResolvedValue({ id: 'opp-1', status: 'ACCEPTED' }),
      getExperiments: jest.fn().mockResolvedValue([]),
      getExperimentById: jest.fn().mockResolvedValue({ id: 'exp-1' }),
      createExperiment: jest.fn().mockResolvedValue({ id: 'exp-1' }),
      updateExperimentStatus: jest.fn().mockResolvedValue({ id: 'exp-1', status: 'RUNNING' }),
      updateExperiment: jest.fn().mockResolvedValue({ id: 'exp-1' }),
      allocateVariant: jest.fn().mockResolvedValue({ allocatedVariant: 'A', bucket: 25 }),
      recordVariantImpression: jest.fn().mockResolvedValue(undefined),
      recordVariantCompletion: jest.fn().mockResolvedValue(undefined),
      getStoryNodeHeatmap: jest.fn().mockResolvedValue({ storyId: 'story-1', nodes: [] }),
      getStoryPathClustering: jest.fn().mockResolvedValue({ storyId: 'story-1', clusters: [] }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoryLabController],
      providers: [{ provide: StoryLabService, useValue: mockService }],
    }).compile();

    controller = module.get<StoryLabController>(StoryLabController);
    service = module.get(StoryLabService);
  });

  it('should return signals list in standard envelope', async () => {
    const res = await controller.getSignals({});
    expect(res).toEqual({ success: true, data: [] });
    expect(service.getSignals).toHaveBeenCalled();
  });

  it('should return insights list in standard envelope', async () => {
    const res = await controller.getInsights({});
    expect(res).toEqual({ success: true, data: [] });
    expect(service.getInsights).toHaveBeenCalled();
  });

  it('should update insight status', async () => {
    const res = await controller.updateInsightStatus('ins-1', { status: 'REVIEWED' });
    expect(res).toEqual({ success: true, data: { id: 'ins-1', status: 'REVIEWED' } });
    expect(service.updateInsightStatus).toHaveBeenCalledWith('ins-1', { status: 'REVIEWED' });
  });

  it('should return opportunities list', async () => {
    const res = await controller.getOpportunities({});
    expect(res).toEqual({ success: true, data: [] });
    expect(service.getOpportunities).toHaveBeenCalled();
  });

  it('should return experiments list', async () => {
    const res = await controller.getExperiments({});
    expect(res).toEqual({ success: true, data: [] });
    expect(service.getExperiments).toHaveBeenCalled();
  });

  it('should allocate variant for user in A/B test', async () => {
    const res = await controller.allocateVariant({ experimentId: 'exp-1', userId: 'user-1' });
    expect(res).toEqual({ success: true, data: { allocatedVariant: 'A', bucket: 25 } });
    expect(service.allocateVariant).toHaveBeenCalledWith({ experimentId: 'exp-1', userId: 'user-1' });
  });

  it('should return story node heatmap', async () => {
    const res = await controller.getStoryNodeHeatmap('story-1');
    expect(res).toEqual({ success: true, data: { storyId: 'story-1', nodes: [] } });
    expect(service.getStoryNodeHeatmap).toHaveBeenCalledWith('story-1');
  });

  it('should return story path clusters', async () => {
    const res = await controller.getStoryPathClustering('story-1');
    expect(res).toEqual({ success: true, data: { storyId: 'story-1', clusters: [] } });
    expect(service.getStoryPathClustering).toHaveBeenCalledWith('story-1');
  });
});
