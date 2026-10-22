/* ==========================================================================
   BUSINESS DASHBOARD & EXECUTIVE INTELLIGENCE — DATA MODELS & MOCK DATA
   Iteration 4E — Business Perspective: Acquire -> Engage -> Retain -> Monetise -> Grow
   "How is ShortReel performing as a platform and business?"
   ========================================================================== */

export type BusinessPeriod =
  | "Today"
  | "Last 7 Days"
  | "Last 30 Days"
  | "Last 90 Days"
  | "This Year"
  | "Custom";

export interface ExecutiveKPI {
  id: string;
  category: "Audience" | "Engagement" | "Monetisation" | "Content";
  label: string;
  currentValue: string;
  previousValue: string;
  changePercentage: string;
  direction: "up" | "down" | "neutral";
  description: string;
  isPositiveChange: boolean;
}

export interface PlatformSnapshotItem {
  id: string;
  category: string;
  stat: string;
  label: string;
  change: string;
  observation: string;
}

export interface AudienceGrowthPoint {
  date: string;
  registeredUsers: number;
  newUsers: number;
  returningUsers: number;
  dau: number;
  mau: number;
}

export interface FunnelStep {
  label: string;
  users: number;
  formattedUsers: string;
  conversionFromPrevious: number; // percentage
  conversionFromTop: number; // percentage
  note?: string;
}

export interface RetentionCohort {
  cohort: string;
  users: string;
  d1: number;
  d7: number;
  d14: number;
  d30: number;
  d60: number;
  d90: number;
}

export interface AudienceSegment {
  name: string;
  tagline: string;
  userCount: string;
  userCountNumber: number;
  shareOfAudience: string;
  avgWatchTime: string;
  sessionsPerMonth: string;
  completionRate: string;
  choiceParticipation: string;
  subConversion: string;
  d30Retention: string;
  keyBehavior: string;
}

export interface LanguageMarketData {
  language: string;
  nativeName: string;
  audienceShare: string;
  viewers: string;
  watchTime: string;
  completionRate: string;
  subscribers: string;
  revenue: string;
}

export interface WatchTimeTrendPoint {
  period: string;
  standardHours: number;
  interactiveHours: number;
  totalHours: number;
  avgMinutesPerViewer: number;
  avgSessionDuration: number;
}

export interface EngagementJourneyStep {
  stepNumber: number;
  name: string;
  description: string;
  dropOffRate: number;
  conversionRate: number;
  users: string;
  isInteractivePeak?: boolean;
}

export interface InteractiveComparisonMetric {
  metric: string;
  interactiveValue: string;
  standardValue: string;
  difference: string;
  observation: string;
}

export interface SubscriptionPlanPerformance {
  planId: string;
  name: string;
  cadence: string;
  price: string;
  subscribers: string;
  subscribersNumber: number;
  revenue: string;
  revenueNumber: number;
  renewalRate: string;
  churnRate: string;
  avgLifetimeMonths: number;
}

export interface RevenueTrendPoint {
  month: string;
  subscriptionRevenue: number; // in Lakhs
  premiumContentRevenue: number;
  otherRevenue: number;
  totalGrossRevenue: number;
}

export interface ContentMatrixItem {
  id: string;
  title: string;
  genre: string;
  creatorName: string;
  watchTimeHours: number; // X-axis (thousands of hours)
  completionPercentage: number; // Y-axis
  audienceReach: number; // Bubble size (thousands)
  category: "Standard" | "Interactive" | "Premium";
  episodes: number;
}

export interface CreatorEconomicsItem {
  creatorId: string;
  creatorName: string;
  handle: string;
  avatar: string;
  storiesCount: number;
  views: string;
  viewsNumber: number;
  watchTime: string;
  earnings: string;
  earningsNumber: number; // in INR
  status: "Active" | "Verified" | "Rising";
  category: string;
  payoutStatus: "Paid" | "Pending Reconciliation";
}

export interface BusinessSignal {
  id: string;
  category: "Audience" | "Engagement" | "Subscription" | "Content" | "Creator";
  title: string;
  observation: string;
  supportingData: string;
  moduleLinkText: string;
  moduleLinkUrl: string;
  signalStrength: "Strong" | "Moderate" | "Emerging";
  period: string;
}

export interface AttentionItem {
  id: string;
  severity: "Review" | "Attention" | "Data Quality";
  title: string;
  description: string;
  observedImpact: string;
  suggestedAction: string;
  actionUrl: string;
  actionLabel: string;
  detectedAt: string;
}

export interface BusinessReport {
  id: string;
  title: string;
  cadence: "Monthly" | "Quarterly" | "Weekly";
  period: string;
  description: string;
  keyStat: string;
  generatedDate: string;
  fileSize: string;
}

/* ==========================================================================
   CENTRALIZED MOCK DATASETS
   ========================================================================== */

export const businessDataFreshness = "Mock data — last updated today at 09:15 AM";

