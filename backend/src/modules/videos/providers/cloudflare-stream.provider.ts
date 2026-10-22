import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  VideoProvider,
  DirectUploadOptions,
  DirectUploadResult,
  VideoMetadata,
} from '../interfaces/video-provider.interface';

@Injectable()
export class CloudflareStreamProvider implements VideoProvider {
  private readonly logger = new Logger(CloudflareStreamProvider.name);
  private readonly accountId: string;
  private readonly apiToken: string;
  private readonly webhookSecret: string;
  private readonly keyId: string;
  private readonly jwkKey: string;

  constructor(private readonly configService: ConfigService) {
    this.accountId = this.configService.get<string>('CLOUDFLARE_STREAM_ACCOUNT_ID', '');
    this.apiToken = this.configService.get<string>('CLOUDFLARE_STREAM_API_TOKEN', '');
    this.webhookSecret = this.configService.get<string>('CLOUDFLARE_STREAM_WEBHOOK_SECRET', '');
    this.keyId = this.configService.get<string>('CLOUDFLARE_STREAM_KEY_ID', '');
    this.jwkKey = this.configService.get<string>('CLOUDFLARE_STREAM_JWK_KEY', '');
  }

  private get isConfigured(): boolean {
    return Boolean(this.accountId && this.apiToken);
  }

  async getDirectUploadUrl(options: DirectUploadOptions): Promise<DirectUploadResult> {
    const maxDurationSeconds = options.maxDurationSeconds || 3600;

    if (this.isConfigured) {
      try {
        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream/direct_upload`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.apiToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              maxDurationSeconds,
              requireSignedURLs: true,
              meta: {
                episodeId: options.episodeId,
                creatorId: options.creatorId || 'unknown',
              },
            }),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          this.logger.error(`Cloudflare Stream API error: ${response.status} - ${errorText}`);
          throw new Error(`Cloudflare direct upload failed: ${response.statusText}`);
        }

        const data = (await response.json()) as any;
        return {
          uploadUrl: data.result.uploadURL,
          providerUid: data.result.uid,
        };
      } catch (err) {
        this.logger.warn(`Cloudflare API call failed, falling back to mock provider: ${err}`);
      }
    }

    // Local / Testing Fallback
    const mockUid = `cf_${options.episodeId.slice(-8)}_${crypto.randomBytes(4).toString('hex')}`;
    return {
      uploadUrl: `https://upload.videodelivery.net/tus/mock_${mockUid}`,
      providerUid: mockUid,
    };
  }

  async generateSignedPlaybackUrl(providerUid: string, expiresInSeconds = 14400): Promise<string> {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

    if (this.keyId && this.jwkKey) {
      try {
        // Construct JWT token header & payload for Cloudflare Stream signed playback
        const header = {
          alg: 'RS256',
          kid: this.keyId,
          typ: 'JWT',
        };
        const payload = {
          sub: providerUid,
          kid: this.keyId,
          exp: expiresAt,
          accessRules: [{ type: 'any' }],
        };

        const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
        const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
        const signatureInput = `${encodedHeader}.${encodedPayload}`;

        const sign = crypto.createSign('RSA-SHA256');
        sign.update(signatureInput);
        const signature = sign.sign(this.jwkKey, 'base64url');
        const token = `${signatureInput}.${signature}`;

        return `https://videodelivery.net/${providerUid}/manifest/video.m3u8?token=${token}`;
      } catch (err) {
        this.logger.warn(`Failed to sign URL with keyId, using token hash: ${err}`);
      }
    }

    // Fallback signed URL with expiration timestamp
    const token = crypto
      .createHmac('sha256', this.webhookSecret || 'shortreel_dev_secret')
      .update(`${providerUid}:${expiresAt}`)
      .digest('hex');

    return `https://videodelivery.net/${providerUid}/manifest/video.m3u8?exp=${expiresAt}&token=${token}`;
  }

  async getVideoMetadata(providerUid: string): Promise<VideoMetadata> {
    if (this.isConfigured) {
      try {
        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream/${providerUid}`,
          {
            headers: {
              Authorization: `Bearer ${this.apiToken}`,
            },
          },
        );

        if (response.ok) {
          const data = (await response.json()) as any;
          const streamResult = data.result;
          const status =
            streamResult.status.state === 'ready'
              ? 'READY'
              : streamResult.status.state === 'inprogress'
                ? 'PROCESSING'
                : streamResult.status.state === 'error'
                  ? 'FAILED'
                  : 'UPLOADING';

          return {
            providerUid,
            status,
            durationSeconds: Math.round(streamResult.duration || 0),
            width: streamResult.input?.width || 1080,
            height: streamResult.input?.height || 1920,
            playbackUrl: streamResult.playback?.hls,
            thumbnailUrl: streamResult.thumbnail,
          };
        }
      } catch (err) {
        this.logger.warn(`Cloudflare metadata lookup failed: ${err}`);
      }
    }

    return {
      providerUid,
      status: 'READY',
      durationSeconds: 120,
      width: 1080,
      height: 1920,
      playbackUrl: `https://videodelivery.net/${providerUid}/manifest/video.m3u8`,
      thumbnailUrl: `https://videodelivery.net/${providerUid}/thumbnails/thumbnail.jpg`,
    };
  }

  async deleteVideo(providerUid: string): Promise<void> {
    if (this.isConfigured) {
      try {
        await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream/${providerUid}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${this.apiToken}`,
            },
          },
        );
      } catch (err) {
        this.logger.warn(`Failed to delete Cloudflare video ${providerUid}: ${err}`);
      }
    }
  }

  verifyWebhookSignature(signatureHeader: string, rawBody: string): boolean {
    if (!this.webhookSecret) {
      // In development or test environments where secret is unconfigured, allow pass-through
      return true;
    }

    if (!signatureHeader) {
      return false;
    }

    try {
      // Cloudflare webhook signature format: time=1620000000,sig1=abcde...
      const parts = signatureHeader.split(',');
      const timePart = parts.find((p) => p.startsWith('time='))?.split('=')[1];
      const sigPart = parts.find((p) => p.startsWith('sig1='))?.split('=')[1];

      if (!timePart || !sigPart) {
        return false;
      }

      // Check timestamp to prevent replay attacks (tolerance 5 minutes)
      const timestamp = parseInt(timePart, 10);
      const now = Math.floor(Date.now() / 1000);
      if (Math.abs(now - timestamp) > 300) {
        return false;
      }

      const expectedSig = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(`${timePart}.${rawBody}`)
        .digest('hex');

      const sigBuffer = Buffer.from(sigPart, 'utf-8');
      const expectedBuffer = Buffer.from(expectedSig, 'utf-8');

      if (sigBuffer.length !== expectedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
    } catch {
      return false;
    }
  }
}
