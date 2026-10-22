import { Test, TestingModule } from '@nestjs/testing';
import { InteractiveController } from './interactive.controller';
import { InteractiveService } from '../services/interactive.service';
import { ChoiceEngineService } from '../services/choice-engine.service';
import { StoryLifecycleService } from '../services/story-lifecycle.service';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';

describe('InteractiveController', () => {
  let controller: InteractiveController;
  let service: jest.Mocked<InteractiveService>;
  let choiceEngineService: jest.Mocked<ChoiceEngineService>;
  let storyLifecycleService: jest.Mocked<StoryLifecycleService>;

  const mockUser: AuthenticatedUser = {
    id: 'user_1',
    externalSubjectId: 'auth0|1',
    externalAuthProvider: 'AUTH0',
    email: 'creator@shortreel.com',
    displayName: 'Creator One',
    avatarUrl: null,
    status: 'ACTIVE',
    roles: ['CREATOR'],
    permissions: [],
  };

  const mockAdminUser: AuthenticatedUser = {
    id: 'user_admin',
    externalSubjectId: 'auth0|admin',
    externalAuthProvider: 'AUTH0',
    email: 'admin@shortreel.com',
    displayName: 'Admin One',
    avatarUrl: null,
    status: 'ACTIVE',
    roles: ['SUPER_ADMIN', 'CONTENT_ADMIN'],
    permissions: [],
  };

  beforeEach(async () => {
    const mockInteractiveService = {
      getStoryVersions: jest.fn(),
      createVersion: jest.fn(),
      getPublishedGraphForStory: jest.fn(),
      getFullGraph: jest.fn(),
      validateGraph: jest.fn(),
      createNode: jest.fn(),
      updateNode: jest.fn(),
      deleteNode: jest.fn(),
      addChoiceToNode: jest.fn(),
      addChoiceOption: jest.fn(),
    };

    const mockChoiceEngineService = {
      resolveChoice: jest.fn(),
      resolveFallback: jest.fn(),
      getUserChoicesForVersion: jest.fn(),
    };

    const mockStoryLifecycleService = {
      submitForReview: jest.fn(),
      approveVersion: jest.fn(),
      rejectVersion: jest.fn(),
      publishVersion: jest.fn(),
      archiveVersion: jest.fn(),
      getReviewQueue: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InteractiveController],
      providers: [
        { provide: InteractiveService, useValue: mockInteractiveService },
        { provide: ChoiceEngineService, useValue: mockChoiceEngineService },
        { provide: StoryLifecycleService, useValue: mockStoryLifecycleService },
      ],
    }).compile();

    controller = module.get<InteractiveController>(InteractiveController);
    service = module.get(InteractiveService);
    choiceEngineService = module.get(ChoiceEngineService);
    storyLifecycleService = module.get(StoryLifecycleService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getStoryVersions should call service and wrap in ApiResponseDto', async () => {
    service.getStoryVersions.mockResolvedValue([
      { id: 'v1', storyId: 's1', versionNumber: 1, status: 'DRAFT' } as any,
    ]);

    const res = await controller.getStoryVersions('s1');
    expect(res.data).toHaveLength(1);
    expect(service.getStoryVersions).toHaveBeenCalledWith('s1');
  });

  it('createVersion should call service with current user and storyId', async () => {
    service.createVersion.mockResolvedValue({
      id: 'v1',
      storyId: 's1',
      versionNumber: 1,
      status: 'DRAFT',
    } as any);

    const res = await controller.createVersion(mockUser, 's1');
    expect(res.data.id).toBe('v1');
    expect(service.createVersion).toHaveBeenCalledWith(mockUser, 's1');
  });

  it('getPublishedGraph should call service.getPublishedGraphForStory', async () => {
    service.getPublishedGraphForStory.mockResolvedValue({
      storyId: 's1',
      versionId: 'v1',
      versionNumber: 1,
      status: 'PUBLISHED',
      nodes: [],
      edges: [],
    });

    const res = await controller.getPublishedGraph('s1');
    expect(res.data.status).toBe('PUBLISHED');
    expect(service.getPublishedGraphForStory).toHaveBeenCalledWith('s1');
  });

  it('validateGraph should call service.validateGraph', async () => {
    service.validateGraph.mockResolvedValue({
      isValid: true,
      errors: [],
      warnings: [],
      stats: { nodeCount: 3, choiceCount: 1, endingCount: 2, maxDepth: 2 },
    });

    const res = await controller.validateGraph('v1');
    expect(res.data.isValid).toBe(true);
    expect(service.validateGraph).toHaveBeenCalledWith('v1');
  });

  it('submitForReview should call storyLifecycleService.submitForReview', async () => {
    storyLifecycleService.submitForReview.mockResolvedValue({
      versionId: 'v1',
      storyId: 's1',
      versionNumber: 1,
      previousStatus: 'DRAFT',
      newStatus: 'IN_REVIEW',
      updatedAt: new Date(),
    });

    const res = await controller.submitForReview(mockUser, 'v1');
    expect(res.data.newStatus).toBe('IN_REVIEW');
    expect(storyLifecycleService.submitForReview).toHaveBeenCalledWith(mockUser, 'v1');
  });

  it('approveVersion should call storyLifecycleService.approveVersion', async () => {
    storyLifecycleService.approveVersion.mockResolvedValue({
      versionId: 'v1',
      storyId: 's1',
      versionNumber: 1,
      previousStatus: 'IN_REVIEW',
      newStatus: 'APPROVED',
      updatedAt: new Date(),
    });

    const res = await controller.approveVersion(mockAdminUser, 'v1');
    expect(res.data.newStatus).toBe('APPROVED');
    expect(storyLifecycleService.approveVersion).toHaveBeenCalledWith(mockAdminUser, 'v1');
  });

  it('rejectVersion should call storyLifecycleService.rejectVersion', async () => {
    storyLifecycleService.rejectVersion.mockResolvedValue({
      versionId: 'v1',
      storyId: 's1',
      versionNumber: 1,
      previousStatus: 'IN_REVIEW',
      newStatus: 'DRAFT',
      updatedAt: new Date(),
    });

    const res = await controller.rejectVersion(mockAdminUser, 'v1', { reason: 'Fix node 3 choices' });
    expect(res.data.newStatus).toBe('DRAFT');
    expect(storyLifecycleService.rejectVersion).toHaveBeenCalledWith(mockAdminUser, 'v1', { reason: 'Fix node 3 choices' });
  });

  it('publishVersion should call storyLifecycleService.publishVersion', async () => {
    storyLifecycleService.publishVersion.mockResolvedValue({
      versionId: 'v1',
      storyId: 's1',
      versionNumber: 1,
      previousStatus: 'APPROVED',
      newStatus: 'PUBLISHED',
      publishedAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await controller.publishVersion(mockUser, 'v1');
    expect(res.data.newStatus).toBe('PUBLISHED');
    expect(storyLifecycleService.publishVersion).toHaveBeenCalledWith(mockUser, 'v1');
  });

  it('archiveVersion should call storyLifecycleService.archiveVersion', async () => {
    storyLifecycleService.archiveVersion.mockResolvedValue({
      versionId: 'v1',
      storyId: 's1',
      versionNumber: 1,
      previousStatus: 'PUBLISHED',
      newStatus: 'ARCHIVED',
      archivedAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await controller.archiveVersion(mockUser, 'v1');
    expect(res.data.newStatus).toBe('ARCHIVED');
    expect(storyLifecycleService.archiveVersion).toHaveBeenCalledWith(mockUser, 'v1');
  });

  it('getReviewQueue should call storyLifecycleService.getReviewQueue', async () => {
    storyLifecycleService.getReviewQueue.mockResolvedValue([
      { id: 'v1', storyId: 's1', versionNumber: 1, status: 'IN_REVIEW' } as any,
    ]);

    const res = await controller.getReviewQueue(mockAdminUser);
    expect(res.data).toHaveLength(1);
    expect(storyLifecycleService.getReviewQueue).toHaveBeenCalledWith(mockAdminUser);
  });

  it('submitChoice should call choiceEngineService.resolveChoice', async () => {
    const resolutionDto = {
      userChoice: {
        id: 'uc_1',
        userId: mockUser.id,
        choiceId: 'c1',
        choiceOptionId: 'opt1',
        storyVersionId: 'v1',
        isFallback: false,
        createdAt: new Date(),
      },
      destinationNode: {
        id: 'node2',
        episodeId: 'ep2',
        nodeType: 'STANDARD',
        playbackUrl: 'https://stream.url',
        hasChoice: false,
      },
      xpAwarded: 50,
    };
    choiceEngineService.resolveChoice.mockResolvedValue(resolutionDto);

    const res = await controller.submitChoice(mockUser, {
      choiceId: 'c1',
      choiceOptionId: 'opt1',
      storyVersionId: 'v1',
    });

    expect(res.data.xpAwarded).toBe(50);
    expect(res.data.userChoice.id).toBe('uc_1');
    expect(choiceEngineService.resolveChoice).toHaveBeenCalledWith(mockUser, {
      choiceId: 'c1',
      choiceOptionId: 'opt1',
      storyVersionId: 'v1',
    });
  });

  it('resolveFallback should call choiceEngineService.resolveFallback', async () => {
    const fallbackDto = {
      userChoice: {
        id: 'uc_fallback',
        userId: mockUser.id,
        choiceId: 'c1',
        choiceOptionId: 'opt_default',
        storyVersionId: 'v1',
        isFallback: true,
        createdAt: new Date(),
      },
      destinationNode: {
        id: 'node2',
        episodeId: 'ep2',
        nodeType: 'STANDARD',
        playbackUrl: 'https://stream.url',
        hasChoice: false,
      },
      xpAwarded: 0,
    };
    choiceEngineService.resolveFallback.mockResolvedValue(fallbackDto);

    const res = await controller.resolveFallback(mockUser, 'c1', 'v1');
    expect(res.data.xpAwarded).toBe(0);
    expect(res.data.userChoice.isFallback).toBe(true);
    expect(choiceEngineService.resolveFallback).toHaveBeenCalledWith(mockUser, 'c1', 'v1');
  });

  it('getMyChoices should call choiceEngineService.getUserChoicesForVersion', async () => {
    choiceEngineService.getUserChoicesForVersion.mockResolvedValue([
      {
        id: 'uc_1',
        userId: mockUser.id,
        choiceId: 'c1',
        choiceOptionId: 'opt1',
        storyVersionId: 'v1',
        isFallback: false,
        createdAt: new Date(),
      },
    ]);

    const res = await controller.getMyChoices(mockUser, 'v1');
    expect(res.data).toHaveLength(1);
    expect(choiceEngineService.getUserChoicesForVersion).toHaveBeenCalledWith(mockUser.id, 'v1');
  });
});