// 1. EXECUTIVE KPIS (Section 6)
export const executiveKpisData: ExecutiveKPI[] = [
  // Audience
  {
    id: "kpi-reg-users",
    category: "Audience",
    label: "Total Registered Users",
    currentValue: "1,428,500",
    previousValue: "1,266,000",
    changePercentage: "+12.8%",
    direction: "up",
    description: "Cumulative user accounts across mobile and web",
    isPositiveChange: true,
  },
  {
    id: "kpi-mau",
    category: "Audience",
    label: "Monthly Active Users (MAU)",
    currentValue: "842,000",
    previousValue: "771,000",
    changePercentage: "+9.2%",
    direction: "up",
    description: "Unique active viewers in the last 30-day window",
    isPositiveChange: true,
  },
  {
    id: "kpi-dau",
    category: "Audience",
    label: "Daily Active Users (DAU)",
    currentValue: "312,400",
    previousValue: "273,800",
    changePercentage: "+14.1%",
    direction: "up",
    description: "Average unique active viewers per day",
    isPositiveChange: true,
  },
  {
    id: "kpi-new-users",
    category: "Audience",
    label: "New Registered Users",
    currentValue: "142,600",
    previousValue: "120,400",
    changePercentage: "+18.4%",
    direction: "up",
    description: "First-time registrations in selected period",
    isPositiveChange: true,
  },

  // Engagement
  {
    id: "kpi-watch-time",
    category: "Engagement",
    label: "Total Watch Time",
    currentValue: "42.8M min",
    previousValue: "36.8M min",
    changePercentage: "+16.2%",
    direction: "up",
    description: "Aggregate minutes consumed across all episodes",
    isPositiveChange: true,
  },
  {
    id: "kpi-avg-session",
    category: "Engagement",
    label: "Avg Session Duration",
    currentValue: "18.4 min",
    previousValue: "17.5 min",
    changePercentage: "+5.2%",
    direction: "up",
    description: "Mean time spent per viewing session",
    isPositiveChange: true,
  },
  {
    id: "kpi-episodes-watched",
    category: "Engagement",
    label: "Episodes Watched",
    currentValue: "3,842,000",
    previousValue: "3,164,000",
    changePercentage: "+21.4%",
    direction: "up",
    description: "Total episode streaming starts completed or partial",
    isPositiveChange: true,
  },
  {
    id: "kpi-inter-partic",
    category: "Engagement",
    label: "Interactive Participation",
    currentValue: "52.1%",
    previousValue: "46.5%",
    changePercentage: "+12.0%",
    direction: "up",
    description: "Direct viewer decision votes on interactive nodes",
    isPositiveChange: true,
  },

  // Monetisation
  {
    id: "kpi-active-subs",
    category: "Monetisation",
    label: "Active Subscribers",
    currentValue: "128,420",
    previousValue: "118,460",
    changePercentage: "+8.4%",
    direction: "up",
    description: "Paid VIP monthly, quarterly, and annual subscribers",
    isPositiveChange: true,
  },
  {
    id: "kpi-sub-revenue",
    category: "Monetisation",
    label: "Subscription Revenue",
    currentValue: "₹42.6L",
    previousValue: "₹38.3L",
    changePercentage: "+11.2%",
    direction: "up",
    description: "Total recurring plan receipts for current period",
    isPositiveChange: true,
  },
  {
    id: "kpi-mrr",
    category: "Monetisation",
    label: "Monthly Recurring Revenue",
    currentValue: "₹36.8L",
    previousValue: "₹33.6L",
    changePercentage: "+9.5%",
    direction: "up",
    description: "Normalized monthly recurring subscription revenue",
    isPositiveChange: true,
  },
  {
    id: "kpi-churn",
    category: "Monetisation",
    label: "Subscription Churn Rate",
    currentValue: "6.4%",
    previousValue: "7.2%",
    changePercentage: "-0.8 pp",
    direction: "down",
    description: "Monthly subscription non-renewal and cancellation rate",
    isPositiveChange: true, // Churn down is positive
  },

  // Content
  {
    id: "kpi-published-stories",
    category: "Content",
    label: "Published Stories",
    currentValue: "214",
    previousValue: "196",
    changePercentage: "+9.2%",
    direction: "up",
    description: "Active story series across standard and interactive",
    isPositiveChange: true,
  },
  {
    id: "kpi-published-eps",
    category: "Content",
    label: "Published Episodes",
    currentValue: "1,280",
    previousValue: "1,168",
    changePercentage: "+9.6%",
    direction: "up",
    description: "Available episodic vertical video installments",
    isPositiveChange: true,
  },
  {
    id: "kpi-active-creators",
    category: "Content",
    label: "Active Creators",
    currentValue: "84",
    previousValue: "70",
    changePercentage: "+20.0%",
    direction: "up",
    description: "Independent creators with content published this month",
    isPositiveChange: true,
  },
  {
    id: "kpi-interactive-stories",
    category: "Content",
    label: "Interactive Stories",
    currentValue: "42",
    previousValue: "34",
    changePercentage: "+23.5%",
    direction: "up",
    description: "Stories with multi-branching choice nodes",
    isPositiveChange: true,
  },
];

