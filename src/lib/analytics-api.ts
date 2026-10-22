/**
 * High-Throughput Analytics & Telemetry Client
 * Ingests client events to Redis Streams via backend edge API (/api/v1/analytics/events)
 * Adheres to SR-ARCH-13 and 09_ANALYTICS.md
 */

export const AnalyticsEventType = {
  // Video Telemetry
  VIDEO_STARTED: 'VIDEO_STARTED',
  VIDEO_25_PERCENT: 'VIDEO_25_PERCENT',
  VIDEO_50_PERCENT: 'VIDEO_50_PERCENT',
  VIDEO_75_PERCENT: 'VIDEO_75_PERCENT',
  VIDEO_COMPLETED: 'VIDEO_COMPLETED',
  VIDEO_STALLED: 'VIDEO_STALLED',

  // Interactive
  CHOICE_OFFERED: 'CHOICE_OFFERED',
  CHOICE_SHOWN: 'CHOICE_SHOWN',
  CHOICE_SELECTED: 'CHOICE_SELECTED',
  VOTE_CAST: 'VOTE_CAST',
  PREDICTION_PLACED: 'PREDICTION_PLACED',

  // Engagement
  STORY_OPENED: 'STORY_OPENED',
  STORY_SHARED: 'STORY_SHARED',
  EPISODE_LIKED: 'EPISODE_LIKED',
  EPISODE_COMPLETED: 'EPISODE_COMPLETED',
  CHARACTER_FOLLOWED: 'CHARACTER_FOLLOWED',
  CREATOR_FOLLOWED: 'CREATOR_FOLLOWED',
  SEARCH_PERFORMED: 'SEARCH_PERFORMED',

  // Monetization
  PAYWALL_VIEWED: 'PAYWALL_VIEWED',
  CHECKOUT_STARTED: 'CHECKOUT_STARTED',
  SUBSCRIPTION_STARTED: 'SUBSCRIPTION_STARTED',
  SUBSCRIPTION_CANCELLED: 'SUBSCRIPTION_CANCELLED',
  SUBSCRIPTION_RENEWED: 'SUBSCRIPTION_RENEWED',
} as const;

export type AnalyticsEventTypeKey = (typeof AnalyticsEventType)[keyof typeof AnalyticsEventType];

export interface ClientAnalyticsEvent {
  eventId?: string | undefined;
  eventType: AnalyticsEventTypeKey;
  userId?: string | undefined;
  sessionId: string;
  storyId?: string | undefined;
  episodeId?: string | undefined;
  nodeId?: string | undefined;
  choiceId?: string | undefined;
  occurredAt?: string | undefined;
  platform?: string | undefined;
  appVersion?: string | undefined;
  metrics?: Record<string, any> | undefined;
  metadata?: Record<string, any> | undefined;
}

const API_BASE = 'http://localhost:3000';
const SESSION_STORAGE_KEY = 'shortreel_telemetry_session_id';

export function getOrCreateSessionId(): string {
  try {
    let sessId = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessId) {
      sessId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessId);
    }
    return sessId;
  } catch {
    return `sess_${Date.now()}_fallback`;
  }
}

/**
 * Fires an analytics telemetry event to the backend Redis Stream ingestion gateway.
 * Fire-and-forget: does not block UI threads or video playback.
 */
export async function trackEvent(
  eventType: AnalyticsEventTypeKey,
  data: Partial<Omit<ClientAnalyticsEvent, 'eventType' | 'sessionId'>> = {},
): Promise<void> {
  const sessionId = getOrCreateSessionId();
  const event: ClientAnalyticsEvent = {
    ...data,
    eventType,
    sessionId,
    occurredAt: new Date().toISOString(),
    platform: 'WEB',
    appVersion: '1.4.0',
  };

  try {
    const payload = JSON.stringify(event);
    const url = `${API_BASE}/api/v1/analytics/events`;

    // Use keepalive for non-blocking telemetry delivery
    if (typeof fetch !== 'undefined') {
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: payload,
        keepalive: true,
      }).catch(() => {
        // Telemetry errors intentionally silenced to avoid disrupting user experience
      });
    }
  } catch {
    /* Silent catch for telemetry */
  }
}

/**
 * Sends a batch of telemetry events in a single network request.
 */
export async function trackBatch(events: Array<{ eventType: AnalyticsEventTypeKey } & Record<string, any>>): Promise<void> {
  if (!events || events.length === 0) return;
  const sessionId = getOrCreateSessionId();

  const formattedEvents = events.map((e) => ({
    ...e,
    sessionId: e['sessionId'] || sessionId,
    occurredAt: e['occurredAt'] || new Date().toISOString(),
    platform: 'WEB',
    appVersion: '1.4.0',
  }));

  try {
    const url = `${API_BASE}/api/v1/analytics/events/batch`;
    if (typeof fetch !== 'undefined') {
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: formattedEvents }),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    /* Silent catch */
  }
}

// Convenient Domain Helper Functions
export const analytics = {
  trackPaywallViewed: (metadata?: Record<string, any>) =>
    trackEvent(AnalyticsEventType.PAYWALL_VIEWED, { metadata }),

  trackCheckoutStarted: (planId: string, planName: string, amount: number, provider: string) =>
    trackEvent(AnalyticsEventType.CHECKOUT_STARTED, {
      metadata: { planId, planName, amount, provider },
    }),

  trackSubscriptionStarted: (subscriptionId: string, planId: string, planName: string, amount: number) =>
    trackEvent(AnalyticsEventType.SUBSCRIPTION_STARTED, {
      metadata: { subscriptionId, planId, planName, amount },
    }),

  trackSubscriptionCancelled: (subscriptionId: string, reason?: string) =>
    trackEvent(AnalyticsEventType.SUBSCRIPTION_CANCELLED, {
      metadata: { subscriptionId, reason },
    }),

  trackVideoStarted: (storyId: string, episodeId: string, metrics?: Record<string, any>) =>
    trackEvent(AnalyticsEventType.VIDEO_STARTED, { storyId, episodeId, metrics }),

  trackVideoProgress: (
    storyId: string,
    episodeId: string,
    percent: 25 | 50 | 75,
    metrics?: Record<string, any>,
  ) => {
    const eventType =
      percent === 25
        ? AnalyticsEventType.VIDEO_25_PERCENT
        : percent === 50
        ? AnalyticsEventType.VIDEO_50_PERCENT
        : AnalyticsEventType.VIDEO_75_PERCENT;
    trackEvent(eventType, { storyId, episodeId, metrics });
  },

  trackVideoCompleted: (storyId: string, episodeId: string, metrics?: Record<string, any>) =>
    trackEvent(AnalyticsEventType.VIDEO_COMPLETED, { storyId, episodeId, metrics }),

  trackChoiceSelected: (storyId: string, episodeId: string, nodeId: string, choiceId: string) =>
    trackEvent(AnalyticsEventType.CHOICE_SELECTED, { storyId, episodeId, nodeId, choiceId }),
};
