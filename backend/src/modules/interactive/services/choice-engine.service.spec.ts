import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { ChoiceEngineService } from './choice-engine.service';
import { StoryVersionsRepository } from '../repositories/story-versions.repository';
import { StoryNodesRepository } from '../repositories/story-nodes.repository';
import { ChoicesRepository } from '../repositories/choices.repository';
import { ChoiceOptionsRepository } from '../repositories/choice-options.repository';
import { UserChoicesRepository } from '../repositories/user-choices.repository';
import { XpLedgerRepository } from '../repositories/xp-ledger.repository';
import { EpisodesRepository } from '../../content/repositories/episodes.repository';
import { VideosService } from '../../videos/services/videos.service';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';

describe('ChoiceEngineService', () => {
  let service: ChoiceEngineService;
  let storyVersionsRepo: jest.Mocked<StoryVersionsRepository>;
  let storyNodesRepo: jest.Mocked<StoryNodesRepository>;
  let choicesRepo: jest.Mocked<ChoicesRepository>;
  let choiceOptionsRepo: jest.Mocked<ChoiceOptionsRepository>;
  let userChoicesRepo: jest.Mocked<UserChoicesRepository>;
  let xpLedgerRepo: jest.Mocked<XpLedgerRepository>;
  let episodesRepo: jest.Mocked<EpisodesRepository>;
  let videosService: jest.Mocked<VideosService>;
  let dbService: { getDb: jest.Mock };

  const mockUser: AuthenticatedUser = {
    id: 'user_consumer_1',
    externalSubjectId: 'auth0|consumer1',
    externalAuthProvider: 'AUTH0',
    email: 'consumer@shortreel.com',
    displayName: 'Viewer One',
    avatarUrl: null,
    status: 'ACTIVE',
    roles: ['USER'],
    permissions: [],
  };

  const mockPublishedVersion = {
    id: 'version_published_1',
    storyId: 'story_1',
    versionNumber: 1,
    status: 'PUBLISHED' as const,
    graphSnapshot: null,
    rootNodeId: 'node_1',
    publishedAt: new Date(),
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockChoiceNode = {
    id: 'node_3',
    storyVersionId: 'version_published_1',
    episodeId: 'ep_3',
    nodeType: 'CHOICE_POINT' as const,
    isRoot: false,
    sequenceOrder: 2,
    votingEndsAt: null,
    fallbackOptionId: 'option_b',
    createdAt: new Date(),
  };

  const mockChoice = {
    id: 'choice_1',
    storyNodeId: 'node_3',
    prompt: 'Confront or Follow?',
    votingOpensAt: null,
    votingEndsAt: null,
    createdAt: new Date(),
  };

  const mockOptionA = {
    id: 'option_a',
    choiceId: 'choice_1',
    label: 'Confront the suspect',
    destinationNodeId: 'node_4a',
    voteCount: 10,
    displayOrder: 1,
    createdAt: new Date(),
  };

  const mockDestinationNode4A = {
    id: 'node_4a',
    storyVersionId: 'version_published_1',
    episodeId: 'ep_4a',
    nodeType: 'STANDARD' as const,
    isRoot: false,
    sequenceOrder: 3,
    votingEndsAt: null,
    fallbackOptionId: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockStoryVersionsRepo = {
      findById: jest.fn(),
    };
    const mockStoryNodesRepo = {
      findById: jest.fn(),
    };
    const mockChoicesRepo = {
      findById: jest.fn(),
      findByNodeId: jest.fn(),
    };
    const mockChoiceOptionsRepo = {
      findById: jest.fn(),
      findByChoiceId: jest.fn(),
      incrementVoteCount: jest.fn(),
    };
    const mockUserChoicesRepo = {
      create: jest.fn(),
      findByUserAndChoice: jest.fn(),
      findByUserAndVersion: jest.fn(),
    };
    const mockXpLedgerRepo = {
      create: jest.fn(),
    };
    const mockEpisodesRepo = {
      findById: jest.fn(),
    };
    const mockVideosService = {
      getPlaybackStream: jest.fn(),
    };

    const mockTx = {};
    const mockDb = {
      transaction: jest.fn(async (cb) => cb(mockTx)),
    };
    dbService = {
      getDb: jest.fn().mockReturnValue(mockDb),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChoiceEngineService,
        { provide: DRIZZLE_DB, useValue: dbService },
        { provide: StoryVersionsRepository, useValue: mockStoryVersionsRepo },
        { provide: StoryNodesRepository, useValue: mockStoryNodesRepo },
        { provide: ChoicesRepository, useValue: mockChoicesRepo },
        { provide: ChoiceOptionsRepository, useValue: mockChoiceOptionsRepo },
        { provide: UserChoicesRepository, useValue: mockUserChoicesRepo },
        { provide: XpLedgerRepository, useValue: mockXpLedgerRepo },
        { provide: EpisodesRepository, useValue: mockEpisodesRepo },
        { provide: VideosService, useValue: mockVideosService },
      ],
    }).compile();

    service = module.get<ChoiceEngineService>(ChoiceEngineService);
    storyVersionsRepo = module.get(StoryVersionsRepository);
    storyNodesRepo = module.get(StoryNodesRepository);
    choicesRepo = module.get(ChoicesRepository);
    choiceOptionsRepo = module.get(ChoiceOptionsRepository);
    userChoicesRepo = module.get(UserChoicesRepository);
    xpLedgerRepo = module.get(XpLedgerRepository);
    episodesRepo = module.get(EpisodesRepository);
    videosService = module.get(VideosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resolveChoice (Invariant ENG-001: Valid choice on open window)', () => {
    it('should record user_choice, award 50 XP in xp_ledger, increment voteCount, and return next destination with stream', async () => {
      storyVersionsRepo.findById.mockResolvedValue(mockPublishedVersion as any);
      choicesRepo.findById.mockResolvedValue(mockChoice as any);
      storyNodesRepo.findById.mockImplementation(async (id) => {
        if (id === 'node_3') return mockChoiceNode as any;
        if (id === 'node_4a') return mockDestinationNode4A as any;
        return null;
      });
      choiceOptionsRepo.findById.mockResolvedValue(mockOptionA as any);
      userChoicesRepo.findByUserAndChoice.mockResolvedValue(null); // not already chosen

      const createdChoice = {
        id: 'uc_123',
        userId: mockUser.id,
        choiceId: 'choice_1',
        choiceOptionId: 'option_a',
        storyVersionId: mockPublishedVersion.id,
        isFallback: false,
        createdAt: new Date(),
      };
      userChoicesRepo.create.mockResolvedValue(createdChoice as any);
      episodesRepo.findById.mockResolvedValue({
        id: 'ep_4a',
        title: 'Episode 4A: The Confrontation',
        episodeNumber: 4,
      } as any);
      choicesRepo.findByNodeId.mockResolvedValue(null); // no choice at 4A
      videosService.getPlaybackStream.mockResolvedValue({
        playbackUrl: 'https://customer-xyz.cloudflarestream.com/token/manifest/video.m3u8',
        expiresAt: new Date().toISOString(),
        episodeId: 'ep_4a',
        hasChoice: false,
        isFree: true,
        durationSeconds: 120,
      });

      const result = await service.resolveChoice(mockUser, {
        choiceId: 'choice_1',
        choiceOptionId: 'option_a',
        storyVersionId: mockPublishedVersion.id,
      });

      expect(result.userChoice.id).toBe('uc_123');
      expect(result.userChoice.choiceOptionId).toBe('option_a');
      expect(result.xpAwarded).toBe(50);
      expect(result.destinationNode.id).toBe('node_4a');
      expect(result.destinationNode.playbackUrl).toContain('cloudflarestream.com');
      expect(result.destinationNode.hasChoice).toBe(false);

      expect(userChoicesRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          choiceId: 'choice_1',
          choiceOptionId: 'option_a',
          isFallback: false,
        }),
        expect.anything(),
      );
      expect(choiceOptionsRepo.incrementVoteCount).toHaveBeenCalledWith('option_a', expect.anything());
      expect(xpLedgerRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          action: 'CHOICE_MADE',
          points: 50,
        }),
        expect.anything(),
      );
    });
  });

  describe('resolveChoice (Invariant ENG-002: Duplicate submission idempotency)', () => {
    it('should return existing choice with 0 XP and destination node without creating duplicate records', async () => {
      storyVersionsRepo.findById.mockResolvedValue(mockPublishedVersion as any);
      choicesRepo.findById.mockResolvedValue(mockChoice as any);
      storyNodesRepo.findById.mockImplementation(async (id) => {
        if (id === 'node_3') return mockChoiceNode as any;
        if (id === 'node_4a') return mockDestinationNode4A as any;
        return null;
      });
      choiceOptionsRepo.findById.mockResolvedValue(mockOptionA as any);

      const existingChoice = {
        id: 'uc_existing_1',
        userId: mockUser.id,
        choiceId: 'choice_1',
        choiceOptionId: 'option_a',
        storyVersionId: mockPublishedVersion.id,
        isFallback: false,
        createdAt: new Date('2026-10-01T10:00:00Z'),
      };
      userChoicesRepo.findByUserAndChoice.mockResolvedValue(existingChoice as any);
      episodesRepo.findById.mockResolvedValue({ id: 'ep_4a', title: 'Ep 4A' } as any);
      videosService.getPlaybackStream.mockResolvedValue({ playbackUrl: 'https://stream.url' } as any);

      const result = await service.resolveChoice(mockUser, {
        choiceId: 'choice_1',
        choiceOptionId: 'option_a',
        storyVersionId: mockPublishedVersion.id,
      });

      expect(result.userChoice.id).toBe('uc_existing_1');
      expect(result.xpAwarded).toBe(0); // No duplicate XP!
      expect(userChoicesRepo.create).not.toHaveBeenCalled();
      expect(xpLedgerRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('resolveChoice (Invariant ENG-003: Voting window closed)', () => {
    it('should throw ConflictException if voting deadline has passed', async () => {
      storyVersionsRepo.findById.mockResolvedValue(mockPublishedVersion as any);
      choicesRepo.findById.mockResolvedValue({
        ...mockChoice,
        votingEndsAt: new Date(Date.now() - 60000), // 1 minute in the past
      } as any);
      storyNodesRepo.findById.mockResolvedValue(mockChoiceNode as any);
      choiceOptionsRepo.findById.mockResolvedValue(mockOptionA as any);

      await expect(
        service.resolveChoice(mockUser, {
          choiceId: 'choice_1',
          choiceOptionId: 'option_a',
          storyVersionId: mockPublishedVersion.id,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('resolveChoice (Invariant ENG-004: Invalid choice option)', () => {
    it('should throw NotFoundException if choiceOptionId does not belong to choice', async () => {
      storyVersionsRepo.findById.mockResolvedValue(mockPublishedVersion as any);
      choicesRepo.findById.mockResolvedValue(mockChoice as any);
      storyNodesRepo.findById.mockResolvedValue(mockChoiceNode as any);
      choiceOptionsRepo.findById.mockResolvedValue(null); // Option doesn't exist

      await expect(
        service.resolveChoice(mockUser, {
          choiceId: 'choice_1',
          choiceOptionId: 'invalid_option_id',
          storyVersionId: mockPublishedVersion.id,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('resolveChoice (Invariant ENG-005: Access DRAFT version as consumer)', () => {
    it('should throw ForbiddenException if story version is not PUBLISHED or ARCHIVED', async () => {
      storyVersionsRepo.findById.mockResolvedValue({
        ...mockPublishedVersion,
        status: 'DRAFT',
      } as any);

      await expect(
        service.resolveChoice(mockUser, {
          choiceId: 'choice_1',
          choiceOptionId: 'option_a',
          storyVersionId: 'draft_version',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('resolveChoice (Invariant ENG-006: Access ARCHIVED version)', () => {
    it('should throw BadRequestException for choice writes on ARCHIVED version', async () => {
      storyVersionsRepo.findById.mockResolvedValue({
        ...mockPublishedVersion,
        status: 'ARCHIVED',
      } as any);

      await expect(
        service.resolveChoice(mockUser, {
          choiceId: 'choice_1',
          choiceOptionId: 'option_a',
          storyVersionId: 'archived_version',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('resolveChoice (Invariant ENG-010: Concurrent choice submission race condition)', () => {
    it('should catch ER_DUP_ENTRY unique constraint violation and return existing choice with 0 XP', async () => {
      storyVersionsRepo.findById.mockResolvedValue(mockPublishedVersion as any);
      choicesRepo.findById.mockResolvedValue(mockChoice as any);
      storyNodesRepo.findById.mockImplementation(async (id) => {
        if (id === 'node_3') return mockChoiceNode as any;
        if (id === 'node_4a') return mockDestinationNode4A as any;
        return null;
      });
      choiceOptionsRepo.findById.mockResolvedValue(mockOptionA as any);

      // Initially findByUserAndChoice returns null (simulating concurrent check before insert)
      userChoicesRepo.findByUserAndChoice.mockResolvedValueOnce(null);

      // Simulate MySQL ER_DUP_ENTRY error during transaction
      const dupError: any = new Error('Duplicate entry for key uq_uc_user_choice');
      dupError.code = 'ER_DUP_ENTRY';
      const mockDb = {
        transaction: jest.fn(async () => {
          throw dupError;
        }),
      };
      dbService.getDb.mockReturnValue(mockDb);

      // After catch, secondary lookup finds the winner's choice
      const winnerChoice = {
        id: 'uc_race_winner',
        userId: mockUser.id,
        choiceId: 'choice_1',
        choiceOptionId: 'option_a',
        storyVersionId: mockPublishedVersion.id,
        isFallback: false,
        createdAt: new Date(),
      };
      userChoicesRepo.findByUserAndChoice.mockResolvedValueOnce(winnerChoice as any);
      episodesRepo.findById.mockResolvedValue({ id: 'ep_4a', title: 'Ep 4A' } as any);
      videosService.getPlaybackStream.mockResolvedValue({ playbackUrl: 'https://stream.url' } as any);

      const result = await service.resolveChoice(mockUser, {
        choiceId: 'choice_1',
        choiceOptionId: 'option_a',
        storyVersionId: mockPublishedVersion.id,
      });

      expect(result.userChoice.id).toBe('uc_race_winner');
      expect(result.xpAwarded).toBe(0);
    });
  });

  describe('resolveFallback (Fallback auto-selection)', () => {
    it('should auto-pick fallback option with isFallback = true and award 0 XP', async () => {
      storyVersionsRepo.findById.mockResolvedValue(mockPublishedVersion as any);
      choicesRepo.findById.mockResolvedValue(mockChoice as any);
      storyNodesRepo.findById.mockImplementation(async (id) => {
        if (id === 'node_3') return mockChoiceNode as any;
        if (id === 'node_4a') return mockDestinationNode4A as any;
        return null;
      });
      choiceOptionsRepo.findById.mockResolvedValue(mockOptionA as any);
      userChoicesRepo.findByUserAndChoice.mockResolvedValue(null);

      userChoicesRepo.create.mockResolvedValue({
        id: 'uc_fallback_1',
        userId: mockUser.id,
        choiceId: 'choice_1',
        choiceOptionId: 'option_b',
        storyVersionId: mockPublishedVersion.id,
        isFallback: true,
        createdAt: new Date(),
      } as any);

      episodesRepo.findById.mockResolvedValue({ id: 'ep_4a', title: 'Ep 4A' } as any);
      videosService.getPlaybackStream.mockResolvedValue({ playbackUrl: 'https://stream.url' } as any);

      const result = await service.resolveFallback(
        mockUser,
        'choice_1',
        mockPublishedVersion.id,
      );

      expect(result.userChoice.isFallback).toBe(true);
      expect(result.xpAwarded).toBe(0);
    });
  });
});