// 2. PLATFORM SNAPSHOT CARDS (Section 7)
export const platformSnapshotData: PlatformSnapshotItem[] = [
  {
    id: "snap-aud",
    category: "Audience Growth",
    stat: "+12.8%",
    label: "User growth",
    change: "↑ 18.4K new accounts",
    observation: "New-user activity increased during the selected period, driven by viral character clip shares.",
  },
  {
    id: "snap-eng",
    category: "Engagement",
    stat: "68 min",
    label: "Average monthly watch time",
    change: "↑ 5.2% session hold",
    observation: "Returning viewers account for a significant share of total watch activity across middle episodes.",
  },
  {
    id: "snap-mon",
    category: "Monetisation",
    stat: "₹42.6L",
    label: "Subscription revenue",
    change: "↑ 11.2% over previous 30d",
    observation: "Subscription revenue increased compared with the previous period, led by Quarterly VIP renewals.",
  },
  {
    id: "snap-con",
    category: "Content",
    stat: "214",
    label: "Published stories",
    change: "↑ 18 new releases",
    observation: "Interactive stories represent a growing portion of active content with 23.5% catalog expansion.",
  },
  {
    id: "snap-cre",
    category: "Creator Ecosystem",
    stat: "84 Creators",
    label: "Active publishing creators",
    change: "↑ 14 verified creators",
    observation: "Creator onboarding and submission turnaround improved, supporting faster episode releases.",
  },
];

// 3. AUDIENCE GROWTH TIME-SERIES (Section 8)
export const audienceGrowthData: AudienceGrowthPoint[] = [
  { date: "01 Sep", registeredUsers: 1266000, newUsers: 3800, returningUsers: 242000, dau: 268000, mau: 771000 },
  { date: "05 Sep", registeredUsers: 1284000, newUsers: 4200, returningUsers: 251000, dau: 274000, mau: 780000 },
  { date: "10 Sep", registeredUsers: 1312000, newUsers: 4900, returningUsers: 266000, dau: 286000, mau: 795000 },
  { date: "15 Sep", registeredUsers: 1348000, newUsers: 5400, returningUsers: 279000, dau: 298000, mau: 812000 },
  { date: "20 Sep", registeredUsers: 1386000, newUsers: 5800, returningUsers: 294000, dau: 305000, mau: 826000 },
  { date: "25 Sep", registeredUsers: 1428500, newUsers: 6200, returningUsers: 312000, dau: 312400, mau: 842000 },
];

// 4. AUDIENCE FUNNEL (Section 9)
export const audienceFunnelData: FunnelStep[] = [
  { label: "Visitors", users: 1000000, formattedUsers: "1,000,000", conversionFromPrevious: 100, conversionFromTop: 100, note: "Top-of-funnel reach" },
  { label: "Registered Users", users: 420000, formattedUsers: "420,000", conversionFromPrevious: 42.0, conversionFromTop: 42.0, note: "42% sign-up conversion" },
  { label: "First Watch", users: 285600, formattedUsers: "285,600", conversionFromPrevious: 68.0, conversionFromTop: 28.6, note: "68% watch within 24h" },
  { label: "Returning Viewers", users: 145656, formattedUsers: "145,656", conversionFromPrevious: 51.0, conversionFromTop: 14.6, note: "51% return for Ep 2+" },
  { label: "Engaged Viewers", users: 84480, formattedUsers: "84,480", conversionFromPrevious: 58.0, conversionFromTop: 8.4, note: "Complete 3+ episodes or vote" },
  { label: "Paid Subscribers", users: 34957, formattedUsers: "34,957", conversionFromPrevious: 41.4, conversionFromTop: 3.5, note: "Converted to VIP plan" },
];

// 5. AUDIENCE RETENTION (Section 10)
export const audienceRetentionData: RetentionCohort[] = [
  { cohort: "Jun 2026", users: "112K", d1: 39, d7: 22, d14: 17, d30: 10, d60: 7, d90: 5 },
  { cohort: "Jul 2026", users: "128K", d1: 41, d7: 23, d14: 18, d30: 11, d60: 8, d90: 6 },
  { cohort: "Aug 2026", users: "136K", d1: 42, d7: 24, d14: 19, d30: 12, d60: 9, d90: 7 },
  { cohort: "Sep 2026", users: "142K", d1: 44, d7: 26, d14: 21, d30: 14, d60: 10, d90: 8 },
];

