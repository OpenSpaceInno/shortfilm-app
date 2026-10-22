import { Test, TestingModule } from '@nestjs/testing';
import { NodeHeatmapService } from './node-heatmap.service';
import { StoryLabRepository } from '../repositories/story-lab.repository';
import { NotFoundException } from '@nestjs/common';

describe('NodeHeatmapService', () => {
  let service: NodeHeatmapService;
  let repository: jest.Mocked<StoryLabRepository>;

  const mockGraphData = {
    episodes: [
      { id: 'ep-01', storyId: 'story-01', episodeNumber: 1, title: 'Episode 1' },
      { id: 'ep-02', storyId: 'story-01', episodeNumber: 2, title: 'Episode 2' },
      { id: 'ep-03', storyId: 'story-01', episodeNumber: 3, title: 'Episode 3' },
    ],
    version: { id: 'ver-01', storyId: 'story-01', versionNumber: 1, status: 'PUBLISHED' },
    nodes: [
      { id: 'node-01', storyVersionId: 'ver-01', episodeId: 'ep-01', nodeType: 'OPENING', sequenceOrder: 1 },
      { id: 'node-02', storyVersionId: 'ver-01', episodeId: 'ep-02', nodeType: 'CHOICE_POINT', sequenceOrder: 2 },
      { id: 'node-03', storyVersionId: 'ver-01', episodeId: 'ep-03', nodeType: 'ENDING', sequenceOrder: 3 },
    ],
    choices: [
      { id: 'choice-01', storyNodeId: 'node-02', prompt: 'Confront or Flee?' },
    ],
    options: [
      { id: 'opt-01', choiceId: 'choice-01', label: 'Confront', destinationNodeId: 'node-03', voteCount: 65, displayOrder: 1 },
      { id: 'opt-02', choiceId: 'choice-01', label: 'Flee', destinationNodeId: 'node-03', voteCount: 35, displayOrder: 2 },
    ],
  };

  const mockWatchStats = [
    { episodeId: 'ep-01', episodeNumber: 1, title: 'Episode 1', totalViewers: 1000, completedViewers: 900, avgProgressSec: 85 },
    { episodeId: 'ep-02', episodeNumber: 2, title: 'Episode 2', totalViewers: 850, completedViewers: 700, avgProgressSec: 80 },
    { episodeId: 'ep-03', episodeNumber: 3, title: 'Episode 3', totalViewers: 500, completedViewers: 450, avgProgressSec: 75 },
  ];

  beforeEach(async () => {
    const mockRepo = {
      getStoryGraphDetails: jest.fn(),
      getEpisodeWatchStats: jest.fn(),
      getUserChoicesForStory: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NodeHeatmapService,
        {
          provide: StoryLabRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<NodeHeatmapService>(NodeHeatmapService);
    repository = module.get(StoryLabRepository);
  });

  describe('computeStoryHeatmap', () => {
    it('should generate heatmap nodes with drop-off rates, completion rates, and heat levels', async () => {
      repository.getStoryGraphDetails.mockResolvedValue(mockGraphData as any);
      repository.getEpisodeWatchStats.mockResolvedValue(mockWatchStats as any);

      const heatmap = await service.computeStoryHeatmap('story-01');

      expect(heatmap.storyId).toBe('story-01');
      expect(heatmap.totalViewers).toBe(1000);
      expect(heatmap.nodes).toHaveLength(3);

      // Episode 1
      expect(heatmap.nodes[0].episodeNumber).toBe(1);
      expect(heatmap.nodes[0].completionRate).toBe(0.9);

      // Episode 2 should have choice options attached
      expect(heatmap.nodes[1].isChoicePoint).toBe(true);
      expect(heatmap.nodes[1].options).toBeDefined();
      expect(heatmap.nodes[1].options).toHaveLength(2);

      // Episode 3 drop-off from Ep 2 (850 -> 500 = 41% drop => CRITICAL_DROP)
      expect(heatmap.nodes[2].dropOffRate).toBeGreaterThan(0.35);
      expect(heatmap.nodes[2].heatLevel).toBe('CRITICAL_DROP');

      // Highest drop-off node identified
      expect(heatmap.highestDropOffNode).toBeDefined();
      expect(heatmap.highestDropOffNode?.episodeNumber).toBe(3);
    });

    it('should throw NotFoundException if story has no episodes', async () => {
      repository.getStoryGraphDetails.mockResolvedValue({ episodes: [] } as any);
      repository.getEpisodeWatchStats.mockResolvedValue([]);

      await expect(service.computeStoryHeatmap('unknown-story')).rejects.toThrow(NotFoundException);
    });
  });

  describe('computePathClustering', () => {
    it('should cluster audience decisions into narrative routes', async () => {
      repository.getStoryGraphDetails.mockResolvedValue(mockGraphData as any);
      repository.getUserChoicesForStory.mockResolvedValue([
        { userId: 'u1', choiceId: 'choice-01', choiceOptionId: 'opt-01', isFallback: false, createdAt: new Date() },
      ] as any);

      const result = await service.computePathClustering('story-01');

      expect(result.storyId).toBe('story-01');
      expect(result.clusters).toHaveLength(3);
      expect(result.clusters[0].name).toContain('Dominant');
      expect(result.clusters[0].percentage).toBeGreaterThan(50);
      expect(result.primaryDivergenceNode).toBeDefined();
      expect(result.primaryDivergenceNode?.prompt).toBe('Confront or Flee?');
    });
  });
});
