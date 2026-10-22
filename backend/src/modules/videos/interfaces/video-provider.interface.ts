export const VIDEO_PROVIDER = 'VIDEO_PROVIDER';

export interface DirectUploadOptions {
  episodeId: string;
  maxDurationSeconds?: number;
  creatorId?: string;
}

export interface DirectUploadResult {
  uploadUrl: string;
  providerUid: string;
}

export interface VideoMetadata {
  providerUid: string;
  status: 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED';
  durationSeconds?: number;
  width?: number;
  height?: number;
  playbackUrl?: string;
  thumbnailUrl?: string;
}

export interface VideoProvider {
  /**
   * Generates a direct TUS upload URL from the video delivery provider
   */
  getDirectUploadUrl(options: DirectUploadOptions): Promise<DirectUploadResult>;

  /**
   * Generates a secure, time-limited signed playback URL for HLS streaming
   */
  generateSignedPlaybackUrl(providerUid: string, expiresInSeconds: number): Promise<string>;

  /**
   * Retrieves transcoding and ready status metadata from the video provider
   */
  getVideoMetadata(providerUid: string): Promise<VideoMetadata>;

  /**
   * Deletes a video asset from the provider
   */
  deleteVideo(providerUid: string): Promise<void>;

  /**
   * Verifies the authenticity of incoming webhook signatures
   */
  verifyWebhookSignature(signatureHeader: string, rawBody: string): boolean;
}
