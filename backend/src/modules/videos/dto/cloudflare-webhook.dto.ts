export interface CloudflareWebhookPayload {
  uid: string;
  status: {
    state: 'ready' | 'inprogress' | 'error';
    errorReasonCode?: string;
    errorReasonText?: string;
  };
  meta?: {
    episodeId?: string;
    creatorId?: string;
  };
  duration?: number;
  input?: {
    width?: number;
    height?: number;
    duration?: number;
  };
  playback?: {
    hls?: string;
    dash?: string;
  };
  thumbnail?: string;
  readyToStream?: boolean;
}
