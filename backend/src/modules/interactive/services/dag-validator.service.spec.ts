import { Test, TestingModule } from '@nestjs/testing';
import { DagValidatorService } from './dag-validator.service';
import { StoryNodesRepository } from '../repositories/story-nodes.repository';
import { ChoicesRepository } from '../repositories/choices.repository';
import { ChoiceOptionsRepository } from '../repositories/choice-options.repository';

describe('DagValidatorService', () => {
  let service: DagValidatorService;
  let storyNodesRepo: jest.Mocked<StoryNodesRepository>;
  let choicesRepo: jest.Mocked<ChoicesRepository>;
  let choiceOptionsRepo: jest.Mocked<ChoiceOptionsRepository>;

  beforeEach(async () => {
    const mockStoryNodesRepo = {
      findByVersionId: jest.fn(),
      findById: jest.fn(),
    };
    const mockChoicesRepo = {
      findByNodeId: jest.fn(),
    };
    const mockChoiceOptionsRepo = {
      findByChoiceId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DagValidatorService,
        { provide: StoryNodesRepository, useValue: mockStoryNodesRepo },
        { provide: ChoicesRepository, useValue: mockChoicesRepo },
        { provide: ChoiceOptionsRepository, useValue: mockChoiceOptionsRepo },
      ],
    }).compile();

    service = module.get<DagValidatorService>(DagValidatorService);
    storyNodesRepo = module.get(StoryNodesRepository);
    choicesRepo = module.get(ChoicesRepository);
    choiceOptionsRepo = module.get(ChoiceOptionsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return error when story version has no nodes', async () => {
    storyNodesRepo.findByVersionId.mockResolvedValue([]);

    const result = await service.validate('v1');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('STORY_GRAPH_EMPTY: Story version has no nodes');
  });

  it('should detect missing root node', async () => {
    storyNodesRepo.findByVersionId.mockResolvedValue([
      {
        id: 'node1',
        storyVersionId: 'v1',
        episodeId: 'ep1',
        nodeType: 'ENDING',
        isRoot: false,
        sequenceOrder: 0,
        votingEndsAt: null,
        fallbackOptionId: null,
        createdAt: new Date(),
      },
    ]);
    choicesRepo.findByNodeId.mockResolvedValue(null);

    const result = await service.validate('v1');
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('STORY_GRAPH_NO_ROOT_NODE'))).toBe(true);
  });

  it('should detect multiple root nodes', async () => {
    storyNodesRepo.findByVersionId.mockResolvedValue([
      {
        id: 'node1',
        storyVersionId: 'v1',
        episodeId: 'ep1',
        nodeType: 'ENDING',
        isRoot: true,
        sequenceOrder: 0,
        votingEndsAt: null,
        fallbackOptionId: null,
        createdAt: new Date(),
      },
      {
        id: 'node2',
        storyVersionId: 'v1',
        episodeId: 'ep2',
        nodeType: 'ENDING',
        isRoot: true,
        sequenceOrder: 1,
        votingEndsAt: null,
        fallbackOptionId: null,
        createdAt: new Date(),
      },
    ]);
    choicesRepo.findByNodeId.mockResolvedValue(null);

    const result = await service.validate('v1');
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('STORY_GRAPH_MULTIPLE_ROOT_NODES'))).toBe(true);
  });

  it('should detect cycles in graph (ENG-007)', async () => {
    // node1 (Root, CHOICE_POINT) -> node2 (CHOICE_POINT) -> node1 (cycle!)
    storyNodesRepo.findByVersionId.mockResolvedValue([
      {
        id: 'node1',
        storyVersionId: 'v1',
        episodeId: 'ep1',
        nodeType: 'CHOICE_POINT',
        isRoot: true,
        sequenceOrder: 0,
        votingEndsAt: null,
        fallbackOptionId: null,
        createdAt: new Date(),
      },
      {
        id: 'node2',
        storyVersionId: 'v1',
        episodeId: 'ep2',
        nodeType: 'CHOICE_POINT',
        isRoot: false,
        sequenceOrder: 1,
        votingEndsAt: null,
        fallbackOptionId: null,
        createdAt: new Date(),
      },
    ]);

    choicesRepo.findByNodeId.mockImplementation(async (nodeId) => {
      return {
        id: `choice_${nodeId}`,
        storyNodeId: nodeId,
        prompt: 'Choose',
        votingOpensAt: null,
        votingEndsAt: null,
        createdAt: new Date(),
      };
    });

    choiceOptionsRepo.findByChoiceId.mockImplementation(async (choiceId) => {
      if (choiceId === 'choice_node1') {
        return [
          {
            id: 'opt1',
            choiceId: 'choice_node1',
            label: 'Go to 2',
            destinationNodeId: 'node2',
            voteCount: 0,
            displayOrder: 1,
            createdAt: new Date(),
          },
          {
            id: 'opt2',
            choiceId: 'choice_node1',
            label: 'Go to 2 alt',
            destinationNodeId: 'node2',
            voteCount: 0,
            displayOrder: 2,
            createdAt: new Date(),
          },
        ];
      }
      return [
        {
          id: 'opt3',
          choiceId: 'choice_node2',
          label: 'Loop back to 1',
          destinationNodeId: 'node1',
          voteCount: 0,
          displayOrder: 1,
          createdAt: new Date(),
        },
        {
          id: 'opt4',
          choiceId: 'choice_node2',
          label: 'Loop back to 1 alt',
          destinationNodeId: 'node1',
          voteCount: 0,
          displayOrder: 2,
          createdAt: new Date(),
        },
      ];
    });

    const result = await service.validate('v1');
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('STORY_GRAPH_CYCLE_DETECTED'))).toBe(true);
  });

  it('should detect choice point with fewer than 2 options', async () => {
    storyNodesRepo.findByVersionId.mockResolvedValue([
      {
        id: 'node1',
        storyVersionId: 'v1',
        episodeId: 'ep1',
        nodeType: 'CHOICE_POINT',
        isRoot: true,
        sequenceOrder: 0,
        votingEndsAt: null,
        fallbackOptionId: null,
        createdAt: new Date(),
      },
      {
        id: 'node2',
        storyVersionId: 'v1',
        episodeId: 'ep2',
        nodeType: 'ENDING',
        isRoot: false,
        sequenceOrder: 1,
        votingEndsAt: null,
        fallbackOptionId: null,
        createdAt: new Date(),
      },
    ]);

    choicesRepo.findByNodeId.mockImplementation(async (nodeId) => {
      if (nodeId === 'node1') {
        return {
          id: 'choice1',
          storyNodeId: 'node1',
          prompt: 'Only 1 option prompt',
          votingOpensAt: null,
          votingEndsAt: null,
          createdAt: new Date(),
        };
      }
      return null;
    });

    choiceOptionsRepo.findByChoiceId.mockResolvedValue([
      {
        id: 'opt1',
        choiceId: 'choice1',
        label: 'Only one branch',
        destinationNodeId: 'node2',
        voteCount: 0,
        displayOrder: 1,
        createdAt: new Date(),
      },
    ]);

    const result = await service.validate('v1');
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('CHOICE_POINT_INCOMPLETE'))).toBe(true);
  });

  it('should detect invalid destination node (ENG-004)', async () => {
    storyNodesRepo.findByVersionId.mockResolvedValue([
      {
        id: 'node1',
        storyVersionId: 'v1',
        episodeId: 'ep1',
        nodeType: 'CHOICE_POINT',
        isRoot: true,
        sequenceOrder: 0,
        votingEndsAt: null,
        fallbackOptionId: null,
        createdAt: new Date(),
      },
    ]);

    choicesRepo.findByNodeId.mockResolvedValue({
      id: 'choice1',
      storyNodeId: 'node1',
      prompt: 'Branch',
      votingOpensAt: null,
      votingEndsAt: null,
      createdAt: new Date(),
    });

    choiceOptionsRepo.findByChoiceId.mockResolvedValue([
      {
        id: 'opt1',
        choiceId: 'choice1',
        label: 'To non-existent node',
        destinationNodeId: 'ghost_node',
        voteCount: 0,
        displayOrder: 1,
        createdAt: new Date(),
      },
      {
        id: 'opt2',
        choiceId: 'choice1',
        label: 'To non-existent node 2',
        destinationNodeId: 'ghost_node_2',
        voteCount: 0,
        displayOrder: 2,
        createdAt: new Date(),
      },
    ]);

    const result = await service.validate('v1');
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('DESTINATION_NODE_INVALID'))).toBe(true);
  });

  it('should detect dead-end node when non-ENDING node has no outbound options (ENG-008)', async () => {
    storyNodesRepo.findByVersionId.mockResolvedValue([
      {
        id: 'node1',
        storyVersionId: 'v1',
        episodeId: 'ep1',
        nodeType: 'STANDARD', // Not ENDING, but no outbound choices
        isRoot: true,
        sequenceOrder: 0,
        votingEndsAt: null,
        fallbackOptionId: null,
        createdAt: new Date(),
      },
    ]);
    choicesRepo.findByNodeId.mockResolvedValue(null);

    const result = await service.validate('v1');
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('DEAD_END_NODE'))).toBe(true);
  });

  it('should validate a complete valid DAG with correct stats and depth', async () => {
    // node1 (Root, CHOICE_POINT) -> node2 (ENDING) and node3 (ENDING)
    storyNodesRepo.findByVersionId.mockResolvedValue([
      {
        id: 'node1',
        storyVersionId: 'v1',
        episodeId: 'ep1',
        nodeType: 'CHOICE_POINT',
        isRoot: true,
        sequenceOrder: 0,
        votingEndsAt: null,
        fallbackOptionId: null,
        createdAt: new Date(),
      },
      {
        id: 'node2',
        storyVersionId: 'v1',
        episodeId: 'ep2',
        nodeType: 'ENDING',
        isRoot: false,
        sequenceOrder: 1,
        votingEndsAt: null,
        fallbackOptionId: null,
        createdAt: new Date(),
      },
      {
        id: 'node3',
        storyVersionId: 'v1',
        episodeId: 'ep3',
        nodeType: 'ENDING',
        isRoot: false,
        sequenceOrder: 2,
        votingEndsAt: null,
        fallbackOptionId: null,
        createdAt: new Date(),
      },
    ]);

    choicesRepo.findByNodeId.mockImplementation(async (nodeId) => {
      if (nodeId === 'node1') {
        return {
          id: 'choice1',
          storyNodeId: 'node1',
          prompt: 'Choose your destiny',
          votingOpensAt: null,
          votingEndsAt: null,
          createdAt: new Date(),
        };
      }
      return null;
    });

    choiceOptionsRepo.findByChoiceId.mockResolvedValue([
      {
        id: 'opt1',
        choiceId: 'choice1',
        label: 'Option A: Good ending',
        destinationNodeId: 'node2',
        voteCount: 5,
        displayOrder: 1,
        createdAt: new Date(),
      },
      {
        id: 'opt2',
        choiceId: 'choice1',
        label: 'Option B: Bad ending',
        destinationNodeId: 'node3',
        voteCount: 2,
        displayOrder: 2,
        createdAt: new Date(),
      },
    ]);

    const result = await service.validate('v1');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.stats.nodeCount).toBe(3);
    expect(result.stats.choiceCount).toBe(1);
    expect(result.stats.endingCount).toBe(2);
    expect(result.stats.maxDepth).toBe(2);
  });
});
