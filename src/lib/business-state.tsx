import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react";
import {
  fetchBusinessOverview,
  fetchRevenueDashboard,
  fetchSubscriberCohorts,
  fetchAudienceDashboard,
  invalidateDashboardCache,
} from "./business-api";
import {
  type BusinessPeriod,
  type ExecutiveKPI,
  type PlatformSnapshotItem,
  type AudienceGrowthPoint,
  type FunnelStep,
  type RetentionCohort,
  type AudienceSegment,
  type LanguageMarketData,
  type SubscriptionPlanPerformance,
  type RevenueTrendPoint,
  type ContentMatrixItem,
  type CreatorEconomicsItem,
  type BusinessSignal,
  type AttentionItem,
  type BusinessReport,
  type WatchTimeTrendPoint,
  type EngagementJourneyStep,
  type InteractiveComparisonMetric,
  executiveKpisData,
  platformSnapshotData,
  audienceGrowthData,
  audienceFunnelData,
  audienceRetentionData,
  audienceSegmentsData,
  languageMarketData,
  subscriptionPlansData,
  subscriptionFunnelData,
  revenueTrendData,
  contentMatrixData,
  creatorEconomicsData,
  creatorFunnelData,
  watchTimeTrendsData,
  engagementJourneyData,
  interactiveComparisonData,
  businessSignalsData,
  attentionItemsData,
  businessReportsData,
  businessDataFreshness,
} from "./business-data";
import { auditLog } from "./admin-data";
import { useAdmin } from "./admin-state";

/* ==========================================================================
   BUSINESS STATE MANAGEMENT
   Iteration 4E — Executive Intelligence & Business Operations
   ========================================================================== */

export interface BusinessFilters {
  period: BusinessPeriod;
  country: string;
  language: string;
  platform: string;
  subscriptionPlan: string;
  contentType: string;
  genre: string;
  creator: string;
  searchQuery: string;
}

const initialFilters: BusinessFilters = {
  period: "Last 30 Days",
  country: "All",
  language: "All",
  platform: "All",
  subscriptionPlan: "All",
  contentType: "All",
  genre: "All",
  creator: "All",
  searchQuery: "",
};

interface BusinessContextType {
  filters: BusinessFilters;
  setPeriod: (period: BusinessPeriod) => void;
  setCountry: (country: string) => void;
  setLanguage: (language: string) => void;
  setPlatform: (platform: string) => void;
  setSubscriptionPlan: (plan: string) => void;
  setContentType: (contentType: string) => void;
  setGenre: (genre: string) => void;
  setCreator: (creator: string) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;

  dataFreshness: string;

  // Datasets
  kpis: ExecutiveKPI[];
  snapshot: PlatformSnapshotItem[];
  growthData: AudienceGrowthPoint[];
  funnelData: FunnelStep[];
  retentionData: RetentionCohort[];
  segments: AudienceSegment[];
  languageData: LanguageMarketData[];
  plansData: SubscriptionPlanPerformance[];
  plans: SubscriptionPlanPerformance[];
  subFunnel: FunnelStep[];
  revenueData: RevenueTrendPoint[];
  revenueTrends: RevenueTrendPoint[];
  contentMatrix: ContentMatrixItem[];
  creatorEconomics: CreatorEconomicsItem[];
  creatorList: CreatorEconomicsItem[];
  creatorFunnel: FunnelStep[];
  watchTrends: WatchTimeTrendPoint[];
  interactiveComparison: InteractiveComparisonMetric[];
  journeySteps: EngagementJourneyStep[];
  signals: BusinessSignal[];
  attentionItems: AttentionItem[];
  reports: BusinessReport[];

  // Selection & Modal States
  selectedSegment: AudienceSegment | null;
  setSelectedSegment: (seg: AudienceSegment | null) => void;
  selectedReport: BusinessReport | null;
  openReportModal: (rep: BusinessReport) => void;
  closeReportModal: () => void;

  // Actions
  dismissAttentionItem: (id: string) => void;
  exportReport: (report: BusinessReport) => void;

  // Live API & Invalidation Actions
  refreshDashboard: () => Promise<void>;
  isLiveConnected: boolean;

  // RBAC Permission Check
  canAccessBusinessSection: (
    section: "overview" | "audience" | "engagement" | "subscriptions" | "revenue" | "content-economics" | "creator-economics" | "reports"
  ) => boolean;
}

