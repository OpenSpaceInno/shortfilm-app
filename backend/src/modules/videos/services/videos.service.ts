import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { VIDEO_PROVIDER, VideoProvider } from '../interfaces/video-provider.interface';
import { VideosRepository } from '../repositories/videos.repository';
import { WebhookEventsRepository } from '../repositories/webhook-events.repository';
import { EpisodesRepository } from '../../content/repositories/episodes.repository';
import { SeasonsRepository } from '../../content/repositories/seasons.repository';
import { StoriesRepository } from '../../content/repositories/stories.repository';
import { CreatorsRepository } from '../../content/repositories/creators.repository';
import { CreateDirectUploadDto, DirectUploadResponseDto } from '../dto/direct-upload.dto';
import { PlaybackStreamResponseDto } from '../dto/playback-stream.dto';
import { CloudflareWebhookPayload } from '../dto/cloudflare-webhook.dto';
import { generateUlid } from '../../../database/utils/ulid.util';
import { AuthenticatedUser } from '../../auth/interfaces/auth0-payload.interface';

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);

  constructor(
    @Inject(VIDEO_PROVIDER) private readonly videoProvider: VideoProvider,
    private readonly videosRepository: VideosRepository,
    private readonly webhookEventsRepository: WebhookEventsRepository,
    private readonly episodesRepository: EpisodesRepository,
    private readonly seasonsRepository: SeasonsRepository,
    private readonly storiesRepository: StoriesRepository,
    private readonly creatorsRepository: CreatorsRepository,
  ) {}

  async getDirectUploadUrl(
    user: AuthenticatedUser,
    dto: CreateDirectUploadDto,
  ): Promise<DirectUploadResponseDto> {
    const episode = await this.episodesRepository.findById(dto.episodeId);
    if (!episode) {
      throw new NotFoundException(`Episode with ID '${dto.episodeId}' not found`);
    }

    const season = await this.seasonsRepository.findById(episode.seasonId);
    if (!season) {
      throw new NotFoundException(`Season for episode '${dto.episodeId}' not found`);
    }

    const story = await this.storiesRepository.findById(season.storyId);
    if (!story) {
      throw new NotFoundException(`Story for season '${season.id}' not found`);
    }

    // Verify creator ownership unless user is platform admin
    const isAdmin = user.roles?.includes('SUPER_ADMIN') || user.roles?.includes('CONTENT_ADMIN');
    if (!isAdmin) {
      const creator = await this.creatorsRepository.findByUserId(user.id);
      if (!creator || creator.id !== story.creatorId) {
        throw new ForbiddenException('Forbidden: You can only upload video to stories you own');
      }
    }

    const { uploadUrl, providerUid } = await this.videoProvider.getDirectUploadUrl({
      episodeId: dto.episodeId,
      maxDurationSeconds: dto.maxDurationSeconds,
      creatorId: user.id,
    });

    const existingVideo = await this.videosRepository.findByEpisodeId(dto.episodeId);
    let videoId: string;

    if (existingVideo) {
      videoId = existingVideo.id;
      await this.videosRepository.update(existingVideo.id, {
        provider: 'CLOUDFLARE_STREAM',
        providerUid,
        status: 'UPLOADING',
      });
    } else {
      videoId = generateUlid();
      await this.videosRepository.create({
        id: videoId,
        episodeId: dto.episodeId,
        provider: 'CLOUDFLARE_STREAM',
        providerUid,
        status: 'UPLOADING',
      });
    }

    return {
      videoId,
      episodeId: dto.episodeId,
      uploadUrl,
      providerUid,
      provider: 'CLOUDFLARE_STREAM',
      status: 'UPLOADING',
    };
  }

  async getPlaybackStream(
    user: AuthenticatedUser | undefined,
    episodeId: string,
  ): Promise<PlaybackStreamResponseDto> {
    const episode = await this.episodesRepository.findById(episodeId);
    if (!episode) {
      throw new NotFoundException(`Episode with ID '${episodeId}' not found`);
    }

    // Entitlement Check:
    // If not free, user MUST be authenticated
    if (!episode.isFree && !user) {
      throw new UnauthorizedException(
        'SUBSCRIPTION_REQUIRED: Authentication required to stream premium episode',
      );
    }

    const video = await this.videosRepository.findByEpisodeId(episodeId);
    if (!video || !video.providerUid) {
      throw new NotFoundException(`Video asset for episode '${episodeId}' not found`);
    }

    if (video.status !== 'READY') {
      throw new BadRequestException(
        `VIDEO_NOT_READY: Video status is '${video.status}'. Please wait for transcoding to complete.`,
      );
    }

    const expiresInSeconds = 14400; // 4 hours
    const playbackUrl = await this.videoProvider.generateSignedPlaybackUrl(
      video.providerUid,
      expiresInSeconds,
    );

    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    this.logger.log(
      `Stream playback token issued for episode ${episodeId}, user=${user?.id || 'anonymous'}`,
    );

    return {
      playbackUrl,
      expiresAt,
      episodeId,
      nodeId: null,
      hasChoice: false,
      isFree: episode.isFree,
      durationSeconds: video.durationSeconds,
      thumbnailUrl: video.thumbnailUrl,
    };
  }

  async handleCloudflareWebhook(
    signatureHeader: string,
    rawBody: string,
    payload: CloudflareWebhookPayload,
  ): Promise<{ received: boolean; status: string }> {
    const isValid = this.videoProvider.verifyWebhookSignature(signatureHeader, rawBody);
    if (!isValid) {
      this.logger.warn('Cloudflare Stream webhook rejected: Invalid signature');
      throw new BadRequestException('Invalid webhook signature');
    }

    const eventState = payload.status?.state || 'unknown';
    const eventId = `${payload.uid}_${eventState}`;

    // Idempotency check: deduplicate using eventId in webhook_events
    const existing = await this.webhookEventsRepository.findByEventId(
      'CLOUDFLARE_STREAM',
      eventId,
    );

    if (existing) {
      this.logger.log(`Cloudflare webhook event '${eventId}' already processed (idempotent skipped)`);
      return { received: true, status: 'ALREADY_PROCESSED' };
    }

    const webhookEvent = await this.webhookEventsRepository.create({
      id: generateUlid(),
      provider: 'CLOUDFLARE_STREAM',
      eventId,
      eventType: `video.status.${eventState}`,
      payload,
      status: 'RECEIVED',
    });

    try {
      if (eventState === 'ready') {
        const playbackUrl =
          payload.playback?.hls || `https://videodelivery.net/${payload.uid}/manifest/video.m3u8`;
        const thumbnailUrl =
          payload.thumbnail || `https://videodelivery.net/${payload.uid}/thumbnails/thumbnail.jpg`;

        await this.videosRepository.updateByProviderUid(payload.uid, {
          status: 'READY',
          durationSeconds: Math.round(payload.duration || payload.input?.duration || 0),
          width: payload.input?.width || 1080,
          height: payload.input?.height || 1920,
          playbackUrl,
          thumbnailUrl,
        });

        this.logger.log(`Video '${payload.uid}' marked as READY from Cloudflare webhook`);
      } else if (eventState === 'error') {
        await this.videosRepository.updateByProviderUid(payload.uid, {
          status: 'FAILED',
        });
        this.logger.warn(`Video '${payload.uid}' marked as FAILED from Cloudflare webhook`);
      }

      await this.webhookEventsRepository.markProcessed(webhookEvent.id);
      return { received: true, status: 'PROCESSED' };
    } catch (err) {
      await this.webhookEventsRepository.markFailed(webhookEvent.id);
      this.logger.error(`Error processing Cloudflare webhook '${eventId}': ${err}`);
      throw err;
    }
  }

  async getVideoStatus(id: string) {
    const video = await this.videosRepository.findById(id);
    if (!video) {
      throw new NotFoundException(`Video with ID '${id}' not found`);
    }
    return video;
  }
}
