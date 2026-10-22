import { VideosController } from './videos.controller';
import { VideosService } from '../services/videos.service';

describe('VideosController', () => {
  let controller: VideosController;
  let service: jest.Mocked<VideosService>;

  beforeEach(() => {
    service = {
      getDirectUploadUrl: jest.fn(),
      getPlaybackStream: jest.fn(),
      handleCloudflareWebhook: jest.fn(),
      getVideoStatus: jest.fn(),
    } as any;

    controller = new VideosController(service);
  });

  it('should return wrapped direct upload URL response', async () => {
    service.getDirectUploadUrl.mockResolvedValue({
      videoId: 'vid_123',
      episodeId: 'ep_123',
      uploadUrl: 'https://upload.videodelivery.net/tus/mock_123',
      providerUid: 'cf_123',
      provider: 'CLOUDFLARE_STREAM',
      status: 'UPLOADING',
    });

    const mockUser = { id: 'usr_123', roles: ['CREATOR'] } as any;
    const response = await controller.getDirectUploadUrl(mockUser, {
      episodeId: 'ep_123',
    });

    expect(response.success).toBe(true);
    expect(response.data.uploadUrl).toBe('https://upload.videodelivery.net/tus/mock_123');
  });

  it('should return wrapped playback stream response', async () => {
    service.getPlaybackStream.mockResolvedValue({
      playbackUrl: 'https://videodelivery.net/cf_123/manifest/video.m3u8',
      expiresAt: '2026-10-01T00:00:00Z',
      episodeId: 'ep_123',
      hasChoice: false,
      isFree: true,
      durationSeconds: 90,
    });

    const response = await controller.getPlaybackStream('ep_123');
    expect(response.success).toBe(true);
    expect(response.data.playbackUrl).toContain('videodelivery.net');
    expect(response.data.isFree).toBe(true);
  });

  it('should delegate webhook processing and return receipt', async () => {
    service.handleCloudflareWebhook.mockResolvedValue({
      received: true,
      status: 'PROCESSED',
    });

    const mockReq = { rawBody: '{}' } as any;
    const response = await controller.handleCloudflareWebhook(
      'time=1600000000,sig1=abc',
      '',
      mockReq,
      { uid: 'cf_123', status: { state: 'ready' } },
    );

    expect(response.received).toBe(true);
    expect(response.status).toBe('PROCESSED');
  });
});
