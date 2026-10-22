import { Test, TestingModule } from '@nestjs/testing';
import { AdminStoryLabController } from './admin-story-lab.controller';
import { StoryLabService } from '../services/story-lab.service';

describe('AdminStoryLabController', () => {
  let controller: AdminStoryLabController;
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
      allocateVariant: jest.fn().mockResolvedValue({ allocatedVariant: 'B', bucket: 12 }),
      getStoryNodeHeatmap: jest.fn().mockResolvedValue({ storyId: 'story-1', nodes: [] }),
      getStoryPathClustering: jest.fn().mockResolvedValue({ storyId: 'story-1', clusters: [] }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminStoryLabController],
      providers: [{ provide: StoryLabService, useValue: mockService }],
    }).compile();

    controller = module.get<AdminStoryLabController>(AdminStoryLabController);
    service = module.get(StoryLabService);
  });

  it('should return signals list for admin', async () => {
    const res = await controller.getSignals({});
    expect(res).toEqual({ success: true, data: [] });
    expect(service.getSignals).toHaveBeenCalled();
  });

  it('should return insights list for admin', async () => {
    const res = await controller.getInsights({});
    expect(res).toEqual({ success: true, data: [] });
    expect(service.getInsights).toHaveBeenCalled();
  });

  it('should create an experiment for admin', async () => {
    const expDto = {
      storyId: 'story-1',
      name: 'Test Exp',
      hypothesis: 'Hypothesis A',
      variantA: { name: 'A' },
      variantB: { name: 'B' },
    };
    const res = await controller.createExperiment(expDto as any, { user: { id: 'admin-1' } });
    expect(res).toEqual({ success: true, data: { id: 'exp-1' } });
    expect(service.createExperiment).toHaveBeenCalledWith(expDto, 'admin-1');
  });

  it('should return story node heatmap for admin', async () => {
    const res = await controller.getStoryNodeHeatmap('story-1');
    expect(res).toEqual({ success: true, data: { storyId: 'story-1', nodes: [] } });
    expect(service.getStoryNodeHeatmap).toHaveBeenCalledWith('story-1');
  });

  it('should return audience path clusters for admin', async () => {
    const res = await controller.getStoryPathClustering('story-1');
    expect(res).toEqual({ success: true, data: { storyId: 'story-1', clusters: [] } });
    expect(service.getStoryPathClustering).toHaveBeenCalledWith('story-1');
  });
});
