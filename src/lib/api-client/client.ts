/**
 * ShortReel Typed HTTP API Client
 * Provides type-safe access to backend Modular Monolith REST endpoints.
 * Integrates correlation IDs, JWT authentication, and standardized response unwrapping.
 */

import type { ApiResponse } from './types.gen';
import * as Types from './types.gen';

export interface ApiClientConfig {
  baseUrl?: string;
  getToken?: () => Promise<string | null> | string | null;
  onUnauthorized?: () => void;
}

let globalConfig: ApiClientConfig = {
  baseUrl: (typeof import.meta !== 'undefined' && import.meta.env?.['VITE_API_URL']) || 'http://localhost:3000',
  getToken: () => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('token') || localStorage.getItem('shortreel_client_user_sub');
    }
    return null;
  },
};

export function configureApiClient(config: Partial<ApiClientConfig>) {
  globalConfig = { ...globalConfig, ...config };
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const baseUrl = globalConfig.baseUrl || '';
  const url = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  // Inject token if available
  const token = globalConfig.getToken ? await globalConfig.getToken() : null;
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Correlation tracking
  if (!headers.has('X-Correlation-Id')) {
    headers.set('X-Correlation-Id', `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 && globalConfig.onUnauthorized) {
      globalConfig.onUnauthorized();
    }

    const contentType = response.headers.get('content-type');
    let data: any = null;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      return {
        success: response.ok,
        data: text as any,
      };
    }

    // Standard envelope response
    if (data && typeof data === 'object' && 'success' in data) {
      return data as ApiResponse<T>;
    }

    return {
      success: response.ok,
      data: data as T,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null as any,
      error: {
        code: 'NETWORK_ERROR',
        message: error.message || 'Network request failed',
      },
    };
  }
}

// ============================================================================
// DOMAIN-SCOPED API CLIENTS
// ============================================================================

export const contentApi = {
  listStories: (query?: { genre?: string; trending?: boolean; limit?: number; page?: number; cursor?: string }) => {
    const params = new URLSearchParams();
    if (query?.genre) params.set('genre', query.genre);
    if (query?.trending !== undefined) params.set('trending', String(query.trending));
    if (query?.limit) params.set('limit', String(query.limit));
    if (query?.page) params.set('page', String(query.page));
    if (query?.cursor) params.set('cursor', query.cursor);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<any[]>(`/api/v1/stories${qs}`);
  },
  getFeaturedStories: () => apiRequest<any[]>(`/api/v1/stories/featured`),
  getStory: (idOrSlug: string) => apiRequest<any>(`/api/v1/stories/${idOrSlug}`),
  getSeasons: (storyId: string) => apiRequest<any[]>(`/api/v1/stories/${storyId}/seasons`),
  getEpisodes: (storyId: string, seasonId: string) =>
    apiRequest<any[]>(`/api/v1/stories/${storyId}/seasons/${seasonId}/episodes`),
  getEpisode: (id: string) => apiRequest<any>(`/api/v1/episodes/${id}`),
  getGenres: () => apiRequest<any[]>(`/api/v1/genres`),
  getPlaybackStream: (episodeId: string) =>
    apiRequest<{
      streamUrl?: string;
      playbackToken?: string;
      manifestUrl?: string;
      thumbnailUrl?: string;
      durationSeconds?: number;
      hasChoice?: boolean;
    }>(`/api/v1/episodes/${episodeId}/stream`),
};

export const searchApi = {
  search: (q: string, options?: { limit?: number; page?: number; genre?: string; type?: string }) => {
    const params = new URLSearchParams({ q });
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.page) params.set('page', String(options.page));
    if (options?.genre) params.set('genre', options.genre);
    if (options?.type) params.set('type', options.type);
    return apiRequest<any>(`/api/v1/search?${params.toString()}`);
  },
};

export const interactiveApi = {
  getPublishedGraph: (storyId: string) =>
    apiRequest<any>(`/api/v1/interactive/stories/${storyId}/published-graph`),
  getVersionGraph: (versionId: string) =>
    apiRequest<any>(`/api/v1/interactive/versions/${versionId}/graph`),
  getStoryGraph: (storyId: string) =>
    apiRequest<any>(`/api/v1/interactive/stories/${storyId}/published-graph`),
  getChoices: (episodeId: string) =>
    apiRequest<any[]>(`/api/v1/interactive/nodes/${episodeId}/choices`),
  resolveChoice: (body: { choiceId: string; optionId: string; episodeId?: string; timeToDecideMs?: number }) =>
    apiRequest<any>(`/api/v1/interactive/choices`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getFallbackChoice: (choiceId: string) =>
    apiRequest<any>(`/api/v1/interactive/choices/${choiceId}/fallback`),
  getMyChoices: () =>
    apiRequest<any[]>(`/api/v1/interactive/users/me/choices`),
  castVote: (body: { choiceId: string; optionId: string }) =>
    apiRequest<any>(`/api/v1/engagement/votes`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getVotes: (choiceId: string) =>
    apiRequest<any>(`/api/v1/engagement/votes/choice/${choiceId}`),
};

export const engagementApi = {
  syncProgress: (body: { storyId?: string; episodeId: string; progressSec?: number; positionSeconds?: number; durationSeconds?: number; completed?: boolean }) =>
    apiRequest<any>(`/api/v1/engagement/progress`, {
      method: 'POST',
      body: JSON.stringify({
        episodeId: body.episodeId,
        positionSeconds: body.positionSeconds ?? body.progressSec ?? 0,
        durationSeconds: body.durationSeconds ?? 0,
        completed: Boolean(body.completed),
      }),
    }),
  getProgress: (episodeId: string) =>
    apiRequest<any>(`/api/v1/engagement/progress/${episodeId}`),
  getHistory: () =>
    apiRequest<any[]>(`/api/v1/engagement/history`),
  getContinueWatching: () =>
    apiRequest<any[]>(`/api/v1/engagement/continue-watching`),
  getGamificationProfile: () =>
    apiRequest<any>(`/api/v1/gamification/profile`),
  getProfile: () =>
    apiRequest<any>(`/api/v1/gamification/profile`),
  getBadges: () =>
    apiRequest<any[]>(`/api/v1/gamification/badges`),
  pingStreak: () =>
    apiRequest<any>(`/api/v1/gamification/streak/ping`, { method: 'POST' }),
  getLeaderboard: () =>
    apiRequest<any[]>(`/api/v1/gamification/leaderboard`),
  getPredictions: (storyId?: string) =>
    apiRequest<any[]>(storyId ? `/api/v1/engagement/predictions/story/${storyId}` : `/api/v1/engagement/predictions`),
  submitPrediction: (body: { predictionId: string; optionId: string; wagerXp?: number }) =>
    apiRequest<any>(`/api/v1/engagement/predictions`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  toggleFollow: (body: { targetType: 'CREATOR' | 'CHARACTER' | 'STORY'; targetId: string }) =>
    apiRequest<any>(`/api/v1/engagement/follows`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getFollowStatus: (targetType: string, targetId: string) =>
    apiRequest<{ isFollowing: boolean }>(`/api/v1/engagement/follows/status?targetType=${targetType}&targetId=${targetId}`),
};

export const subscriptionsApi = {
  getPlans: () => apiRequest<any[]>(`/api/v1/subscriptions/plans`),
  getPlanBySlug: (slug: string) => apiRequest<any>(`/api/v1/subscriptions/plans/${slug}`),
  getFeatureMatrix: () => apiRequest<any>(`/api/v1/subscriptions/matrix`),
  getCurrentSubscription: () => apiRequest<any>(`/api/v1/subscriptions/current`),
  initiateCheckout: (body: { planId: string; provider?: string | undefined; billingInterval?: string | undefined; returnUrl?: string | undefined }) =>
    apiRequest<any>(`/api/v1/subscriptions/checkout`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  verifyPayment: (body: any) =>
    apiRequest<any>(`/api/v1/subscriptions/verify`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  cancelSubscription: () =>
    apiRequest<any>(`/api/v1/subscriptions/cancel`, {
      method: 'POST',
    }),
};

export const videosApi = {
  getDirectUploadUrl: (body: { episodeId: string; maxDurationSeconds?: number }) =>
    apiRequest<{
      videoId: string;
      episodeId: string;
      uploadUrl: string;
      providerUid: string;
      provider: string;
      status: string;
    }>(`/api/v1/videos/direct-upload-url`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getPlaybackStream: (episodeId: string) =>
    apiRequest<{
      streamUrl?: string;
      playbackToken?: string;
      manifestUrl?: string;
      thumbnailUrl?: string;
      durationSeconds?: number;
      hasChoice?: boolean;
    }>(`/api/v1/episodes/${episodeId}/stream`),
};

export const creatorsApi = {
  getMe: () => apiRequest<any>(`/api/v1/creators/me`),
  getDashboard: () => apiRequest<any>(`/api/v1/creators/me/dashboard`),
  listStories: () => apiRequest<any[]>(`/api/v1/creators/me/stories`),
  submitStory: (body: {
    title: string;
    synopsis?: string;
    submissionType?: string;
    storyId?: string;
    storyVersionId?: string;
    scriptUrl?: string;
    videoPreviewUrl?: string;
    storyInfo?: any;
    checklist?: any;
  }) =>
    apiRequest<any>(`/api/v1/creators/submissions`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  submitForReview: (submissionId: string) =>
    apiRequest<any>(`/api/v1/creators/submissions/${submissionId}/submit`, {
      method: 'POST',
    }),
  getSubmissions: (query?: { status?: string; limit?: number }) => {
    const params = new URLSearchParams();
    if (query?.status) params.set('status', query.status);
    if (query?.limit) params.set('limit', String(query.limit));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<any>(`/api/v1/creators/submissions${qs}`);
  },
  getEarnings: (query?: { year?: number; status?: string; limit?: number }) => {
    const params = new URLSearchParams();
    if (query?.year) params.set('year', String(query.year));
    if (query?.status) params.set('status', query.status);
    if (query?.limit) params.set('limit', String(query.limit));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<any>(`/api/v1/creators/me/earnings${qs}`);
  },
  getEarningsSummary: () => apiRequest<any>(`/api/v1/creators/me/earnings/summary`),
  getAnalytics: (query?: { storyId?: string; startDate?: string; endDate?: string }) => {
    const params = new URLSearchParams();
    if (query?.storyId) params.set('storyId', query.storyId);
    if (query?.startDate) params.set('startDate', query.startDate);
    if (query?.endDate) params.set('endDate', query.endDate);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<any>(`/api/v1/creators/me/analytics${qs}`);
  },
  getRetentionAnalytics: (query?: { storyId?: string }) => {
    const qs = query?.storyId ? `?storyId=${query.storyId}` : '';
    return apiRequest<any>(`/api/v1/creators/me/analytics/retention${qs}`);
  },
  getChoiceAnalytics: (query?: { storyId?: string }) => {
    const qs = query?.storyId ? `?storyId=${query.storyId}` : '';
    return apiRequest<any>(`/api/v1/creators/me/analytics/choices${qs}`);
  },
  getStoryPerformance: () => apiRequest<any>(`/api/v1/creators/me/analytics/stories`),
};

export const aiStudioApi = {
  expandConcept: (body: Types.ConceptExpandRequestDto) =>
    apiRequest<Types.ConceptExpandResponseDto>(`/api/v1/ai-studio/concept-expand`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  forgeCharacter: (body: Types.CharacterForgeRequestDto) =>
    apiRequest<Types.CharacterForgeResponseDto>(`/api/v1/ai-studio/character-forge`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  branchDilemma: (body: Types.BranchDilemmaRequestDto) =>
    apiRequest<Types.BranchDilemmaResponseDto>(`/api/v1/ai-studio/branch-dilemma`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  cliffhanger: (body: Types.CliffhangerRequestDto) =>
    apiRequest<Types.CliffhangerResponseDto>(`/api/v1/ai-studio/cliffhanger`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  productionPack: (body: Types.ProductionPackRequestDto) =>
    apiRequest<Types.ProductionPackJobCreatedDto>(`/api/v1/ai-studio/production-pack`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getJobStatus: (jobId: string) => apiRequest<Types.AiJobStatusResponseDto>(`/api/v1/ai-studio/jobs/${jobId}`),
  getUsage: () => apiRequest<any>(`/api/v1/ai-studio/usage`),
};

export const adminApi = {
  getDashboard: () => apiRequest<any>(`/api/v1/admin/dashboard`),

  // Content Curation & Catalog (P10.2)
  listStories: (query?: { status?: string; genre?: string; search?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (query?.status) params.set('status', query.status);
    if (query?.genre) params.set('genre', query.genre);
    if (query?.search) params.set('search', query.search);
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<any>(`/api/v1/admin/content/stories${qs}`);
  },
  getStoryDetail: (id: string) => apiRequest<any>(`/api/v1/admin/content/stories/${id}`),
  curateStory: (
    id: string,
    body: { featured?: boolean | undefined; carouselId?: string | undefined; badge?: string | undefined; displayRank?: number | undefined },
  ) =>
    apiRequest<any>(`/api/v1/admin/content/stories/${id}/curation`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  archiveStory: (id: string, body: { rationale: string }) =>
    apiRequest<any>(`/api/v1/admin/content/stories/${id}/archive`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  unpublishStory: (id: string, body: { reason: string }) =>
    apiRequest<any>(`/api/v1/admin/content/stories/${id}/unpublish`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  overrideMetadata: (
    id: string,
    body: { title?: string | undefined; synopsis?: string | undefined; ageRating?: string | undefined; genres?: string[] | undefined },
  ) =>
    apiRequest<any>(`/api/v1/admin/content/stories/${id}/metadata`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  listCurations: () => apiRequest<any[]>(`/api/v1/admin/content/curations`),
  createCuration: (body: any) =>
    apiRequest<any>(`/api/v1/admin/content/curations`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateCuration: (id: string, body: any) =>
    apiRequest<any>(`/api/v1/admin/content/curations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deleteCuration: (id: string) =>
    apiRequest<any>(`/api/v1/admin/content/curations/${id}`, {
      method: 'DELETE',
    }),

  // Editorial Submission Approval Queue (P10.2)
  listSubmissions: (query?: { status?: string; creatorId?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (query?.status) params.set('status', query.status);
    if (query?.creatorId) params.set('creatorId', query.creatorId);
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<any>(`/api/v1/admin/submissions${qs}`);
  },
  getSubmission: (id: string) => apiRequest<any>(`/api/v1/admin/submissions/${id}`),
  approveSubmission: (id: string, body?: { notes?: string; publishImmediately?: boolean }) =>
    apiRequest<any>(`/api/v1/admin/submissions/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(body || {}),
    }),
  rejectSubmission: (id: string, body: { reason: string }) =>
    apiRequest<any>(`/api/v1/admin/submissions/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  requestSubmissionChanges: (id: string, body: { feedback: string; requiredChanges?: string[] }) =>
    apiRequest<any>(`/api/v1/admin/submissions/${id}/request-changes`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  reviewSubmission: (id: string, action: 'approve' | 'reject' | 'changes', body: any) =>
    apiRequest<any>(`/api/v1/admin/submissions/${id}/${action === 'changes' ? 'request-changes' : action}`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // User Moderation & Governance (P10.3)
  listUsers: (query?: { role?: string; status?: string; search?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (query?.role) params.set('role', query.role);
    if (query?.status) params.set('status', query.status);
    if (query?.search) params.set('search', query.search);
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<any>(`/api/v1/admin/users${qs}`);
  },
  getUserDetail: (id: string) => apiRequest<any>(`/api/v1/admin/users/${id}`),
  updateUserStatus: (id: string, body: { status: 'ACTIVE' | 'SUSPENDED' | 'BANNED'; reason?: string }) =>
    apiRequest<any>(`/api/v1/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  updateUserRoles: (id: string, body: { roles: string[] }) =>
    apiRequest<any>(`/api/v1/admin/users/${id}/roles`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  issueStrike: (id: string, body: { reason: string; severity?: string }) =>
    apiRequest<any>(`/api/v1/admin/users/${id}/strikes`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  listReports: (query?: { status?: string; type?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (query?.status) params.set('status', query.status);
    if (query?.type) params.set('type', query.type);
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<any>(`/api/v1/admin/moderation/reports${qs}`);
  },
  resolveReport: (id: string, body: { resolution: string; notes?: string }) =>
    apiRequest<any>(`/api/v1/admin/moderation/reports/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // System Settings & Feature Flags (P10.3)
  getPublicSettings: () => apiRequest<Record<string, any>>(`/api/v1/admin/settings/public`),
  getSettings: (category?: string) => {
    const qs = category ? `?category=${category}` : '';
    return apiRequest<any[]>(`/api/v1/admin/settings${qs}`);
  },
  getSetting: (key: string) => apiRequest<any>(`/api/v1/admin/settings/${key}`),
  updateSetting: (key: string, body: { value: any }) =>
    apiRequest<any>(`/api/v1/admin/settings/${key}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  batchUpdateSettings: (body: { settings: Array<{ key: string; value: any; isPublic?: boolean }> | Record<string, any> }) => {
    const payload = Array.isArray((body as any).settings)
      ? body
      : {
          settings: Object.entries((body as any).settings || {}).map(([key, value]) => ({
            key,
            value,
          })),
        };
    return apiRequest<any>(`/api/v1/admin/settings`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  resetSettings: (category?: string) => {
    const qs = category ? `?category=${category}` : '';
    return apiRequest<any>(`/api/v1/admin/settings/reset${qs}`, {
      method: 'POST',
    });
  },
  updateSettings: (body: any) =>
    apiRequest<any>(`/api/v1/admin/settings`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  // Audit Trail & Security Posture (P10.4)
  getAuditLogs: (query?: { actorId?: string; entityType?: string; action?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (query?.actorId) params.set('actorId', query.actorId);
    if (query?.entityType) params.set('entityType', query.entityType);
    if (query?.action) params.set('action', query.action);
    if (query?.limit) params.set('limit', String(query.limit));
    if (query?.page) params.set('page', String(query.page));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<any>(`/api/v1/admin/audit-logs${qs}`);
  },
  getAuditLog: (id: string) => apiRequest<any>(`/api/v1/admin/audit-logs/${id}`),
  getSecurityAudit: () => apiRequest<any>(`/api/v1/admin/security/audit`),
  getSecurityHeaders: () => apiRequest<any>(`/api/v1/admin/security/headers`),
  getSecurityRateLimits: () => apiRequest<any>(`/api/v1/admin/security/rate-limits`),
};

export const analyticsTelemetryApi = {
  ingest: (body: any) =>
    apiRequest<any>(`/api/v1/analytics/events`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

export const healthApi = {
  live: () => apiRequest<any>(`/api/v1/health/live`),
  ready: () => apiRequest<any>(`/api/v1/health/ready`),
};
