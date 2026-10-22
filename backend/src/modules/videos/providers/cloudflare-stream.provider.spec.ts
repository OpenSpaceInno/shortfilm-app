import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { CloudflareStreamProvider } from './cloudflare-stream.provider';

describe('CloudflareStreamProvider', () => {
  let provider: CloudflareStreamProvider;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string, defaultValue: string) => {
        if (key === 'CLOUDFLARE_STREAM_WEBHOOK_SECRET') return 'test_secret_123';
        return defaultValue;
      }),
    } as any;

    provider = new CloudflareStreamProvider(configService);
  });

  describe('getDirectUploadUrl', () => {
    it('should generate a valid direct TUS upload URL and provider UID', async () => {
      const result = await provider.getDirectUploadUrl({
        episodeId: '01HVG7J0000000000000000099',
        maxDurationSeconds: 1800,
      });

      expect(result.uploadUrl).toContain('https://upload.videodelivery.net/tus/');
      expect(result.providerUid).toBeDefined();
    });
  });

  describe('generateSignedPlaybackUrl', () => {
    it('should generate an HLS manifest URL with signed expiration token', async () => {
      const providerUid = 'cf_video_test_uid_123';
      const signedUrl = await provider.generateSignedPlaybackUrl(providerUid, 3600);

      expect(signedUrl).toContain(`https://videodelivery.net/${providerUid}/manifest/video.m3u8`);
      expect(signedUrl).toContain('exp=');
      expect(signedUrl).toContain('token=');
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid HMAC-SHA256 signature', () => {
      const rawBody = JSON.stringify({ uid: 'test_123', status: { state: 'ready' } });
      const now = Math.floor(Date.now() / 1000);
      const sig1 = crypto
        .createHmac('sha256', 'test_secret_123')
        .update(`${now}.${rawBody}`)
        .digest('hex');

      const header = `time=${now},sig1=${sig1}`;
      const isValid = provider.verifyWebhookSignature(header, rawBody);
      expect(isValid).toBe(true);
    });

    it('should reject invalid HMAC signature', () => {
      const rawBody = JSON.stringify({ uid: 'test_123' });
      const now = Math.floor(Date.now() / 1000);
      const header = `time=${now},sig1=invalid_tampered_signature`;

      const isValid = provider.verifyWebhookSignature(header, rawBody);
      expect(isValid).toBe(false);
    });

    it('should reject expired timestamp (replay attack prevention > 300s)', () => {
      const rawBody = JSON.stringify({ uid: 'test_123' });
      const staleTime = Math.floor(Date.now() / 1000) - 400; // 400s old
      const sig1 = crypto
        .createHmac('sha256', 'test_secret_123')
        .update(`${staleTime}.${rawBody}`)
        .digest('hex');

      const header = `time=${staleTime},sig1=${sig1}`;
      const isValid = provider.verifyWebhookSignature(header, rawBody);
      expect(isValid).toBe(false);
    });
  });
});