// 6. AUDIENCE SEGMENTS (Section 30 & 31)
export const audienceSegmentsData: AudienceSegment[] = [
  {
    name: "Interactive Viewers",
    tagline: "Engage frequently with choice nodes, predictions, and branching paths",
    userCount: "182,000",
    userCountNumber: 182000,
    shareOfAudience: "21.6%",
    avgWatchTime: "74 min",
    sessionsPerMonth: "7.8",
    completionRate: "71%",
    choiceParticipation: "64%",
    subConversion: "8.4%",
    d30Retention: "58%",
    keyBehavior: "High organic story sharing and vote participation at cliffhangers.",
  },
  {
    name: "VIP Subscribers",
    tagline: "Paid active subscribers with early episode access and ad-free streaming",
    userCount: "128,420",
    userCountNumber: 128420,
    shareOfAudience: "15.3%",
    avgWatchTime: "114 min",
    sessionsPerMonth: "12.4",
    completionRate: "84%",
    choiceParticipation: "68%",
    subConversion: "100%",
    d30Retention: "74%",
    keyBehavior: "Multi-episode binge viewing with 88% renewal rate on quarterly/annual plans.",
  },
  {
    name: "Returning Free Viewers",
    tagline: "Consistent multi-session free viewers completing 2+ free episodes per week",
    userCount: "516,000",
    userCountNumber: 516000,
    shareOfAudience: "61.3%",
    avgWatchTime: "52 min",
    sessionsPerMonth: "5.4",
    completionRate: "62%",
    choiceParticipation: "46%",
    subConversion: "4.8%",
    d30Retention: "46%",
    keyBehavior: "Strong weekend consumption; prime candidates for VIP trial conversions.",
  },
  {
    name: "New Viewers",
    tagline: "Acquired in the last 14 days, primarily through social and shared links",
    userCount: "142,600",
    userCountNumber: 142600,
    shareOfAudience: "16.9%",
    avgWatchTime: "38 min",
    sessionsPerMonth: "3.2",
    completionRate: "58%",
    choiceParticipation: "48%",
    subConversion: "3.6%",
    d30Retention: "36%",
    keyBehavior: "Strongest response to Episode 1 cold opens; drop off if pacing is slow.",
  },
  {
    name: "High-Engagement Viewers",
    tagline: "Top 10% consumption cohort across watch time and character following",
    userCount: "94,000",
    userCountNumber: 94000,
    shareOfAudience: "11.2%",
    avgWatchTime: "142 min",
    sessionsPerMonth: "14.2",
    completionRate: "89%",
    choiceParticipation: "78%",
    subConversion: "18.2%",
    d30Retention: "81%",
    keyBehavior: "Follow characters, share story links, and replay alternate narrative paths.",
  },
];

// 7. LANGUAGE / REGIONAL DISTRIBUTION (Section 32)
export const languageMarketData: LanguageMarketData[] = [
  { language: "Hindi", nativeName: "हिन्दी", audienceShare: "46.2%", viewers: "389K", watchTime: "19.8M min", completionRate: "71%", subscribers: "59.3K", revenue: "₹19.6L" },
  { language: "English / Hinglish", nativeName: "English", audienceShare: "27.8%", viewers: "234K", watchTime: "12.4M min", completionRate: "74%", subscribers: "41.2K", revenue: "₹14.2L" },
  { language: "Telugu", nativeName: "తెలుగు", audienceShare: "12.4%", viewers: "104K", watchTime: "5.2M min", completionRate: "68%", subscribers: "14.8K", revenue: "₹4.6L" },
  { language: "Tamil", nativeName: "தமிழ்", audienceShare: "7.6%", viewers: "64K", watchTime: "3.4M min", completionRate: "66%", subscribers: "8.2K", revenue: "₹2.6L" },
  { language: "Kannada", nativeName: "ಕನ್ನಡ", audienceShare: "3.8%", viewers: "32K", watchTime: "1.2M min", completionRate: "63%", subscribers: "3.4K", revenue: "₹1.1L" },
  { language: "Malayalam", nativeName: "മലയാളം", audienceShare: "2.2%", viewers: "19K", watchTime: "800K min", completionRate: "69%", subscribers: "1.5K", revenue: "₹0.5L" },
];

// 7.5. WATCH TIME TRENDS (Section 12)
export const watchTimeTrendsData: WatchTimeTrendPoint[] = [
  {
    period: "Jun 2026",
    standardHours: 110000,
    interactiveHours: 160000,
    totalHours: 270000,
    avgMinutesPerViewer: 52,
    avgSessionDuration: 14.8,
  },
  {
    period: "Jul 2026",
    standardHours: 125000,
    interactiveHours: 195000,
    totalHours: 320000,
    avgMinutesPerViewer: 58,
    avgSessionDuration: 16.2,
  },
  {
    period: "Aug 2026",
    standardHours: 138000,
    interactiveHours: 232000,
    totalHours: 370000,
    avgMinutesPerViewer: 63,
    avgSessionDuration: 17.5,
  },
  {
    period: "Sep 2026",
    standardHours: 154000,
    interactiveHours: 276000,
    totalHours: 430000,
    avgMinutesPerViewer: 68,
    avgSessionDuration: 18.4,
  },
];

