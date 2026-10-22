import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InteractiveService } from './interactive.service';
import { StoryVersionsRepository } from '../repositories/story-versions.repository';
import { StoryNodesRepository } from '../repositories/story-nodes.repository';
import { ChoicesRepository } from '../repositories/choices.repository';
import { ChoiceOptionsRepository } from '../repositories/choice-options.repository';
import { StoriesRepository } from '../../content/repositories/stories.repository';
import { CreatorsRepository } from '../../content/repositories/creators.repository';
import { EpisodesRepository } from '../../content/repositories/episodes.repository';
import { VideosRepository } from '../../videos/repositories/videos.repository';
import { DagValidatorService } from './dag-validator.service';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';

describe('InteractiveService', () => {
  let service: InteractiveService;
  let storyVersionsRepo: jest.Mocked<StoryVersionsRepository>;
  let storyNodesRepo: jest.Mocked<StoryNodesRepository>;
  let choicesRepo: jest.Mocked<ChoicesRepository>;
  let choiceOptionsRepo: jest.Mocked<ChoiceOptionsRepository>;
  let storiesRepo: jest.Mocked<StoriesRepository>;
  let creatorsRepo: jest.Mocked<CreatorsRepository>;
  let episodesRepo: jest.Mocked<EpisodesRepository>;
  let videosRepo: jest.Mocked<VideosRepository>;
  let dagValidatorService: jest.Mocked<DagValidatorService>;

  const mockAdminUser: AuthenticatedUser = {
    id: 'user_admin',
    externalSubjectId: 'auth0|admin',
    externalAuthProvider: 'AUTH0',
    email: 'admin@shortreel.com',
    displayName: 'Admin User',
    avatarUrl: null,
    status: 'ACTIVE',
    roles: ['SUPER_ADMIN'],
    permissions: [],
  };

  const mockCreatorUser: AuthenticatedUser = {
    id: 'user_creator',
    externalSubjectId: 'auth0|creator',
    externalAuthProvider: 'AUTH0',
    email: 'creator@shortreel.com',
    displayName: 'Creator User',
    avatarUrl: null,
    status: 'ACTIVE',
    roles: ['CREATOR'],
    permissions: [],
  };

  const mockCreator = {
    id: 'creator_1',
    userId: 'user_creator',
    name: 'Jane Director',
    handle: 'janedir',
  };

  const mockStory = {
    id: 'story_1',
    title: 'The Missing Phone',
    slug: 'the-missing-phone',
    creatorId: 'creator_1',
    status: 'DRAFT',
  };

  const mockDraftVersion = {
    id: 'version_1',
    storyId: 'story_1',
    versionNumber: 1,
    status: 'DRAFT' as const,
    graphSnapshot: null,
    rootNodeId: null,
    publishedAt: null,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockStoryVersionsRepo = {
      findById: jest.fn(),
      findByStoryId: jest.fn(),
      findLatestVersion: jest.fn(),
      findPublishedVersion: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    const mockStoryNodesRepo = {
      findById: jest.fn(),
      findByVersionId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    const mockChoicesRepo = {
      findById: jest.fn(),
      findByNodeId: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    };
    const mockChoiceOptionsRepo = {
      findById: jest.fn(),
      findByChoiceId: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    };
    const mockStoriesRepo = {
      findById: jest.fn(),
    };
    const mockCreatorsRepo = {
      findByUserId: jest.fn(),
    };
    const mockEpisodesRepo = {
      findById: jest.fn(),
    };
    const mockVideosRepo = {
      findByEpisodeId: jest.fn(),
    };
    const mockDagValidatorService = {
      validate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InteractiveService,
        { provide: StoryVersionsRepository, useValue: mockStoryVersionsRepo },
        { provide: StoryNodesRepository, useValue: mockStoryNodesRepo },
        { provide: ChoicesRepository, useValue: mockChoicesRepo },
        { provide: ChoiceOptionsRepository, useValue: mockChoiceOptionsRepo },
        { provide: StoriesRepository, useValue: mockStoriesRepo },
        { provide: CreatorsRepository, useValue: mockCreatorsRepo },
        { provide: EpisodesRepository, useValue: mockEpisodesRepo },
        { provide: VideosRepository, useValue: mockVideosRepo },
        { provide: DagValidatorService, useValue: mockDagValidatorService },
      ],
    }).compile();

    service = module.get<InteractiveService>(InteractiveService);
    storyVersionsRepo = module.get(StoryVersionsRepository);
    storyNodesRepo = module.get(StoryNodesRepository);
    choicesRepo = module.get(ChoicesRepository);
    choiceOptionsRepo = module.get(ChoiceOptionsRepository);
    storiesRepo = module.get(StoriesRepository);
    creatorsRepo = module.get(CreatorsRepository);
    episodesRepo = module.get(EpisodesRepository);
    videosRepo = module.get(VideosRepository);
    dagValidatorService = module.get(DagValidatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createVersion', () => {
    it('should create version 1 if no prior versions exist', async () => {
      storiesRepo.findById.mockResolvedValue(mockStory as any);
      creatorsRepo.findByUserId.mockResolvedValue(mockCreator as any);
      storyVersionsRepo.findLatestVersion.mockResolvedValue(null);
      storyVersionsRepo.create.mockImplementation(async (data) => ({
        ...mockDraftVersion,
        ...data,
      }));

      const result = await service.createVersion(mockCreatorUser, 'story_1');
      expect(result.versionNumber).toBe(1);
      expect(result.status).toBe('DRAFT');
    });

    it('should throw ForbiddenException if user does not own story', async () => {
      storiesRepo.findById.mockResolvedValue(mockStory as any);
      creatorsRepo.findByUserId.mockResolvedValue({
        id: 'creator_OTHER',
        userId: 'user_other',
      } as any);

      const otherUser: AuthenticatedUser = {
        id: 'user_other',
        externalSubjectId: 'auth0|other',
        externalAuthProvider: 'AUTH0',
        email: 'other@example.com',
        displayName: 'Other Creator',
        avatarUrl: null,
        status: 'ACTIVE',
        roles: ['CREATOR'],
        permissions: [],
      };

      await expect(service.createVersion(otherUser, 'story_1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('createNode', () => {
    it('should throw BadRequestException if version is PUBLISHED (immutability)', async () => {
      storyVersionsRepo.findById.mockResolvedValue({
        ...mockDraftVersion,
        status: 'PUBLISHED',
      } as any);

      await expect(
        service.createNode(mockAdminUser, 'version_1', { episodeId: 'ep_1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create node and update version rootNodeId if isRoot is true', async () => {
      storyVersionsRepo.findById.mockResolvedValue(mockDraftVersion as any);
      storiesRepo.findById.mockResolvedValue(mockStory as any);
      episodesRepo.findById.mockResolvedValue({ id: 'ep_1', title: 'Episode 1' } as any);
      storyNodesRepo.create.mockImplementation(async (data) => ({
        ...data,
        createdAt: new Date(),
      } as any));

      const node = await service.createNode(mockAdminUser, 'version_1', {
        episodeId: 'ep_1',
        isRoot: true,
      });

      expect(node.isRoot).toBe(true);
      expect(storyVersionsRepo.update).toHaveBeenCalledWith(
        'version_1',
        expect.objectContaining({ rootNodeId: node.id }),
      );
    });
  });

  describe('addChoiceToNode', () => {
    it('should create choice and promote STANDARD node to CHOICE_POINT', async () => {
      storyNodesRepo.findById.mockResolvedValue({
        id: 'node_1',
        storyVersionId: 'version_1',
        nodeType: 'STANDARD',
      } as any);
      storyVersionsRepo.findById.mockResolvedValue(mockDraftVersion as any);
      storiesRepo.findById.mockResolvedValue(mockStory as any);
      choicesRepo.create.mockImplementation(async (data) => ({
        ...data,
        createdAt: new Date(),
      } as any));

      await service.addChoiceToNode(mockAdminUser, 'node_1', {
        prompt: 'Answer the call?',
      });

      expect(storyNodesRepo.update).toHaveBeenCalledWith('node_1', {
        nodeType: 'CHOICE_POINT',
      });
      expect(choicesRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          storyNodeId: 'node_1',
          prompt: 'Answer the call?',
        }),
      );
    });
  });

  describe('addChoiceOption', () => {
    it('should throw BadRequestException if destination node does not exist (ENG-004)', async () => {
      choicesRepo.findById.mockResolvedValue({
        id: 'choice_1',
        storyNodeId: 'node_1',
      } as any);
      storyNodesRepo.findById.mockImplementation(async (id) => {
        if (id === 'node_1') {
          return { id: 'node_1', storyVersionId: 'version_1' } as any;
        }
        return null; // destination doesn't exist
      });
      storyVersionsRepo.findById.mockResolvedValue(mockDraftVersion as any);
      storiesRepo.findById.mockResolvedValue(mockStory as any);

      await expect(
        service.addChoiceOption(mockAdminUser, 'choice_1', {
          label: 'Option A',
          destinationNodeId: 'non_existent_node',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('publishVersion', () => {
    it('should reject publish if graph validation fails (ENG-007, ENG-008)', async () => {
      storyVersionsRepo.findById.mockResolvedValue(mockDraftVersion as any);
      storiesRepo.findById.mockResolvedValue(mockStory as any);
      dagValidatorService.validate.mockResolvedValue({
        isValid: false,
        errors: ['STORY_GRAPH_CYCLE_DETECTED: cycle found'],
        warnings: [],
        stats: { nodeCount: 2, choiceCount: 1, endingCount: 0, maxDepth: 0 },
      });

      await expect(service.publishVersion(mockAdminUser, 'version_1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject publish if any episode video is not READY (ENG-009)', async () => {
      storyVersionsRepo.findById.mockResolvedValue(mockDraftVersion as any);
      storiesRepo.findById.mockResolvedValue(mockStory as any);
      dagValidatorService.validate.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        stats: { nodeCount: 1, choiceCount: 0, endingCount: 1, maxDepth: 1 },
      });
      storyNodesRepo.findByVersionId.mockResolvedValue([
        {
          id: 'node_1',
          episodeId: 'ep_1',
          storyVersionId: 'version_1',
          nodeType: 'ENDING',
        } as any,
      ]);
      videosRepo.findByEpisodeId.mockResolvedValue({
        id: 'vid_1',
        episodeId: 'ep_1',
        status: 'PROCESSING', // Not READY!
      } as any);

      await expect(service.publishVersion(mockAdminUser, 'version_1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should publish successfully when DAG is valid and video is READY', async () => {
      storyVersionsRepo.findById.mockResolvedValue(mockDraftVersion as any);
      storiesRepo.findById.mockResolvedValue(mockStory as any);
      dagValidatorService.validate.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        stats: { nodeCount: 1, choiceCount: 0, endingCount: 1, maxDepth: 1 },
      });
      storyNodesRepo.findByVersionId.mockResolvedValue([
        {
          id: 'node_1',
          episodeId: 'ep_1',
          storyVersionId: 'version_1',
          nodeType: 'ENDING',
          isRoot: true,
          sequenceOrder: 0,
        } as any,
      ]);
      episodesRepo.findById.mockResolvedValue({ id: 'ep_1', title: 'Ep 1' } as any);
      choicesRepo.findByNodeId.mockResolvedValue(null);
      videosRepo.findByEpisodeId.mockResolvedValue({
        id: 'vid_1',
        episodeId: 'ep_1',
        status: 'READY',
      } as any);

      storyVersionsRepo.update.mockResolvedValue({
        ...mockDraftVersion,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      } as any);

      const published = await service.publishVersion(mockAdminUser, 'version_1');
      expect(published.status).toBe('PUBLISHED');
      expect(storyVersionsRepo.update).toHaveBeenCalledWith(
        'version_1',
        expect.objectContaining({ status: 'PUBLISHED' }),
      );
    });
  });

  describe('getPublishedGraphForStory', () => {
    it('should throw NotFoundException if no published version exists (ENG-005)', async () => {
      storyVersionsRepo.findPublishedVersion.mockResolvedValue(null);

      await expect(service.getPublishedGraphForStory('story_1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
