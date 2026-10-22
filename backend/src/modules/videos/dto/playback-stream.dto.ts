export interface PlaybackStreamResponseDto {
  playbackUrl: string;
  expiresAt: string;
  episodeId: string;
  nodeId?: string | null;
  hasChoice: boolean;
  isFree: boolean;
  durationSeconds?: number | null;
  thumbnailUrl?: string | null;
}