// 8. ENGAGEMENT JOURNEY (Section 13)
export const engagementJourneyData: EngagementJourneyStep[] = [
  { stepNumber: 1, name: "Open App", description: "Launches vertical feed session", dropOffRate: 0, conversionRate: 100, users: "842K" },
  { stepNumber: 2, name: "Start Story", description: "Views Episode 1 preview or start", dropOffRate: 12, conversionRate: 88, users: "741K" },
  { stepNumber: 3, name: "Watch Episode", description: "Streams vertical episode video", dropOffRate: 7, conversionRate: 82, users: "690K" },
  { stepNumber: 4, name: "Complete Episode", description: "Reaches episode cliffhanger", dropOffRate: 17, conversionRate: 68, users: "572K" },
  { stepNumber: 5, name: "Make Choice", description: "Interacts with interactive node", dropOffRate: 24, conversionRate: 52, users: "438K", isInteractivePeak: true },
  { stepNumber: 6, name: "Continue Story", description: "Streams downstream branch", dropOffRate: 12, conversionRate: 46, users: "387K" },
  { stepNumber: 7, name: "Follow Character", description: "Subscribes to character profile", dropOffRate: 39, conversionRate: 28, users: "235K" },
  { stepNumber: 8, name: "Share Story", description: "Generates external link or clip", dropOffRate: 50, conversionRate: 14, users: "118K" },
  { stepNumber: 9, name: "Return Session", description: "Re-opens app within 48 hours", dropOffRate: 0, conversionRate: 64, users: "539K" },
];

// 9. INTERACTIVE VS STANDARD CONSUMPTION (Section 14)
export const interactiveComparisonData: InteractiveComparisonMetric[] = [
  {
    metric: "Series Completion",
    interactiveValue: "71.2%",
    standardValue: "64.0%",
    difference: "+7.2 pp",
    observation: "Interactive stories exhibit higher multi-episode continuation past Episode 2.",
  },
  {
    metric: "Average Watch Time",
    interactiveValue: "74 min / mo",
    standardValue: "56 min / mo",
    difference: "+32.1%",
    observation: "Choice replay and alternate branch exploration increase aggregate viewer time.",
  },
  {
    metric: "48-Hour Return Rate",
    interactiveValue: "58.4%",
    standardValue: "46.2%",
    difference: "+12.2 pp",
    observation: "Cliffhanger decision points create organic viewing anticipation.",
  },
  {
    metric: "Average Session Duration",
    interactiveValue: "22.4 min",
    standardValue: "15.8 min",
    difference: "+41.8%",
    observation: "Interactive participants view multiple branches in a single sitting.",
  },
  {
    metric: "Story Share Rate",
    interactiveValue: "18.2%",
    standardValue: "9.4%",
    difference: "+8.8 pp",
    observation: "Viewers frequently share custom choice paths with peer networks.",
  },
];

// 10. SUBSCRIPTION PLAN PERFORMANCE (Section 17)
export const subscriptionPlansData: SubscriptionPlanPerformance[] = [
  {
    planId: "sub-monthly",
    name: "Monthly VIP",
    cadence: "Monthly",
    price: "₹49 / month",
    subscribers: "42,800",
    subscribersNumber: 42800,
    revenue: "₹21.4L",
    revenueNumber: 2140000,
    renewalRate: "78.4%",
    churnRate: "8.2%",
    avgLifetimeMonths: 4.8,
  },
  {
    planId: "sub-quarterly",
    name: "Quarterly VIP",
    cadence: "Quarterly",
    price: "₹129 / quarter",
    subscribers: "18,200",
    subscribersNumber: 18200,
    revenue: "₹13.6L",
    revenueNumber: 1360000,
    renewalRate: "84.2%",
    churnRate: "5.6%",
    avgLifetimeMonths: 8.6,
  },
  {
    planId: "sub-annual",
    name: "Annual VIP",
    cadence: "Annual",
    price: "₹399 / year",
    subscribers: "9,400",
    subscribersNumber: 9400,
    revenue: "₹7.6L",
    revenueNumber: 760000,
    renewalRate: "91.1%",
    churnRate: "3.4%",
    avgLifetimeMonths: 16.4,
  },
];

// 11. SUBSCRIPTION FUNNEL (Section 16)
export const subscriptionFunnelData: FunnelStep[] = [
  { label: "Free Active Viewers", users: 1290000, formattedUsers: "1.29M", conversionFromPrevious: 100, conversionFromTop: 100, note: "Total free audience" },
  { label: "Viewed Premium Episode Hook", users: 410000, formattedUsers: "410,000", conversionFromPrevious: 31.8, conversionFromTop: 31.8, note: "Reached locked episode" },
  { label: "Started 3-Day Free Trial", users: 98000, formattedUsers: "98,000", conversionFromPrevious: 23.9, conversionFromTop: 7.6, note: "Trial initiated" },
  { label: "Converted to Paid Plan", users: 42800, formattedUsers: "42,800", conversionFromPrevious: 43.7, conversionFromTop: 3.3, note: "First billing success" },
  { label: "Renewed Plan (>30 Days)", users: 34200, formattedUsers: "34,200", conversionFromPrevious: 79.9, conversionFromTop: 2.7, note: "Active retained subscribers" },
];

