import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { StoryLifecycleService } from './story-lifecycle.service';
import { StoryVersionsRepository } from '../repositories/story-versions.repository';
import { StoryNodesRepository } from '../repositories/story-nodes.repository';
import { StoriesRepository } from '../../content/repositories/stories.repository';
import { CreatorsRepository } from '../../content/repositories/creators.repository';
import { VideosRepository } from '../../videos/repositories/videos.repository';
import { DagValidatorService } from './dag-validator.service';
import { InteractiveService } from './interactive.service';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';

describe('StoryLifecycleService', () => {
  let service: StoryLifecycleService;
  let storyVersionsRepo: jest.Mocked<StoryVersionsRepository>;
  let storyNodesRepo: jest.Mocked<StoryNodesRepository>;
  let storiesRepo: jest.Mocked<StoriesRepository>;
  let creatorsRepo: jest.Mocked<CreatorsRepository>;
  let videosRepo: jest.Mocked<VideosRepository>;
  let dagValidatorService: jest.Mocked<DagValidatorService>;
  let interactiveService: jest.Mocked<InteractiveService>;

  const mockAdminUser: AuthenticatedUser = {
    id: 'user_admin',
    externalSubjectId: 'auth0|admin',
    externalAuthProvider: 'AUTH0',
    email: 'admin@shortreel.com',
    displayName: 'Admin User',
    avatarUrl: null,
    status: 'ACTIVE',
    roles: ['SUPER_ADMIN', 'CONTENT_ADMIN'],
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
  };

  const mockStory = {
    id: 'story_1',
    title: 'The Missing Phone',
    creatorId: 'creator_1',
    status: 'DRAFT',
  };

  const mockDraftVersion = {
    id: 'version_1',
    storyId: 'story_1',
    versionNumber: 1,
    status: 'DRAFT' as const,
    graphSnapshot: null,
    rootNodeId: 'node_1',
    publishedAt: null,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockStoryVersionsRepo = {
      findById: jest.fn(),
      findByStatus: jest.fn(),
      update: jest.fn(),
      archivePublishedForStory: jest.fn(),
    };
    const mockStoryNodesRepo = {
      findByVersionId: jest.fn(),
    };
    const mockStoriesRepo = {
      findById: jest.fn(),
      update: jest.fn(),
    };
    const mockCreatorsRepo = {
      findByUserId: jest.fn(),
    };
    const mockVideosRepo = {
      findByEpisodeId: jest.fn(),
    };
    const mockDagValidatorService = {
      validate: jest.fn(),
    };
    const mockInteractiveService = {
      getFullGraph: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoryLifecycleService,
        { provide: StoryVersionsRepository, useValue: mockStoryVersionsRepo },
        { provide: StoryNodesRepository, useValue: mockStoryNodesRepo },
        { provide: StoriesRepository, useValue: mockStoriesRepo },
        { provide: CreatorsRepository, useValue: mockCreatorsRepo },
        { provide: VideosRepository, useValue: mockVideosRepo },
        { provide: DagValidatorService, useValue: mockDagValidatorService },
        { provide: InteractiveService, useValue: mockInteractiveService },
      ],
    }).compile();

    service = module.get<StoryLifecycleService>(StoryLifecycleService);
    storyVersionsRepo = module.get(StoryVersionsRepository);
    storyNodesRepo = module.get(StoryNodesRepository);
    storiesRepo = module.get(StoriesRepository);
    creatorsRepo = module.get(CreatorsRepository);
    videosRepo = module.get(VideosRepository);
    dagValidatorService = module.get(DagValidatorService);
    interactiveService = module.get(InteractiveService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitForReview (DRAFT -> IN_REVIEW)', () => {
    it('should transition to IN_REVIEW when DAG is valid', async () => {
      storyVersionsRepo.findById.mockResolvedValue(mockDraftVersion as any);
      storiesRepo.findById.mockResolvedValue(mockStory as any);
      creatorsRepo.findByUserId.mockResolvedValue(mockCreator as any);
      dagValidatorService.validate.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        stats: { nodeCount: 3, choiceCount: 1, endingCount: 2, maxDepth: 2 },
      });
      storyVersionsRepo.update.mockResolvedValue({
        ...mockDraftVersion,
        status: 'IN_REVIEW',
        updatedAt: new Date(),
      } as any);

      const result = await service.submitForReview(mockCreatorUser, 'version_1');
      expect(result.previousStatus).toBe('DRAFT');
      expect(result.newStatus).toBe('IN_REVIEW');
      expect(storyVersionsRepo.update).toHaveBeenCalledWith('version_1', { status: 'IN_REVIEW' });
    });

    it('should reject submission if DAG validation fails', async () => {
      storyVersionsRepo.findById.mockResolvedValue(mockDraftVersion as any);
      storiesRepo.findById.mockResolvedValue(mockStory as any);
      creatorsRepo.findByUserId.mockResolvedValue(mockCreator as any);
      dagValidatorService.validate.mockResolvedValue({
        isValid: false,
        errors: ['STORY_GRAPH_CYCLE_DETECTED: cycle found'],
        warnings: [],
        stats: { nodeCount: 2, choiceCount: 1, endingCount: 0, maxDepth: 0 },
      });

      await expect(service.submitForReview(mockCreatorUser, 'version_1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if version is not in DRAFT', async () => {
      storyVersionsRepo.findById.mockResolvedValue({
        ...mockDraftVersion,
        status: 'IN_REVIEW',
      } as any);
      storiesRepo.findById.mockResolvedValue(mockStory as any);
      creatorsRepo.findByUserId.mockResolvedValue(mockCreator as any);

      await expect(service.submitForReview(mockCreatorUser, 'version_1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('approveVersion (IN_REVIEW -> APPROVED)', () => {
    it('should allow admin to approve version in review', async () => {
      storyVersionsRepo.findById.mockResolvedValue({
        ...mockDraftVersion,
        status: 'IN_REVIEW',
      } as any);
      storyVersionsRepo.update.mockResolvedValue({
        ...mockDraftVersion,
        status: 'APPROVED',
        updatedAt: new Date(),
      } as any);

      const result = await service.approveVersion(mockAdminUser, 'version_1');
      expect(result.previousStatus).toBe('IN_REVIEW');
      expect(result.newStatus).toBe('APPROVED');
      expect(storyVersionsRepo.update).toHaveBeenCalledWith('version_1', { status: 'APPROVED' });
    });

    it('should throw ForbiddenException if caller is not admin', async () => {
      await expect(service.approveVersion(mockCreatorUser, 'version_1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if version is not in IN_REVIEW', async () => {
      storyVersionsRepo.findById.mockResolvedValue(mockDraftVersion as any); // status is DRAFT

      await expect(service.approveVersion(mockAdminUser, 'version_1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('rejectVersion (IN_REVIEW | APPROVED -> DRAFT)', () => {
    it('should allow admin to revert version back to DRAFT with feedback', async () => {
      storyVersionsRepo.findById.mockResolvedValue({
        ...mockDraftVersion,
        status: 'IN_REVIEW',
      } as any);
      storyVersionsRepo.update.mockResolvedValue({
        ...mockDraftVersion,
        status: 'DRAFT',
        updatedAt: new Date(),
      } as any);

      const result = await service.rejectVersion(mockAdminUser, 'version_1', {
        reason: 'Please add more choice depth to episode 3',
      });
      expect(result.previousStatus).toBe('IN_REVIEW');
      expect(result.newStatus).toBe('DRAFT');
      expect(storyVersionsRepo.update).toHaveBeenCalledWith('version_1', { status: 'DRAFT' });
    });
  });

  describe('publishVersion (APPROVED -> PUBLISHED)', () => {
    const mockApprovedVersion = {
      ...mockDraftVersion,
      status: 'APPROVED' as const,
    };

    it('should publish approved version, archive previous published version, and mark story PUBLISHED', async () => {
      storyVersionsRepo.findById.mockResolvedValue(mockApprovedVersion as any);
      storiesRepo.findById.mockResolvedValue(mockStory as any);
      creatorsRepo.findByUserId.mockResolvedValue(mockCreator as any);
      dagValidatorService.validate.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        stats: { nodeCount: 1, choiceCount: 0, endingCount: 1, maxDepth: 1 },
      });
      storyNodesRepo.findByVersionId.mockResolvedValue([
        { id: 'node_1', episodeId: 'ep_1', nodeType: 'ENDING' } as any,
      ]);
      videosRepo.findByEpisodeId.mockResolvedValue({
        id: 'vid_1',
        episodeId: 'ep_1',
        status: 'READY',
      } as any);
      interactiveService.getFullGraph.mockResolvedValue({
        storyId: 'story_1',
        versionId: 'version_1',
        versionNumber: 1,
        status: 'PUBLISHED',
        nodes: [],
        edges: [],
      });
      storyVersionsRepo.update.mockResolvedValue({
        ...mockApprovedVersion,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await service.publishVersion(mockCreatorUser, 'version_1');
      expect(result.newStatus).toBe('PUBLISHED');
      expect(storyVersionsRepo.archivePublishedForStory).toHaveBeenCalledWith('story_1', 'version_1');
      expect(storiesRepo.update).toHaveBeenCalledWith('story_1', { status: 'PUBLISHED' });
    });

    it('should reject publish if creator attempts to publish without prior approval', async () => {
      storyVersionsRepo.findById.mockResolvedValue(mockDraftVersion as any); // status is DRAFT
      storiesRepo.findById.mockResolvedValue(mockStory as any);
      creatorsRepo.findByUserId.mockResolvedValue(mockCreator as any);

      await expect(service.publishVersion(mockCreatorUser, 'version_1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject publish if any episode video is not READY (ENG-009)', async () => {
      storyVersionsRepo.findById.mockResolvedValue(mockApprovedVersion as any);
      storiesRepo.findById.mockResolvedValue(mockStory as any);
      creatorsRepo.findByUserId.mockResolvedValue(mockCreator as any);
      dagValidatorService.validate.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        stats: { nodeCount: 1, choiceCount: 0, endingCount: 1, maxDepth: 1 },
      });
      storyNodesRepo.findByVersionId.mockResolvedValue([
        { id: 'node_1', episodeId: 'ep_1', nodeType: 'ENDING' } as any,
      ]);
      videosRepo.findByEpisodeId.mockResolvedValue({
        id: 'vid_1',
        episodeId: 'ep_1',
        status: 'PROCESSING', // Not READY!
      } as any);

      await expect(service.publishVersion(mockCreatorUser, 'version_1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('archiveVersion (PUBLISHED -> ARCHIVED)', () => {
    it('should allow archiving a published version', async () => {
      const mockPublished = {
        ...mockDraftVersion,
        status: 'PUBLISHED' as const,
        publishedAt: new Date(),
      };
      storyVersionsRepo.findById.mockResolvedValue(mockPublished as any);
      storiesRepo.findById.mockResolvedValue(mockStory as any);
      creatorsRepo.findByUserId.mockResolvedValue(mockCreator as any);
      storyVersionsRepo.update.mockResolvedValue({
        ...mockPublished,
        status: 'ARCHIVED',
        archivedAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await service.archiveVersion(mockCreatorUser, 'version_1');
      expect(result.previousStatus).toBe('PUBLISHED');
      expect(result.newStatus).toBe('ARCHIVED');
      expect(storyVersionsRepo.update).toHaveBeenCalledWith(
        'version_1',
        expect.objectContaining({ status: 'ARCHIVED' }),
      );
    });

    it('should reject archiving if version is not in PUBLISHED status', async () => {
      storyVersionsRepo.findById.mockResolvedValue(mockDraftVersion as any); // status is DRAFT
      storiesRepo.findById.mockResolvedValue(mockStory as any);
      creatorsRepo.findByUserId.mockResolvedValue(mockCreator as any);

      await expect(service.archiveVersion(mockCreatorUser, 'version_1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getReviewQueue', () => {
    it('should return all versions with status IN_REVIEW for admin', async () => {
      const queueItems = [
        { id: 'v1', status: 'IN_REVIEW', versionNumber: 1 } as any,
        { id: 'v2', status: 'IN_REVIEW', versionNumber: 2 } as any,
      ];
      storyVersionsRepo.findByStatus.mockResolvedValue(queueItems);

      const result = await service.getReviewQueue(mockAdminUser);
      expect(result).toHaveLength(2);
      expect(storyVersionsRepo.findByStatus).toHaveBeenCalledWith('IN_REVIEW');
    });

    it('should throw ForbiddenException if non-admin accesses review queue', async () => {
      await expect(service.getReviewQueue(mockCreatorUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