const defaultBusinessContext: BusinessContextType = {
  filters: initialFilters,
  setPeriod: () => {},
  setCountry: () => {},
  setLanguage: () => {},
  setPlatform: () => {},
  setSubscriptionPlan: () => {},
  setContentType: () => {},
  setGenre: () => {},
  setCreator: () => {},
  setSearchQuery: () => {},
  resetFilters: () => {},

  dataFreshness: businessDataFreshness,

  kpis: executiveKpisData,
  snapshot: platformSnapshotData,
  growthData: audienceGrowthData,
  funnelData: audienceFunnelData,
  retentionData: audienceRetentionData,
  segments: audienceSegmentsData,
  languageData: languageMarketData,
  plansData: subscriptionPlansData,
  plans: subscriptionPlansData,
  subFunnel: subscriptionFunnelData,
  revenueData: revenueTrendData,
  revenueTrends: revenueTrendData,
  contentMatrix: contentMatrixData,
  creatorEconomics: creatorEconomicsData,
  creatorList: creatorEconomicsData,
  creatorFunnel: creatorFunnelData,
  watchTrends: watchTimeTrendsData,
  interactiveComparison: interactiveComparisonData,
  journeySteps: engagementJourneyData,
  signals: businessSignalsData,
  attentionItems: attentionItemsData,
  reports: businessReportsData,

  selectedSegment: null,
  setSelectedSegment: () => {},
  selectedReport: null,
  openReportModal: () => {},
  closeReportModal: () => {},

  dismissAttentionItem: () => {},
  exportReport: () => {},
  refreshDashboard: async () => {},
  isLiveConnected: false,
  canAccessBusinessSection: () => true,
};

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAdmin();
  const currentRole = currentUser?.role || "Super Admin";

  const [filters, setFilters] = useState<BusinessFilters>(initialFilters);
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>(attentionItemsData);
  const [selectedSegment, setSelectedSegment] = useState<AudienceSegment | null>(null);
  const [selectedReport, setSelectedReport] = useState<BusinessReport | null>(null);

  const [kpis, setKpis] = useState<ExecutiveKPI[]>(executiveKpisData);
  const [snapshot, setSnapshot] = useState<PlatformSnapshotItem[]>(platformSnapshotData);
  const [funnelData, setFunnelData] = useState<FunnelStep[]>(audienceFunnelData);
  const [signals, setSignals] = useState<BusinessSignal[]>(businessSignalsData);
  const [plans, setPlans] = useState<SubscriptionPlanPerformance[]>(subscriptionPlansData);
  const [revenueTrends, setRevenueTrends] = useState<RevenueTrendPoint[]>(revenueTrendData);
  const [growthData, setGrowthData] = useState<AudienceGrowthPoint[]>(audienceGrowthData);
  const [retentionData, setRetentionData] = useState<RetentionCohort[]>(audienceRetentionData);
  const [segments, setSegments] = useState<AudienceSegment[]>(audienceSegmentsData);
  const [dataFreshness, setDataFreshness] = useState<string>(businessDataFreshness);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);

  const loadDashboardData = async () => {
    try {
      const overview = await fetchBusinessOverview({ period: filters.period });
      if (overview) {
        if (overview.kpis && overview.kpis.length > 0) setKpis(overview.kpis);
        if (overview.snapshot && overview.snapshot.length > 0) setSnapshot(overview.snapshot);
        if (overview.funnel && overview.funnel.length > 0) setFunnelData(overview.funnel);
        if (overview.signals && overview.signals.length > 0) setSignals(overview.signals);
        if (overview.attentionItems && overview.attentionItems.length > 0) setAttentionItems(overview.attentionItems);
        setIsLiveConnected(true);
        setDataFreshness(overview.isCached ? "Redis Cached (<50ms)" : "Live Aggregation");
      }

      const rev = await fetchRevenueDashboard({ period: filters.period });
      if (rev) {
        if (rev.plans && rev.plans.length > 0) setPlans(rev.plans);
        if (rev.revenueTrends && rev.revenueTrends.length > 0) setRevenueTrends(rev.revenueTrends);
      }

      const aud = await fetchAudienceDashboard({ period: filters.period });
      if (aud) {
        if (aud.growthTrends && aud.growthTrends.length > 0) setGrowthData(aud.growthTrends);
        if (aud.retentionCohorts && aud.retentionCohorts.length > 0) setRetentionData(aud.retentionCohorts);
        if (aud.segments && aud.segments.length > 0) setSegments(aud.segments);
      }
    } catch {
      // Graceful fallback to default baseline
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [filters.period]);

  const refreshDashboard = async () => {
    await invalidateDashboardCache();
    await loadDashboardData();
  };

  // Filter setters
  const setPeriod = (period: BusinessPeriod) => {
    setFilters((prev) => ({ ...prev, period }));
    auditLog.unshift({
      id: `aud-${Date.now()}`,
      user: currentUser?.name || "Admin",
      role: currentRole,
      action: "Business Period Changed",
      entity: `Period: ${period}`,
      entityId: "business-period",
      timestamp: new Date().toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "Success",
    });
  };

  const setCountry = (country: string) => setFilters((prev) => ({ ...prev, country }));
  const setLanguage = (language: string) => setFilters((prev) => ({ ...prev, language }));
  const setPlatform = (platform: string) => setFilters((prev) => ({ ...prev, platform }));
  const setSubscriptionPlan = (subscriptionPlan: string) =>
    setFilters((prev) => ({ ...prev, subscriptionPlan }));
  const setContentType = (contentType: string) => setFilters((prev) => ({ ...prev, contentType }));
  const setGenre = (genre: string) => setFilters((prev) => ({ ...prev, genre }));
  const setCreator = (creator: string) => setFilters((prev) => ({ ...prev, creator }));
  const setSearchQuery = (searchQuery: string) => setFilters((prev) => ({ ...prev, searchQuery }));
  const resetFilters = () => setFilters(initialFilters);

  // Actions
  const dismissAttentionItem = (id: string) => {
    const item = attentionItems.find((i) => i.id === id);
    setAttentionItems((prev) => prev.filter((i) => i.id !== id));

    auditLog.unshift({
      id: `aud-${Date.now()}`,
      user: currentUser?.name || "Admin",
      role: currentRole,
      action: "Resolved Attention Item",
      entity: item ? item.title : id,
      entityId: id,
      timestamp: new Date().toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "Success",
      details: item?.description || "",
    });
  };

  const exportReport = (report: BusinessReport) => {
    auditLog.unshift({
      id: `aud-${Date.now()}`,
      user: currentUser?.name || "Admin",
      role: currentRole,
      action: "Exported Business Report",
      entity: report.title,
      entityId: report.id,
      timestamp: new Date().toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "Success",
      details: `Generated format: ${report.fileSize}`,
    });
  };

  const openReportModal = (rep: BusinessReport) => setSelectedReport(rep);
  const closeReportModal = () => setSelectedReport(null);

  // Role access check based on Section 43 of specification
  const canAccessBusinessSection = (
    section: "overview" | "audience" | "engagement" | "subscriptions" | "revenue" | "content-economics" | "creator-economics" | "reports"
  ): boolean => {
    switch (currentRole) {
      case "Super Admin":
      case "Analyst":
        return true;
      case "Content Admin":
        return ["overview", "audience", "engagement", "content-economics", "reports"].includes(section);
      case "Creator Manager":
        return ["overview", "creator-economics", "audience"].includes(section);
      case "Finance":
        return ["overview", "revenue", "subscriptions", "creator-economics", "reports"].includes(section);
      case "Editor":
        return ["overview", "content-economics", "engagement"].includes(section);
      default:
        return true;
    }
  };

  return (
    <BusinessContext.Provider
      value={{
        filters,
        setPeriod,
        setCountry,
        setLanguage,
        setPlatform,
        setSubscriptionPlan,
        setContentType,
        setGenre,
        setCreator,
        setSearchQuery,
        resetFilters,

        dataFreshness,

        kpis,
        snapshot,
        growthData,
        funnelData,
        retentionData,
        segments,
        languageData: languageMarketData,
        plansData: plans,
        plans,
        subFunnel: subscriptionFunnelData,
        revenueData: revenueTrends,
        revenueTrends,
        contentMatrix: contentMatrixData,
        creatorEconomics: creatorEconomicsData,
        creatorList: creatorEconomicsData,
        creatorFunnel: creatorFunnelData,
        watchTrends: watchTimeTrendsData,
        interactiveComparison: interactiveComparisonData,
        journeySteps: engagementJourneyData,
        signals,
        attentionItems,
        reports: businessReportsData,

        selectedSegment,
        setSelectedSegment,
        selectedReport,
        openReportModal,
        closeReportModal,

        dismissAttentionItem,
        exportReport,
        refreshDashboard,
        isLiveConnected,
        canAccessBusinessSection,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  return context || defaultBusinessContext;
}