// 12. REVENUE TREND (Section 19)
export const revenueTrendData: RevenueTrendPoint[] = [
  { month: "Apr 2026", subscriptionRevenue: 24.2, premiumContentRevenue: 6.4, otherRevenue: 3.8, totalGrossRevenue: 34.4 },
  { month: "May 2026", subscriptionRevenue: 28.1, premiumContentRevenue: 7.2, otherRevenue: 4.1, totalGrossRevenue: 39.4 },
  { month: "Jun 2026", subscriptionRevenue: 32.4, premiumContentRevenue: 8.5, otherRevenue: 4.6, totalGrossRevenue: 45.5 },
  { month: "Jul 2026", subscriptionRevenue: 35.8, premiumContentRevenue: 9.1, otherRevenue: 5.2, totalGrossRevenue: 50.1 },
  { month: "Aug 2026", subscriptionRevenue: 38.3, premiumContentRevenue: 9.8, otherRevenue: 5.6, totalGrossRevenue: 53.7 },
  { month: "Sep 2026", subscriptionRevenue: 42.6, premiumContentRevenue: 10.6, otherRevenue: 6.0, totalGrossRevenue: 59.2 },
];

// 13. CONTENT PERFORMANCE MATRIX (Section 24)
export const contentMatrixData: ContentMatrixItem[] = [
  { id: "cm-01", title: "The Missing Phone", genre: "Thriller", creatorName: "Arjun Mehta", watchTimeHours: 1800, completionPercentage: 74, audienceReach: 1420, category: "Interactive", episodes: 6 },
  { id: "cm-02", title: "Messages From Tomorrow", genre: "Mystery", creatorName: "Kabir Rao", watchTimeHours: 2400, completionPercentage: 68, audienceReach: 1840, category: "Interactive", episodes: 8 },
  { id: "cm-03", title: "Last Train Home", genre: "Drama", creatorName: "Meera Sharma", watchTimeHours: 1100, completionPercentage: 51, audienceReach: 850, category: "Standard", episodes: 5 },
  { id: "cm-04", title: "One More Message", genre: "Romance", creatorName: "Priya Nair", watchTimeHours: 1600, completionPercentage: 78, audienceReach: 1120, category: "Standard", episodes: 4 },
  { id: "cm-05", title: "Parallel Echoes", genre: "Sci-Fi", creatorName: "Kabir Rao", watchTimeHours: 950, completionPercentage: 53, audienceReach: 740, category: "Interactive", episodes: 6 },
  { id: "cm-06", title: "Shadow Campus", genre: "Thriller", creatorName: "Arjun Mehta", watchTimeHours: 1450, completionPercentage: 72, audienceReach: 1200, category: "Premium", episodes: 8 },
  { id: "cm-07", title: "Neon Karma 2099", genre: "Cyberpunk", creatorName: "Rohan Sen", watchTimeHours: 1020, completionPercentage: 61, audienceReach: 810, category: "Premium", episodes: 7 },
  { id: "cm-08", title: "Chai & Choices", genre: "Slice of Life", creatorName: "Priya Nair", watchTimeHours: 820, completionPercentage: 81, audienceReach: 680, category: "Interactive", episodes: 4 },
];

// 14. CREATOR ECONOMICS FUNNEL & DATA (Section 27 & 28)
export const creatorFunnelData: FunnelStep[] = [
  { label: "Creator Applicants", users: 1420, formattedUsers: "1,420", conversionFromPrevious: 100, conversionFromTop: 100, note: "Received via Creator Portal" },
  { label: "Approved Creators", users: 380, formattedUsers: "380", conversionFromPrevious: 26.8, conversionFromTop: 26.8, note: "Editorial portfolio review passed" },
  { label: "Active Creators", users: 184, formattedUsers: "184", conversionFromPrevious: 48.4, conversionFromTop: 13.0, note: "Drafting or producing series" },
  { label: "Creators With Stories", users: 112, formattedUsers: "112", conversionFromPrevious: 60.9, conversionFromTop: 7.9, note: "Submitted complete story arcs" },
  { label: "Published Creators", users: 84, formattedUsers: "84", conversionFromPrevious: 75.0, conversionFromTop: 5.9, note: "Currently streaming in catalog" },
  { label: "Revenue-Generating Creators", users: 62, formattedUsers: "62", conversionFromPrevious: 73.8, conversionFromTop: 4.4, note: "Received payouts or pool share" },
];

