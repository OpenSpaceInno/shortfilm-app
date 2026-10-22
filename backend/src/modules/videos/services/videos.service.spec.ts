import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { VideosService } from './videos.service';
import { VideoProvider } from '../interfaces/video-provider.interface';
import { VideosRepository } from '../repositories/videos.repository';
import { WebhookEventsRepository } from '../repositories/webhook-events.repository';
import { EpisodesRepository } from '../../content/repositories/episodes.repository';
import { SeasonsRepository } from '../../content/repositories/seasons.repository';
import { StoriesRepository } from '../../content/repositories/stories.repository';
import { CreatorsRepository } from '../../content/repositories/creators.repository';

describe('VideosService', () => {
  let service: VideosService;
  let videoProvider: jest.Mocked<VideoProvider>;
  let videosRepo: jest.Mocked<VideosRepository>;
  let webhookEventsRepo: jest.Mocked<WebhookEventsRepository>;
  let episodesRepo: jest.Mocked<EpisodesRepository>;
  let seasonsRepo: jest.Mocked<SeasonsRepository>;
  let storiesRepo: jest.Mocked<StoriesRepository>;
  let creatorsRepo: jest.Mocked<CreatorsRepository>;

  const mockCreator = {
    id: '01HVG7J0000000000000000001',
    userId: '01HVG7J0000000000000000002',
    displayName: 'Elena Vance',
  };

  const mockStory = {
    id: '01HVG7J0000000000000000010',
    creatorId: mockCreator.id,
    title: 'The Quantum Divergence',
  };

  const mockSeason = {
    id: '01HVG7J0000000000000000020',
    storyId: mockStory.id,
    seasonNumber: 1,
  };

  const mockEpisodeFree = {
    id: '01HVG7J0000000000000000030',
    seasonId: mockSeason.id,
    title: 'Episode 1',
    isFree: true,
  };

  const mockEpisodePremium = {
    id: '01HVG7J0000000000000000031',
    seasonId: mockSeason.id,
    title: 'Episode 2',
    isFree: false,
  };

  const mockVideoReady = {
    id: '01HVG7J0000000000000000040',
    episodeId: mockEpisodeFree.id,
    provider: 'CLOUDFLARE_STREAM',
    providerUid: 'cf_uid_123',
    status: 'READY' as const,
    durationSeconds: 120,
    playbackUrl: 'https://videodelivery.net/cf_uid_123/manifest/video.m3u8',
    thumbnailUrl: 'https://videodelivery.net/cf_uid_123/thumbnails/thumb.jpg',
  };

  beforeEach(() => {
    videoProvider = {
      getDirectUploadUrl: jest.fn().mockResolvedValue({
        uploadUrl: 'https://upload.videodelivery.net/tus/mock_123',
        providerUid: 'cf_uid_123',
      }),
      generateSignedPlaybackUrl: jest.fn().mockResolvedValue(
        'https://videodelivery.net/cf_uid_123/manifest/video.m3u8?token=mock_jwt',
      ),
      getVideoMetadata: jest.fn(),
      deleteVideo: jest.fn(),
      verifyWebhookSignature: jest.fn().mockReturnValue(true),
    };

    videosRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEpisodeId: jest.fn(),
      findByProviderUid: jest.fn(),
      update: jest.fn(),
      updateByProviderUid: jest.fn(),
      upsertForEpisode: jest.fn(),
      delete: jest.fn(),
    } as any;

    webhookEventsRepo = {
      findByEventId: jest.fn(),
      create: jest.fn(),
      markProcessed: jest.fn(),
      markFailed: jest.fn(),
    } as any;

    episodesRepo = {
      findById: jest.fn(),
    } as any;

    seasonsRepo = {
      findById: jest.fn(),
    } as any;

    storiesRepo = {
      findById: jest.fn(),
    } as any;

    creatorsRepo = {
      findByUserId: jest.fn(),
    } as any;

    service = new VideosService(
      videoProvider,
      videosRepo,
      webhookEventsRepo,
      episodesRepo,
      seasonsRepo,
      storiesRepo,
      creatorsRepo,
    );
  });

  describe('getDirectUploadUrl', () => {
    it('should generate TUS upload URL when creator owns the story', async () => {
      episodesRepo.findById.mockResolvedValue(mockEpisodeFree as any);
      seasonsRepo.findById.mockResolvedValue(mockSeason as any);
      storiesRepo.findById.mockResolvedValue(mockStory as any);
      creatorsRepo.findByUserId.mockResolvedValue(mockCreator as any);
      videosRepo.findByEpisodeId.mockResolvedValue(null);
      videosRepo.create.mockResolvedValue(mockVideoReady as any);

      const mockUser = { id: mockCreator.userId, roles: ['CREATOR'] } as any;

      const result = await service.getDirectUploadUrl(mockUser, {
        episodeId: mockEpisodeFree.id,
      });

      expect(result.uploadUrl).toBe('https://upload.videodelivery.net/tus/mock_123');
      expect(result.providerUid).toBe('cf_uid_123');
      expect(videosRepo.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when creator does not own the story', async () => {
      episodesRepo.findById.mockResolvedValue(mockEpisodeFree as any);
      seasonsRepo.findById.mockResolvedValue(mockSeason as any);
      storiesRepo.findById.mockResolvedValue(mockStory as any);
      creatorsRepo.findByUserId.mockResolvedValue({
        id: 'different_creator_id',
        userId: 'different_user_id',
      } as any);

      const mockUser = { id: 'different_user_id', roles: ['CREATOR'] } as any;

      await expect(
        service.getDirectUploadUrl(mockUser, { episodeId: mockEpisodeFree.id }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getPlaybackStream', () => {
    it('should allow anonymous playback for free episodes', async () => {
      episodesRepo.findById.mockResolvedValue(mockEpisodeFree as any);
      videosRepo.findByEpisodeId.mockResolvedValue(mockVideoReady as any);

      const result = await service.getPlaybackStream(undefined, mockEpisodeFree.id);
      expect(result.playbackUrl).toContain('https://videodelivery.net/cf_uid_123');
      expect(result.isFree).toBe(true);
      expect(videoProvider.generateSignedPlaybackUrl).toHaveBeenCalledWith('cf_uid_123', 14400);
    });

    it('should reject anonymous playback for premium episodes with 401', async () => {
      episodesRepo.findById.mockResolvedValue(mockEpisodePremium as any);

      await expect(
        service.getPlaybackStream(undefined, mockEpisodePremium.id),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should allow authenticated users to stream premium episodes', async () => {
      episodesRepo.findById.mockResolvedValue(mockEpisodePremium as any);
      videosRepo.findByEpisodeId.mockResolvedValue({
        ...mockVideoReady,
        episodeId: mockEpisodePremium.id,
      } as any);

      const mockUser = { id: 'user_123', roles: ['USER'] } as any;
      const result = await service.getPlaybackStream(mockUser, mockEpisodePremium.id);

      expect(result.playbackUrl).toBeDefined();
      expect(result.isFree).toBe(false);
    });

    it('should throw BadRequestException if video status is not READY', async () => {
      episodesRepo.findById.mockResolvedValue(mockEpisodeFree as any);
      videosRepo.findByEpisodeId.mockResolvedValue({
        ...mockVideoReady,
        status: 'PROCESSING' as any,
      } as any);

      await expect(
        service.getPlaybackStream(undefined, mockEpisodeFree.id),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('handleCloudflareWebhook', () => {
    it('should reject webhooks with invalid signatures', async () => {
      videoProvider.verifyWebhookSignature.mockReturnValue(false);

      await expect(
        service.handleCloudflareWebhook('invalid_sig', '{}', {
          uid: 'test_uid',
          status: { state: 'ready' },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should idempotently skip duplicate webhook delivery', async () => {
      webhookEventsRepo.findByEventId.mockResolvedValue({ id: 'existing_event' } as any);

      const result = await service.handleCloudflareWebhook('valid_sig', '{}', {
        uid: 'test_uid',
        status: { state: 'ready' },
      });

      expect(result.status).toBe('ALREADY_PROCESSED');
      expect(videosRepo.updateByProviderUid).not.toHaveBeenCalled();
    });

    it('should update video to READY status and record processed event', async () => {
      webhookEventsRepo.findByEventId.mockResolvedValue(null);
      webhookEventsRepo.create.mockResolvedValue({ id: 'new_event_id' } as any);

      const result = await service.handleCloudflareWebhook('valid_sig', '{}', {
        uid: 'cf_uid_123',
        status: { state: 'ready' },
        duration: 95.5,
        playback: { hls: 'https://videodelivery.net/cf_uid_123/manifest/video.m3u8' },
      });

      expect(result.status).toBe('PROCESSED');
      expect(videosRepo.updateByProviderUid).toHaveBeenCalledWith(
        'cf_uid_123',
        expect.objectContaining({ status: 'READY', durationSeconds: 96 }),
      );
      expect(webhookEventsRepo.markProcessed).toHaveBeenCalledWith('new_event_id');
    });
  });
});
