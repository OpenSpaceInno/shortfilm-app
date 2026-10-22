/**
 * Story Lab API Client
 * Connects frontend workspace (/admin/story-lab/*) to backend StoryLabModule (M27)
 * Adheres to SR-ARCH-18, 20_STORY_LAB.md, and 27_FRONTEND_INTEGRATION.md
 */

import type {
  StorySignal,
  ContentOpportunity,
  StoryExperiment,
  OpportunityStatus,
  ExperimentStatus,
} from './story-lab-data';

const API_BASE = 'http://localhost:3000';

function getAuthHeaders(): HeadersInit {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface StoryNodeHeatmapPayload {
  storyId: string;
  storyTitle: string;
  totalViewers: number;
  overallCompletionRate: number;
  nodes: {
    nodeId: string;
    episodeId?: string;
    episodeNumber: number;
    title: string;
    nodeType: string;
    impressions: number;
    completions: number;
    dropOffRate: number;
    completionRate: number;
    avgWatchTimeSec: number;
    heatLevel: 'COOL' | 'WARM' | 'HOT' | 'CRITICAL_DROP';
    isChoicePoint: boolean;
    choiceQuestion?: string;
    options?: {
      optionId: string;
      label: string;
      voteCount: number;
      percentage: number;
      nextCompletionRate: number;
    }[];
  }[];
  highestDropOffNode?: {
    nodeId: string;
    episodeNumber: number;
    title: string;
    dropOffRate: number;
    observation: string;
    suggestedInvestigation: string;
  };
}

export interface StoryPathClusteringPayload {
  storyId: string;
  storyTitle: string;
  totalInteractiveSessions: number;
  clusters: {
    clusterId: string;
    name: string;
    description: string;
    percentage: number;
    userCount: number;
    pathSteps: {
      stepNumber: number;
      nodeId: string;
      episodeNumber: number;
      title: string;
      choicePrompt?: string;
      selectedOptionLabel?: string;
    }[];
    terminalNodeType: string;
    completionRate: number;
    averageSessionDurationMinutes: number;
    loyaltySegment: 'CASUAL' | 'CORE' | 'POWER_FAN';
  }[];
  primaryDivergenceNode?: {
    nodeId: string;
    episodeNumber: number;
    prompt: string;
    impactSummary: string;
  };
}

export interface VariantAllocationPayload {
  experimentId: string;
  userId: string;
  bucket: number;
  allocatedVariant: 'A' | 'B';
  variantId: string;
  variantKey: string;
  variantName: string;
  configJson?: Record<string, any> | null;
  status: string;
}

export async function fetchStorySignals(params?: {
  storyId?: string;
  signalType?: string;
  strength?: string;
}): Promise<StorySignal[] | null> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.storyId) searchParams.set('storyId', params.storyId);
    if (params?.signalType) searchParams.set('signalType', params.signalType);
    if (params?.strength) searchParams.set('strength', params.strength);

    const res = await fetch(`${API_BASE}/api/v1/story-lab/signals?${searchParams.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function fetchContentOpportunities(params?: {
  storyId?: string;
  status?: string;
}): Promise<ContentOpportunity[] | null> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.storyId) searchParams.set('storyId', params.storyId);
    if (params?.status) searchParams.set('status', params.status);

    const res = await fetch(`${API_BASE}/api/v1/story-lab/opportunities?${searchParams.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function fetchStoryExperiments(params?: {
  storyId?: string;
  status?: string;
}): Promise<StoryExperiment[] | null> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.storyId) searchParams.set('storyId', params.storyId);
    if (params?.status) searchParams.set('status', params.status);

    const res = await fetch(`${API_BASE}/api/v1/story-lab/experiments?${searchParams.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function createStoryExperiment(dto: {
  storyId: string;
  name: string;
  hypothesis: string;
  targetMetric?: string;
  splitPercentage?: number;
  variantA: { name: string; description?: string; configJson?: Record<string, any> };
  variantB: { name: string; description?: string; configJson?: Record<string, any> };
}): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/story-lab/experiments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(dto),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function updateStoryExperimentStatus(
  id: string,
  status: ExperimentStatus,
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/story-lab/experiments/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function allocateStoryVariant(
  experimentId: string,
  userId: string,
): Promise<VariantAllocationPayload | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/story-lab/experiments/allocate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ experimentId, userId }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function fetchStoryNodeHeatmap(storyId: string): Promise<StoryNodeHeatmapPayload | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/story-lab/heatmaps/${storyId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function fetchStoryPathClustering(storyId: string): Promise<StoryPathClusteringPayload | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/story-lab/clusters/${storyId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function updateStoryOpportunityStatus(
  id: string,
  status: OpportunityStatus,
  reviewerNotes?: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/story-lab/opportunities/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, reviewerNotes }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