export const creatorEconomicsData: CreatorEconomicsItem[] = [
  {
    creatorId: "cr-arjun-01",
    creatorName: "Arjun Mehta",
    handle: "@arjunstories",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    storiesCount: 8,
    views: "4.2M",
    viewsNumber: 4200000,
    watchTime: "1.8M hrs",
    earnings: "₹4.8L",
    earningsNumber: 480000,
    status: "Active",
    category: "Thriller / Interactive",
    payoutStatus: "Paid",
  },
  {
    creatorId: "cr-priya-02",
    creatorName: "Priya Nair",
    handle: "@priyawrites",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80",
    storiesCount: 5,
    views: "2.7M",
    viewsNumber: 2700000,
    watchTime: "1.1M hrs",
    earnings: "₹2.9L",
    earningsNumber: 290000,
    status: "Active",
    category: "Romance / Drama",
    payoutStatus: "Paid",
  },
  {
    creatorId: "cr-kabir-03",
    creatorName: "Kabir Rao",
    handle: "@kabirverse",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    storiesCount: 11,
    views: "6.1M",
    viewsNumber: 6100000,
    watchTime: "2.4M hrs",
    earnings: "₹5.7L",
    earningsNumber: 570000,
    status: "Verified",
    category: "Mystery / Sci-Fi",
    payoutStatus: "Paid",
  },
  {
    creatorId: "cr-meera-04",
    creatorName: "Meera Sharma",
    handle: "@meerastories",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
    storiesCount: 4,
    views: "1.9M",
    viewsNumber: 1900000,
    watchTime: "820K hrs",
    earnings: "₹1.8L",
    earningsNumber: 180000,
    status: "Active",
    category: "Drama",
    payoutStatus: "Paid",
  },
  {
    creatorId: "cr-rohan-05",
    creatorName: "Rohan Sen",
    handle: "@rohanshow",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    storiesCount: 6,
    views: "2.4M",
    viewsNumber: 2400000,
    watchTime: "1.0M hrs",
    earnings: "₹2.4L",
    earningsNumber: 240000,
    status: "Active",
    category: "Sci-Fi / Cyberpunk",
    payoutStatus: "Pending Reconciliation",
  },
];

// 15. BUSINESS SIGNALS (Section 33 & 34)
export const businessSignalsData: BusinessSignal[] = [
  {
    id: "bsig-01",
    category: "Audience",
    title: "Audience Growth Acceleration",
    observation: "New-user registration velocity increased 18.4% compared with the previous 30-day baseline.",
    supportingData: "+142,600 new registered accounts across Android & iOS.",
    moduleLinkText: "Inspect Audience Signals in Story Lab",
    moduleLinkUrl: "/admin/story-lab/audience",
    signalStrength: "Strong",
    period: "Last 30 Days",
  },
  {
    id: "bsig-02",
    category: "Engagement",
    title: "Interactive Branch Continuation Outperformance",
    observation: "Returning viewers contributed a significantly larger share of total watch time on stories with branching choices (+32.1%).",
    supportingData: "Average 74 min watch time for interactive viewers vs 56 min standard.",
    moduleLinkText: "View Interactive Signals in Story Lab",
    moduleLinkUrl: "/admin/story-lab/interactive",
    signalStrength: "Strong",
    period: "Last 30 Days",
  },
  {
    id: "bsig-03",
    category: "Subscription",
    title: "Quarterly Plan Renewal Resilience",
    observation: "Subscription starts and renewals increased 11.2%, with Quarterly VIP showing the lowest quarterly churn rate (5.6%).",
    supportingData: "₹42.6L total subscription revenue generated.",
    moduleLinkText: "Open Subscriptions Management",
    moduleLinkUrl: "/admin/subscriptions",
    signalStrength: "Strong",
    period: "Last 30 Days",
  },
  {
    id: "bsig-04",
    category: "Creator",
    title: "Creator Ecosystem Publishing Velocity",
    observation: "The count of active publishing creators expanded 20% following the rollout of the AI Story Studio workflow.",
    supportingData: "84 active creators streaming across 214 series.",
    moduleLinkText: "Review Creator Operations in Creator Management",
    moduleLinkUrl: "/admin/creators",
    signalStrength: "Moderate",
    period: "Last 30 Days",
  },
];

