export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
}

export interface PushResult {
  successCount: number;
  failureCount: number;
  invalidTokens?: string[];
}

export const PUSH_PROVIDER = 'PUSH_PROVIDER';

export interface PushNotificationProvider {
  sendPush(tokens: string[], payload: PushPayload): Promise<PushResult>;
}
