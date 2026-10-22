import { Test, TestingModule } from '@nestjs/testing';
import { NarrativeInsightService } from './narrative-insight.service';
import { StoryLabRepository } from '../repositories/story-lab.repository';

describe('NarrativeInsightService', () => {
  let service: NarrativeInsightService;
  let repository: jest.Mocked<StoryLabRepository>;

  const mockSignals = [
    {
      id: 'sig-01',
      storyId: 'story-01',
      signalType: 'BRANCH_MONOPOLY_BIAS' as const,
      strength: 'STRONG' as const,
      strengthScore: '88.00',
      confidenceScore: '0.940',
      title: 'Branch monopoly on Choice 1',
      observation: 'Option A takes 90% of votes.',
      possibleInterpretation: 'Lacks moral tension',
      suggestedInvestigation: 'Rebalance choice incentives',
      metricsJson: { dominanceRatio: 0.9 },
      windowStart: null,
      windowEnd: null,
      detectedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'sig-02',
      storyId: 'story-01',
      signalType: 'EPISODE_BRIDGE_DROPOFF' as const,
      strength: 'MODERATE' as const,
      strengthScore: '40.00',
      confidenceScore: '0.750', // below 0.80 threshold
      title: 'Cliffhanger drag',
      observation: '35% drop between Ep 1 and Ep 2',
      possibleInterpretation: null,
      suggestedInvestigation: null,
      metricsJson: null,
      windowStart: null,
      windowEnd: null,
      detectedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(async () => {
    const mockRepo = {
      getStoryGraphDetails: jest.fn(),
      getEpisodeWatchStats: jest.fn(),
      findSignals: jest.fn(),
      createSignal: jest.fn(),
      createInsight: jest.fn(),
      createOpportunity: jest.fn(),
      updateInsightStatus: jest.fn(),
      updateOpportunityStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NarrativeInsightService,
        {
          provide: StoryLabRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<NarrativeInsightService>(NarrativeInsightService);
    repository = module.get(StoryLabRepository);
  });

  describe('detectSignalsForStory', () => {
    it('should detect EPISODE_BRIDGE_DROPOFF when drop exceeds 30%', async () => {
      repository.getStoryGraphDetails.mockResolvedValue({
        episodes: [],
        version: null as any,
        nodes: [],
        choices: [],
        options: [],
      });

      repository.getEpisodeWatchStats.mockResolvedValue([
        { episodeId: 'ep-1', episodeNumber: 1, title: 'Ep 1', totalViewers: 100, completedViewers: 100, avgProgressSec: 80 },
        { episodeId: 'ep-2', episodeNumber: 2, title: 'Ep 2', totalViewers: 60, completedViewers: 50, avgProgressSec: 80 }, // 40% drop (> 30%)
      ]);

      repository.createSignal.mockImplementation(async (d) => ({
        ...d,
        id: 'new-sig',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any));

      const signals = await service.detectSignalsForStory('story-01');
      expect(signals).toHaveLength(1);
      expect(signals[0].signalType).toBe('EPISODE_BRIDGE_DROPOFF');
      expect(repository.createSignal).toHaveBeenCalled();
    });

    it('should detect BRANCH_MONOPOLY_BIAS when an option captures > 85% of votes', async () => {
      repository.getStoryGraphDetails.mockResolvedValue({
        episodes: [],
        version: null as any,
        nodes: [],
        choices: [
          { id: 'ch-1', storyNodeId: 'node-1', prompt: 'Choice dilemma' } as any,
        ],
        options: [
          { id: 'opt-1', choiceId: 'ch-1', label: 'Option A', voteCount: 90 } as any, // 90%
          { id: 'opt-2', choiceId: 'ch-1', label: 'Option B', voteCount: 10 } as any,
        ],
      });

      repository.getEpisodeWatchStats.mockResolvedValue([]);
      repository.createSignal.mockImplementation(async (d) => ({
        ...d,
        id: 'monopoly-sig',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any));

      const signals = await service.detectSignalsForStory('story-01');
      expect(signals).toHaveLength(1);
      expect(signals[0].signalType).toBe('BRANCH_MONOPOLY_BIAS');
    });
  });

  describe('generateInsights', () => {
    it('should filter signals with confidence >= 0.80 and formulate insights and opportunities', async () => {
      repository.findSignals.mockResolvedValue(mockSignals as any);
      repository.createInsight.mockImplementation(async (d) => ({
        ...d,
        id: 'new-ins',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any));
      repository.createOpportunity.mockImplementation(async (d) => ({
        ...d,
        id: 'new-opp',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any));

      const insights = await service.generateInsights('story-01', 0.80);

      // Only sig-01 has confidence 0.940 >= 0.80
      expect(insights).toHaveLength(1);
      expect(insights[0].title).toContain('Branch monopoly');
      expect(repository.createInsight).toHaveBeenCalled();
      // Strength score 88.00 >= 60 triggers content opportunity formulation
      expect(repository.createOpportunity).toHaveBeenCalled();
    });
  });

  describe('updateInsightStatus & updateOpportunityStatus', () => {
    it('should update insight status', async () => {
      repository.updateInsightStatus.mockResolvedValue({
        id: 'ins-01',
        status: 'REVIEWED',
      } as any);

      const updated = await service.updateInsightStatus('ins-01', 'REVIEWED', 'Approved for rewrite');
      expect(repository.updateInsightStatus).toHaveBeenCalledWith('ins-01', 'REVIEWED', 'Approved for rewrite');
      expect(updated?.status).toBe('REVIEWED');
    });

    it('should update opportunity status', async () => {
      repository.updateOpportunityStatus.mockResolvedValue({
        id: 'opp-01',
        status: 'ACCEPTED',
      } as any);

      const updated = await service.updateOpportunityStatus('opp-01', 'ACCEPTED', 'Proceeding with new branch draft');
      expect(repository.updateOpportunityStatus).toHaveBeenCalledWith('opp-01', 'ACCEPTED', 'Proceeding with new branch draft');
      expect(updated?.status).toBe('ACCEPTED');
    });
  });
});