// 16. REQUIRES ATTENTION ITEMS (Section 36)
export const attentionItemsData: AttentionItem[] = [
  {
    id: "att-01",
    severity: "Attention",
    title: "Subscription churn increased in Day 60+ free trial cohorts",
    description: "Viewers who converted through short marketing clips show a 2.4 percentage point higher non-renewal rate after month two.",
    observedImpact: "Approx. 410 subscriber cancellations in the 60-90 day cohort.",
    suggestedAction: "Evaluate middle-tier VIP exclusive content drops or notification re-engagement timing.",
    actionUrl: "/admin/business/subscriptions",
    actionLabel: "Review Subscriptions",
    detectedAt: "Today, 08:30 AM",
  },
  {
    id: "att-02",
    severity: "Review",
    title: "Episode 3 continuation drop in selected drama submissions",
    description: "Two newly released drama series demonstrate steeper-than-average continuation drop-offs at Episode 3 (-35%).",
    observedImpact: "Lower downstream completion across episodes 4 and 5.",
    suggestedAction: "Coordinate with creators via Story Lab to investigate cliffhanger placement.",
    actionUrl: "/admin/story-lab/stories",
    actionLabel: "Open Story Lab",
    detectedAt: "Yesterday, 04:15 PM",
  },
  {
    id: "att-03",
    severity: "Data Quality",
    title: "Payment gateway reconciliation batch discrepancy",
    description: "A minor 0.8% variance detected between third-party billing gateway receipts and internal subscription entitlement states.",
    observedImpact: "₹18,400 in provisional trial receipts flagged for automated audit.",
    suggestedAction: "Run reconciliation audit check in Finance and Audit Log.",
    actionUrl: "/admin/settings",
    actionLabel: "View Audit Log",
    detectedAt: "23 Sep 2026, 11:00 AM",
  },
];

// 17. EXECUTIVE VIEW SUMMARY (Section 35)
export const executiveViewSummary = {
  audience: {
    headline: "Audience Expansion",
    change: "+9.2% MAU",
    text: "Monthly active users reached 842K, with daily active stickiness (DAU/MAU) solidifying at 37.1%.",
  },
  engagement: {
    headline: "Interactive Deepening",
    change: "+16.2% Watch Time",
    text: "Average session duration expanded to 18.4 minutes, driven by higher retention on interactive branching cliffhangers.",
  },
  monetisation: {
    headline: "Revenue Growth",
    change: "+11.2% Subscription Rev",
    text: "Subscription revenue reached ₹42.6L with monthly recurring revenue (MRR) climbing to ₹36.8L and churn declining to 6.4%.",
  },
  content: {
    headline: "Portfolio Expansion",
    change: "+18 Series",
    text: "Catalog expanded to 214 published stories and 1,280 episodes, with interactive series accounting for 23.5% of new additions.",
  },
  creatorEcosystem: {
    headline: "Creator Health",
    change: "+20% Active Creators",
    text: "84 independent creators published content this period, generating ₹17.6L in aggregate creator revenue share.",
  },
};

// 18. EXECUTIVE REPORTS (Section 37)
export const businessReportsData: BusinessReport[] = [
  {
    id: "rep-01",
    title: "Executive Business Health Briefing",
    cadence: "Monthly",
    period: "September 2026",
    description: "Complete executive summary of audience growth, subscription revenue, churn, and catalog expansion.",
    keyStat: "₹59.2L Gross • 842K MAU",
    generatedDate: "24 Sep 2026",
    fileSize: "2.4 MB PDF",
  },
  {
    id: "rep-02",
    title: "Audience Acquisition & Retention Cohort Report",
    cadence: "Monthly",
    period: "September 2026",
    description: "In-depth D1 to D90 retention curves, acquisition channel performance, and regional market penetration.",
    keyStat: "14.2% D30 Retention",
    generatedDate: "22 Sep 2026",
    fileSize: "3.1 MB PDF",
  },
  {
    id: "rep-03",
    title: "Interactive Engagement & Choice Telemetry",
    cadence: "Monthly",
    period: "September 2026",
    description: "Comparative study between interactive and standard vertical series completion and session hold.",
    keyStat: "52.1% Choice Participation",
    generatedDate: "20 Sep 2026",
    fileSize: "1.8 MB PDF",
  },
  {
    id: "rep-04",
    title: "Subscription & Churn Analysis",
    cadence: "Monthly",
    period: "September 2026",
    description: "Free-to-paid conversion funnel, plan breakdown, voluntary cancellation trends, and MRR growth.",
    keyStat: "₹36.8L MRR • 6.4% Churn",
    generatedDate: "18 Sep 2026",
    fileSize: "2.2 MB PDF",
  },
  {
    id: "rep-05",
    title: "Creator Economics & Payout Summary",
    cadence: "Monthly",
    period: "September 2026",
    description: "Creator ecosystem funnel, earnings distribution, submission velocity, and retention metrics.",
    keyStat: "84 Creators • ₹17.6L Payouts",
    generatedDate: "16 Sep 2026",
    fileSize: "1.9 MB PDF",
  },
  {
    id: "rep-06",
    title: "Content Economics & Monetisation Matrix",
    cadence: "Quarterly",
    period: "Q3 2026",
    description: "Correlation matrix between episode production, watch time, completion, and subscription starts.",
    keyStat: "214 Series • 42.8M min",
    generatedDate: "15 Sep 2026",
    fileSize: "4.2 MB PDF",
  },
];
