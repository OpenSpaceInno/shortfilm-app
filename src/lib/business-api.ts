/**
 * Business Intelligence & Executive Dashboard API Client
 * Connects frontend dashboard (/admin/business/*) to backend BusinessModule (M26)
 * Adheres to SR-ARCH-19, 21_BUSINESS_INTELLIGENCE.md, and 27_FRONTEND_INTEGRATION.md
 */

import type {
  ExecutiveKPI,
  PlatformSnapshotItem,
  FunnelStep,
  RetentionCohort,
  AudienceSegment,
  SubscriptionPlanPerformance,
  RevenueTrendPoint,
  BusinessSignal,
  AttentionItem,
  BusinessReport,
} from './business-data';

const API_BASE = 'http://localhost:3000';

export interface BusinessOverviewApiPayload {
  kpis: ExecutiveKPI[];
  snapshot: PlatformSnapshotItem[];
  funnel: FunnelStep[];
  signals: BusinessSignal[];
  attentionItems: AttentionItem[];
  generatedAt: string;
  isCached: boolean;
}

export interface RevenueDashboardApiPayload {
  mrr: number;
  arr: number;
  arpu: number;
  ltv: number;
  activeSubscribers: number;
  grossMonthlyRevenue: number;
  grossAnnualRunRate: number;
  creatorPayoutLiability: number;
  netSubscriberAdditions: number;
  grossChurnRate: number;
  plans: SubscriptionPlanPerformance[];
  revenueTrends: RevenueTrendPoint[];
  churnAnalysis: {
    monthlyRate: number;
    voluntaryPct: number;
    involuntaryPct: number;
    primaryReason: string;
  };
  generatedAt: string;
  isCached: boolean;
}

export interface CohortRetentionPoint {
  monthIndex: number;
  monthLabel: string;
  activeSubscribers: number;
  retentionRate: number;
  retainedMrr: number;
  netRevenueRetentionRate: number;
}

export interface SubscriberCohort {
  cohortMonth: string;
  initialSubscribers: number;
  initialMrr: number;
  retentionByMonth: CohortRetentionPoint[];
  cumulativeChurnRate: number;
  tierDistribution: Record<string, number>;
}

export interface SubscriberCohortsApiPayload {
  cohorts: SubscriberCohort[];
  overallMoMRetention: number[];
  averageSubscriberLifetimeMonths: number;
  generatedAt: string;
  isCached: boolean;
}

export interface AudienceDashboardApiPayload {
  dau: number;
  mau: number;
  stickinessRatio: number;
  totalRegisteredUsers: number;
  newRegistrationsPeriod: number;
  returningUsersPeriod: number;
  growthTrends: Array<{
    date: string;
    registeredUsers: number;
    newUsers: number;
    returningUsers: number;
    dau: number;
    mau: number;
  }>;
  retentionCohorts: RetentionCohort[];
  segments: AudienceSegment[];
  generatedAt: string;
  isCached: boolean;
}

export interface GenerateReportRequest {
  reportType: string;
  title: string;
  cadence: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'ADHOC';
  periodStart: string;
  periodEnd: string;
  summary?: string;
}

/**
 * Fetches executive overview dashboard payload from backend.
 * Falls back to null if backend is unreachable.
 */
export async function fetchBusinessOverview(filters?: Record<string, string>): Promise<BusinessOverviewApiPayload | null> {
  try {
    const params = new URLSearchParams(filters || {});
    const res = await fetch(`${API_BASE}/api/v1/business/overview?${params.toString()}`);
    if (!res.ok) return null;
    return (await res.json()) as BusinessOverviewApiPayload;
  } catch {
    return null;
  }
}

/**
 * Fetches revenue dashboard metrics, MRR/ARR, churn rates, and plan breakdowns.
 */
export async function fetchRevenueDashboard(filters?: Record<string, string>): Promise<RevenueDashboardApiPayload | null> {
  try {
    const params = new URLSearchParams(filters || {});
    const res = await fetch(`${API_BASE}/api/v1/business/revenue?${params.toString()}`);
    if (!res.ok) return null;
    return (await res.json()) as RevenueDashboardApiPayload;
  } catch {
    return null;
  }
}

/**
 * Fetches subscriber acquisition and retention cohorts matrix.
 */
export async function fetchSubscriberCohorts(): Promise<SubscriberCohortsApiPayload | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/business/cohorts`);
    if (!res.ok) return null;
    return (await res.json()) as SubscriberCohortsApiPayload;
  } catch {
    return null;
  }
}

/**
 * Fetches audience and user retention dashboard.
 */
export async function fetchAudienceDashboard(filters?: Record<string, string>): Promise<AudienceDashboardApiPayload | null> {
  try {
    const params = new URLSearchParams(filters || {});
    const res = await fetch(`${API_BASE}/api/v1/business/audience?${params.toString()}`);
    if (!res.ok) return null;
    return (await res.json()) as AudienceDashboardApiPayload;
  } catch {
    return null;
  }
}

/**
 * Generates an immutable report snapshot in backend.
 */
export async function generateBusinessReport(data: GenerateReportRequest): Promise<BusinessReport | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/business/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    return (await res.json()) as BusinessReport;
  } catch {
    return null;
  }
}

/**
 * Purges dashboard Redis cache namespace on-demand.
 */
export async function invalidateDashboardCache(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/business/cache/invalidate`, {
      method: 'POST',
    });
    return res.ok;
  } catch {
    return false;
  }
}
