/* ==========================================================================
   SHORTREEL ADMIN — MOCK DATA LAYER
   Coherent relationships:
   Series → Season → Episode → Video → Characters → Interactive Story Nodes
   Creators → Series
   Users → Subscriptions
   ========================================================================== */

// ---------- STATUS TYPES ----------
export type ContentStatus =
  | "Draft"
  | "In Review"
  | "Processing"
  | "Ready"
  | "Published"
  | "Scheduled"
  | "Archived"
  | "Failed";

export type CreatorStatus = "Pending" | "Active" | "Suspended" | "Rejected";
export type UserStatus = "Active" | "Suspended" | "Blocked";
export type PlanStatus = "Active" | "Inactive";
export type VideoProcessingStatus = "Uploaded" | "Processing" | "Ready" | "Failed";
export type NotificationStatus = "Draft" | "Scheduled" | "Sent" | "Failed";

// ---------- ADMIN ROLES ----------
export type AdminRole =
  | "Super Admin"
  | "Content Admin"
  | "Editor"
  | "Creator Manager"
  | "Analyst"
  | "Finance";

export const adminRoles: { role: AdminRole; description: string; access: string[] }[] = [
  {
    role: "Super Admin",
    description: "Full platform access",
    access: ["Everything"],
  },
  {
    role: "Content Admin",
    description: "Content management",
    access: ["Series", "Seasons", "Episodes", "Videos", "Genres", "Languages"],
  },
  {
    role: "Editor",
    description: "Series / Episodes / Story content",
    access: ["Series", "Seasons", "Episodes", "Characters", "Interactive"],
  },
  {
    role: "Creator Manager",
    description: "Creator and submission management",
    access: ["Creators", "Submissions"],
  },
  {
    role: "Analyst",
    description: "Analytics only",
    access: ["Platform Analytics", "Content Analytics", "Engagement Analytics"],
  },
  {
    role: "Finance",
    description: "Subscriptions and revenue",
    access: ["Plans", "Subscriptions", "Revenue", "Entitlements"],
  },
];

// ---------- ADMIN SERIES ----------
export interface AdminSeries {
  id: string;
  title: string;
  slug: string;
  description: string;
  language: string;
  genre: string;
  seasons: number;
  episodes: number;
  status: ContentStatus;
  interactive: boolean;
  visibility: "Public" | "Unlisted" | "Private";
  contentType: "Original" | "Creator Original" | "Licensed" | "Pilot";
  ageRating: string;
  tags: string[];
  views: string;
  completion: string;
  watchTime: string;
  engagement: string;
  creatorId: string;
  creatorName: string;
  featured?: boolean;
  spotlightBadge?: string;
  updatedAt: string;
  createdAt: string;
}

export const adminSeries: AdminSeries[] = [
  {
    id: "ser-001",
    title: "The Missing Phone",
    slug: "the-missing-phone",
    description:
      "A college student's lost phone reveals dangerous secrets when strangers start texting back.",
    language: "Hindi",
    genre: "Mystery · Thriller",
    seasons: 2,
    episodes: 18,
    status: "Published",
    interactive: true,
    visibility: "Public",
    contentType: "Original",
    ageRating: "16+",
    tags: ["mystery", "college", "thriller", "interactive"],
    views: "2.4M",
    completion: "78%",
    watchTime: "8.4M min",
    engagement: "91%",
    creatorId: "ananya-studios",
    creatorName: "Ananya Studios",
    updatedAt: "20 Sep 2026",
    createdAt: "01 Jun 2026",
  },
  {
    id: "ser-002",
    title: "Shadow Campus",
    slug: "shadow-campus",
    description:
      "Students at an elite university uncover a secret society controlling campus politics.",
    language: "Hindi",
    genre: "Drama · Suspense",
    seasons: 1,
    episodes: 12,
    status: "Published",
    interactive: true,
    visibility: "Public",
    contentType: "Original",
    ageRating: "13+",
    tags: ["campus", "drama", "secret-society"],
    views: "1.8M",
    completion: "72%",
    watchTime: "5.2M min",
    engagement: "84%",
    creatorId: "ananya-studios",
    creatorName: "Ananya Studios",
    updatedAt: "18 Sep 2026",
    createdAt: "15 May 2026",
  },
  {
    id: "ser-003",
    title: "Monsoon Room 302",
    slug: "monsoon-room-302",
    description:
      "Two estranged ex-fiancés are stranded in a flooded coastal guest room during an overnight thunderstorm.",
    language: "Telugu",
    genre: "Romance · Drama",
    seasons: 1,
    episodes: 8,
    status: "Published",
    interactive: false,
    visibility: "Public",
    contentType: "Creator Original",
    ageRating: "16+",
    tags: ["romance", "monsoon", "reunion"],
    views: "1.2M",
    completion: "82%",
    watchTime: "3.1M min",
    engagement: "76%",
    creatorId: "priya-deepak",
    creatorName: "Priya Deepak Films",
    updatedAt: "12 Sep 2026",
    createdAt: "01 Jul 2026",
  },
  {
    id: "ser-004",
    title: "Neon Karma 2099",
    slug: "neon-karma-2099",
    description:
      "In a neon-lit Mumbai sky-corridor, an ethical memory hacker is hired to delete a crime she hasn't committed yet.",
    language: "Hinglish",
    genre: "Cyberpunk · Thriller",
    seasons: 1,
    episodes: 10,
    status: "Published",
    interactive: true,
    visibility: "Public",
    contentType: "Original",
    ageRating: "16+",
    tags: ["cyberpunk", "sci-fi", "noir", "interactive"],
    views: "980K",
    completion: "68%",
    watchTime: "2.8M min",
    engagement: "88%",
    creatorId: "rohan-kapoor",
    creatorName: "Rohan Kapoor",
    updatedAt: "22 Sep 2026",
    createdAt: "20 Jul 2026",
  },
  {
    id: "ser-005",
    title: "Last Night Train",
    slug: "last-night-train",
    description:
      "Strangers on the last Mumbai local share stories that change each other's lives forever.",
    language: "Hindi",
    genre: "Anthology · Drama",
    seasons: 1,
    episodes: 6,
    status: "Published",
    interactive: false,
    visibility: "Public",
    contentType: "Licensed",
    ageRating: "13+",
    tags: ["anthology", "mumbai", "local-train"],
    views: "1.5M",
    completion: "85%",
    watchTime: "2.4M min",
    engagement: "71%",
    creatorId: "streetlight-stories",
    creatorName: "Streetlight Stories",
    updatedAt: "10 Sep 2026",
    createdAt: "15 Apr 2026",
  },
  {
    id: "ser-006",
    title: "The Ghost in the Metro",
    slug: "the-ghost-in-metro",
    description:
      "At 1:17 AM on the final train car, passengers receive a text asking them to vote on who gets off at the phantom platform.",
    language: "Tamil",
    genre: "Supernatural · Suspense",
    seasons: 1,
    episodes: 8,
    status: "In Review",
    interactive: true,
    visibility: "Unlisted",
    contentType: "Pilot",
    ageRating: "16+",
    tags: ["supernatural", "metro", "voting", "interactive"],
    views: "0",
    completion: "0%",
    watchTime: "0 min",
    engagement: "0%",
    creatorId: "kavitha-r",
    creatorName: "Kavitha R",
    updatedAt: "23 Sep 2026",
    createdAt: "01 Sep 2026",
  },
  {
    id: "ser-007",
    title: "Messages From Tomorrow",
    slug: "messages-from-tomorrow",
    description:
      "A young woman begins receiving voice notes from her future self warning her about decisions she hasn't yet made.",
    language: "Hindi",
    genre: "Mystery · Romance",
    seasons: 1,
    episodes: 0,
    status: "Draft",
    interactive: true,
    visibility: "Private",
    contentType: "Creator Original",
    ageRating: "13+",
    tags: ["time", "mystery", "romance"],
    views: "0",
    completion: "0%",
    watchTime: "0 min",
    engagement: "0%",
    creatorId: "ananya-studios",
    creatorName: "Ananya Studios",
    updatedAt: "24 Sep 2026",
    createdAt: "22 Sep 2026",
  },
  {
    id: "ser-008",
    title: "Broken Signal",
    slug: "broken-signal",
    description:
      "A radio jockey in a small town starts receiving emergency signals from a frequency that shouldn't exist.",
    language: "Hindi",
    genre: "Horror · Mystery",
    seasons: 1,
    episodes: 6,
    status: "Processing",
    interactive: false,
    visibility: "Private",
    contentType: "Original",
    ageRating: "18+",
    tags: ["horror", "radio", "small-town"],
    views: "0",
    completion: "0%",
    watchTime: "0 min",
    engagement: "0%",
    creatorId: "rohan-kapoor",
    creatorName: "Rohan Kapoor",
    updatedAt: "21 Sep 2026",
    createdAt: "10 Sep 2026",
  },
];

// ---------- ADMIN SEASONS ----------
export interface AdminSeason {
  id: string;
  seriesId: string;
  seriesTitle: string;
  name: string;
  number: number;
  description: string;
  episodes: number;
  status: ContentStatus;
  createdAt: string;
}

export const adminSeasons: AdminSeason[] = [
  { id: "sea-001", seriesId: "ser-001", seriesTitle: "The Missing Phone", name: "Season 1: The Discovery", number: 1, description: "Riya discovers her lost phone has been found — by someone who won't stop texting.", episodes: 10, status: "Published", createdAt: "01 Jun 2026" },
  { id: "sea-002", seriesId: "ser-001", seriesTitle: "The Missing Phone", name: "Season 2: The Network", number: 2, description: "The phone's secrets lead to a web of blackmail across three cities.", episodes: 8, status: "Published", createdAt: "01 Aug 2026" },
  { id: "sea-003", seriesId: "ser-002", seriesTitle: "Shadow Campus", name: "Season 1: The Inner Circle", number: 1, description: "First-year student Aditya discovers the Obsidian Society.", episodes: 12, status: "Published", createdAt: "15 May 2026" },
  { id: "sea-004", seriesId: "ser-003", seriesTitle: "Monsoon Room 302", name: "Season 1: One Night", number: 1, description: "A single night in a coastal guesthouse during the worst storm in decades.", episodes: 8, status: "Published", createdAt: "01 Jul 2026" },
  { id: "sea-005", seriesId: "ser-004", seriesTitle: "Neon Karma 2099", name: "Season 1: Memory Theft", number: 1, description: "Zara takes a job that could erase her own past.", episodes: 10, status: "Published", createdAt: "20 Jul 2026" },
  { id: "sea-006", seriesId: "ser-005", seriesTitle: "Last Night Train", name: "Season 1: Six Strangers", number: 1, description: "Six strangers, six stories, one last train.", episodes: 6, status: "Published", createdAt: "15 Apr 2026" },
  { id: "sea-007", seriesId: "ser-006", seriesTitle: "The Ghost in the Metro", name: "Season 1: Platform Zero", number: 1, description: "The phantom platform reveals itself only to those who vote.", episodes: 8, status: "In Review", createdAt: "01 Sep 2026" },
  { id: "sea-008", seriesId: "ser-008", seriesTitle: "Broken Signal", name: "Season 1: Frequency 108.7", number: 1, description: "The signal arrives at midnight.", episodes: 6, status: "Processing", createdAt: "10 Sep 2026" },
];

// ---------- ADMIN EPISODES ----------
export interface AdminEpisode {
  id: string;
  seriesId: string;
  seriesTitle: string;
  seasonId: string;
  seasonNumber: number;
  number: number;
  title: string;
  description: string;
  duration: string;
  views: string;
  completion: string;
  interactive: boolean;
  choicePoint: boolean;
  status: ContentStatus;
  publishedDate: string;
  free: boolean;
}

export const adminEpisodes: AdminEpisode[] = [
  { id: "ep-001", seriesId: "ser-001", seriesTitle: "The Missing Phone", seasonId: "sea-001", seasonNumber: 1, number: 1, title: "The Notification", description: "Riya's phone buzzes with a message from her own lost number.", duration: "1:42", views: "2.4M", completion: "92%", interactive: true, choicePoint: true, status: "Published", publishedDate: "15 Aug 2026", free: true },
  { id: "ep-002", seriesId: "ser-001", seriesTitle: "The Missing Phone", seasonId: "sea-001", seasonNumber: 1, number: 2, title: "Stranger's Gallery", description: "The photos on her phone aren't hers anymore.", duration: "1:55", views: "2.1M", completion: "88%", interactive: true, choicePoint: false, status: "Published", publishedDate: "16 Aug 2026", free: true },
  { id: "ep-003", seriesId: "ser-001", seriesTitle: "The Missing Phone", seasonId: "sea-001", seasonNumber: 1, number: 3, title: "The Voice Note", description: "A voice note from someone who knows where she lives.", duration: "2:01", views: "1.9M", completion: "85%", interactive: true, choicePoint: true, status: "Published", publishedDate: "17 Aug 2026", free: false },
  { id: "ep-004", seriesId: "ser-001", seriesTitle: "The Missing Phone", seasonId: "sea-001", seasonNumber: 1, number: 4, title: "Screenshot Evidence", description: "Evidence she didn't know existed surfaces.", duration: "1:48", views: "1.7M", completion: "82%", interactive: false, choicePoint: false, status: "Published", publishedDate: "18 Aug 2026", free: false },
  { id: "ep-005", seriesId: "ser-001", seriesTitle: "The Missing Phone", seasonId: "sea-001", seasonNumber: 1, number: 5, title: "The Meet", description: "Riya decides to meet the stranger — or does she?", duration: "2:12", views: "1.6M", completion: "79%", interactive: true, choicePoint: true, status: "Published", publishedDate: "19 Aug 2026", free: false },
  { id: "ep-006", seriesId: "ser-002", seriesTitle: "Shadow Campus", seasonId: "sea-003", seasonNumber: 1, number: 1, title: "Orientation Night", description: "Aditya receives an invitation that wasn't on the schedule.", duration: "1:38", views: "1.8M", completion: "90%", interactive: true, choicePoint: true, status: "Published", publishedDate: "01 Jul 2026", free: true },
  { id: "ep-007", seriesId: "ser-002", seriesTitle: "Shadow Campus", seasonId: "sea-003", seasonNumber: 1, number: 2, title: "The Oath", description: "To enter the Inner Circle, Aditya must betray a friend.", duration: "1:52", views: "1.6M", completion: "86%", interactive: true, choicePoint: true, status: "Published", publishedDate: "02 Jul 2026", free: false },
  { id: "ep-008", seriesId: "ser-003", seriesTitle: "Monsoon Room 302", seasonId: "sea-004", seasonNumber: 1, number: 1, title: "Check-In", description: "Two familiar faces at the last available room.", duration: "1:45", views: "1.2M", completion: "94%", interactive: false, choicePoint: false, status: "Published", publishedDate: "15 Jul 2026", free: true },
  { id: "ep-009", seriesId: "ser-004", seriesTitle: "Neon Karma 2099", seasonId: "sea-005", seasonNumber: 1, number: 1, title: "Client Zero", description: "Zara's first memory deletion goes wrong in spectacular fashion.", duration: "2:05", views: "980K", completion: "76%", interactive: true, choicePoint: true, status: "Published", publishedDate: "01 Aug 2026", free: true },
  { id: "ep-010", seriesId: "ser-005", seriesTitle: "Last Night Train", seasonId: "sea-006", seasonNumber: 1, number: 1, title: "Compartment A", description: "A woman carrying two suitcases and one impossible secret.", duration: "1:50", views: "1.5M", completion: "91%", interactive: false, choicePoint: false, status: "Published", publishedDate: "01 May 2026", free: true },
  { id: "ep-011", seriesId: "ser-006", seriesTitle: "The Ghost in the Metro", seasonId: "sea-007", seasonNumber: 1, number: 1, title: "Last Car", description: "Five passengers. One text. The voting begins.", duration: "1:55", views: "0", completion: "0%", interactive: true, choicePoint: true, status: "In Review", publishedDate: "", free: true },
  { id: "ep-012", seriesId: "ser-008", seriesTitle: "Broken Signal", seasonId: "sea-008", seasonNumber: 1, number: 1, title: "Dead Air", description: "RJ Vikram's midnight shift takes a turn when frequency 108.7 activates.", duration: "2:08", views: "0", completion: "0%", interactive: false, choicePoint: false, status: "Processing", publishedDate: "", free: true },
];

// ---------- ADMIN VIDEOS ----------
export interface AdminVideo {
  id: string;
  episodeId: string;
  episodeTitle: string;
  seriesTitle: string;
  duration: string;
  resolution: string;
  processingStatus: VideoProcessingStatus;
  streamingStatus: "Active" | "Inactive" | "Processing";
  uploadDate: string;
  fileSize: string;
  format: string;
}

export const adminVideos: AdminVideo[] = [
  { id: "vid-001", episodeId: "ep-001", episodeTitle: "The Notification", seriesTitle: "The Missing Phone", duration: "1:42", resolution: "1080p 9:16", processingStatus: "Ready", streamingStatus: "Active", uploadDate: "10 Aug 2026", fileSize: "48.2 MB", format: "MP4/H.265" },
  { id: "vid-002", episodeId: "ep-002", episodeTitle: "Stranger's Gallery", seriesTitle: "The Missing Phone", duration: "1:55", resolution: "1080p 9:16", processingStatus: "Ready", streamingStatus: "Active", uploadDate: "11 Aug 2026", fileSize: "52.1 MB", format: "MP4/H.265" },
  { id: "vid-003", episodeId: "ep-003", episodeTitle: "The Voice Note", seriesTitle: "The Missing Phone", duration: "2:01", resolution: "1080p 9:16", processingStatus: "Ready", streamingStatus: "Active", uploadDate: "12 Aug 2026", fileSize: "54.8 MB", format: "MP4/H.265" },
  { id: "vid-004", episodeId: "ep-006", episodeTitle: "Orientation Night", seriesTitle: "Shadow Campus", duration: "1:38", resolution: "1080p 9:16", processingStatus: "Ready", streamingStatus: "Active", uploadDate: "25 Jun 2026", fileSize: "44.6 MB", format: "MP4/H.265" },
  { id: "vid-005", episodeId: "ep-008", episodeTitle: "Check-In", seriesTitle: "Monsoon Room 302", duration: "1:45", resolution: "1080p 9:16", processingStatus: "Ready", streamingStatus: "Active", uploadDate: "10 Jul 2026", fileSize: "46.3 MB", format: "MP4/H.265" },
  { id: "vid-006", episodeId: "ep-009", episodeTitle: "Client Zero", seriesTitle: "Neon Karma 2099", duration: "2:05", resolution: "4K 9:16", processingStatus: "Ready", streamingStatus: "Active", uploadDate: "25 Jul 2026", fileSize: "128.4 MB", format: "MP4/H.265" },
  { id: "vid-007", episodeId: "ep-011", episodeTitle: "Last Car", seriesTitle: "The Ghost in the Metro", duration: "1:55", resolution: "1080p 9:16", processingStatus: "Processing", streamingStatus: "Processing", uploadDate: "22 Sep 2026", fileSize: "51.2 MB", format: "MP4/H.265" },
  { id: "vid-008", episodeId: "ep-012", episodeTitle: "Dead Air", seriesTitle: "Broken Signal", duration: "2:08", resolution: "1080p 9:16", processingStatus: "Uploaded", streamingStatus: "Inactive", uploadDate: "23 Sep 2026", fileSize: "58.7 MB", format: "MP4/H.264" },
  { id: "vid-009", episodeId: "ep-004", episodeTitle: "Screenshot Evidence", seriesTitle: "The Missing Phone", duration: "1:48", resolution: "1080p 9:16", processingStatus: "Failed", streamingStatus: "Inactive", uploadDate: "13 Aug 2026", fileSize: "49.1 MB", format: "MP4/H.265" },
];

// ---------- ADMIN CREATORS ----------
export interface AdminCreator {
  id: string;
  name: string;
  email: string;
  followers: string;
  stories: number;
  views: string;
  completion: string;
  revenue: string;
  status: CreatorStatus;
  joinedAt: string;
  bio: string;
}

export const adminCreators: AdminCreator[] = [
  { id: "ananya-studios", name: "Ananya Studios", email: "team@ananyastudios.in", followers: "24.8K", stories: 4, views: "6.2M", completion: "78%", revenue: "₹4,82,000", status: "Active", joinedAt: "15 Mar 2026", bio: "Mumbai-based vertical storytelling studio." },
  { id: "rohan-kapoor", name: "Rohan Kapoor", email: "rohan@neonframe.co", followers: "18.2K", stories: 3, views: "3.8M", completion: "68%", revenue: "₹2,94,000", status: "Active", joinedAt: "01 Apr 2026", bio: "Cyberpunk and noir filmmaker. Ex-YRF assistant director." },
  { id: "priya-deepak", name: "Priya Deepak Films", email: "priya@deepakfilms.com", followers: "12.4K", stories: 2, views: "2.1M", completion: "82%", revenue: "₹1,68,000", status: "Active", joinedAt: "10 May 2026", bio: "Telugu romance and drama specialist." },
  { id: "streetlight-stories", name: "Streetlight Stories", email: "hello@streetlightstories.in", followers: "9.6K", stories: 1, views: "1.5M", completion: "85%", revenue: "₹1,12,000", status: "Active", joinedAt: "01 Mar 2026", bio: "Anthology format pioneer from Pune." },
  { id: "kavitha-r", name: "Kavitha R", email: "kavitha.r@gmail.com", followers: "3.2K", stories: 1, views: "0", completion: "0%", revenue: "₹0", status: "Pending", joinedAt: "28 Aug 2026", bio: "Tamil supernatural genre creator from Chennai." },
  { id: "arjun-mehta", name: "Arjun Mehta", email: "arjun.mehta@outlook.com", followers: "1.8K", stories: 0, views: "0", completion: "0%", revenue: "₹0", status: "Pending", joinedAt: "15 Sep 2026", bio: "Aspiring creator from Jaipur. Short film background." },
  { id: "suspended-creator", name: "Vikram Banned Studios", email: "vikram@banned.co", followers: "5.1K", stories: 1, views: "420K", completion: "45%", revenue: "₹0", status: "Suspended", joinedAt: "01 Feb 2026", bio: "Account suspended for policy violation." },
  { id: "rejected-creator", name: "TestSubmission Co", email: "test@submit.co", followers: "0", stories: 0, views: "0", completion: "0%", revenue: "₹0", status: "Rejected", joinedAt: "20 Sep 2026", bio: "Application rejected — insufficient portfolio." },
];

// ---------- ADMIN CHARACTERS ----------
export interface AdminCharacter {
  id: string;
  name: string;
  seriesId: string;
  seriesTitle: string;
  role: "Protagonist" | "Antagonist" | "Supporting" | "Recurring" | "Cameo";
  followers: string;
  popularity: string;
  status: "Active" | "Archived";
  description: string;
}

export const adminCharacters: AdminCharacter[] = [
  { id: "ch-001", name: "Riya Sharma", seriesId: "ser-001", seriesTitle: "The Missing Phone", role: "Protagonist", followers: "128K", popularity: "92%", status: "Active", description: "College student whose lost phone becomes a portal to danger." },
  { id: "ch-002", name: "Unknown Caller", seriesId: "ser-001", seriesTitle: "The Missing Phone", role: "Antagonist", followers: "84K", popularity: "88%", status: "Active", description: "The mysterious figure who found Riya's phone." },
  { id: "ch-003", name: "Aditya Verma", seriesId: "ser-002", seriesTitle: "Shadow Campus", role: "Protagonist", followers: "96K", popularity: "85%", status: "Active", description: "First-year student drawn into campus politics." },
  { id: "ch-004", name: "The Dean", seriesId: "ser-002", seriesTitle: "Shadow Campus", role: "Antagonist", followers: "62K", popularity: "78%", status: "Active", description: "The enigmatic dean with ties to the Obsidian Society." },
  { id: "ch-005", name: "Meera & Karthik", seriesId: "ser-003", seriesTitle: "Monsoon Room 302", role: "Protagonist", followers: "74K", popularity: "90%", status: "Active", description: "Ex-fiancés trapped together by the storm and their past." },
  { id: "ch-006", name: "Zara-7", seriesId: "ser-004", seriesTitle: "Neon Karma 2099", role: "Protagonist", followers: "108K", popularity: "94%", status: "Active", description: "Ethical memory hacker navigating a neon-lit future Mumbai." },
  { id: "ch-007", name: "Vikram (RJ)", seriesId: "ser-008", seriesTitle: "Broken Signal", role: "Protagonist", followers: "0", popularity: "0%", status: "Active", description: "Small-town radio jockey receiving impossible signals." },
  { id: "ch-008", name: "Inspector Mehra", seriesId: "ser-001", seriesTitle: "The Missing Phone", role: "Supporting", followers: "42K", popularity: "65%", status: "Active", description: "The investigator who doesn't believe Riya's story." },
  { id: "ch-009", name: "Priya (S1 Guest)", seriesId: "ser-005", seriesTitle: "Last Night Train", role: "Recurring", followers: "28K", popularity: "72%", status: "Archived", description: "The woman with two suitcases from Compartment A." },
];

// ---------- ADMIN USERS ----------
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  plan: "Free" | "VIP Monthly" | "VIP Annual";
  joinedAt: string;
  lastActive: string;
  watchTime: string;
  status: UserStatus;
  strikes?: number;
  roles?: string[];
}

export const adminUsers: AdminUser[] = [
  { id: "usr-001", name: "Aarav Patel", email: "aarav.p@gmail.com", plan: "VIP Annual", joinedAt: "12 Jan 2026", lastActive: "24 Sep 2026", watchTime: "142h", status: "Active" },
  { id: "usr-002", name: "Sneha Kumar", email: "sneha.k@outlook.com", plan: "VIP Monthly", joinedAt: "05 Mar 2026", lastActive: "24 Sep 2026", watchTime: "98h", status: "Active" },
  { id: "usr-003", name: "Rahul Deshpande", email: "rahul.d@yahoo.com", plan: "Free", joinedAt: "20 Apr 2026", lastActive: "23 Sep 2026", watchTime: "34h", status: "Active" },
  { id: "usr-004", name: "Divya Nair", email: "divya.n@proton.me", plan: "VIP Monthly", joinedAt: "01 Feb 2026", lastActive: "22 Sep 2026", watchTime: "86h", status: "Active" },
  { id: "usr-005", name: "Karan Singh", email: "k.singh@live.com", plan: "Free", joinedAt: "15 Jun 2026", lastActive: "20 Sep 2026", watchTime: "12h", status: "Active" },
  { id: "usr-006", name: "Meera Joshi", email: "meera.j@gmail.com", plan: "VIP Annual", joinedAt: "28 Dec 2025", lastActive: "24 Sep 2026", watchTime: "210h", status: "Active" },
  { id: "usr-007", name: "SpamBot_42", email: "xbot42@tempmail.co", plan: "Free", joinedAt: "10 Sep 2026", lastActive: "10 Sep 2026", watchTime: "0h", status: "Blocked" },
  { id: "usr-008", name: "Ankit Sharma", email: "ankit.s@gmail.com", plan: "VIP Monthly", joinedAt: "01 Jul 2026", lastActive: "15 Sep 2026", watchTime: "28h", status: "Suspended" },
];

// ---------- ADMIN SUBSCRIPTIONS / PLANS ----------
export interface AdminPlan {
  id: string;
  name: string;
  price: string;
  duration: string;
  subscribers: string;
  revenue: string;
  status: PlanStatus;
  features: string[];
}

export const adminPlans: AdminPlan[] = [
  {
    id: "plan-free",
    name: "Free",
    price: "₹0",
    duration: "—",
    subscribers: "1.19M",
    revenue: "₹0 (Ad-supported)",
    status: "Active",
    features: ["First 2 episodes free", "Ads between episodes", "SD quality"],
  },
  {
    id: "plan-vip-monthly",
    name: "VIP Monthly",
    price: "₹99/mo",
    duration: "Monthly",
    subscribers: "54K",
    revenue: "₹53,46,000/mo",
    status: "Active",
    features: ["All episodes", "Ad-free", "1080p portrait", "Early access", "Exclusive interactive"],
  },
  {
    id: "plan-vip-annual",
    name: "VIP Annual",
    price: "₹799/yr",
    duration: "Annual",
    subscribers: "28K",
    revenue: "₹2,23,72,000/yr",
    status: "Active",
    features: ["All VIP Monthly features", "2 months free", "Creator meet access", "Beta features"],
  },
  {
    id: "plan-student",
    name: "Student VIP",
    price: "₹49/mo",
    duration: "Monthly",
    subscribers: "0",
    revenue: "₹0",
    status: "Inactive",
    features: ["All VIP features", "50% discount", "Valid student ID required"],
  },
];

// ---------- ADMIN NOTIFICATIONS ----------
export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: "Push" | "Story Vote" | "New Episode" | "Creator Release" | "Subscription";
  targetAudience: "All Users" | "VIP Only" | "Free Only" | "Segment";
  schedule: string;
  status: NotificationStatus;
  sentTo: string;
  createdAt: string;
}

export const adminNotifications: AdminNotification[] = [
  { id: "notif-001", title: "New Episode: The Missing Phone S2E8", message: "Season 2 finale drops now! Your choices decide the ending.", type: "New Episode", targetAudience: "All Users", schedule: "Immediate", status: "Sent", sentTo: "1.28M", createdAt: "20 Sep 2026" },
  { id: "notif-002", title: "Story Battle: Shadow Campus vs Neon Karma", message: "Vote for your favourite series! Interactive battle ends at midnight.", type: "Story Vote", targetAudience: "All Users", schedule: "Immediate", status: "Sent", sentTo: "1.28M", createdAt: "18 Sep 2026" },
  { id: "notif-003", title: "Creator Kavitha R debuts!", message: "Tamil supernatural thriller 'The Ghost in the Metro' launches this week.", type: "Creator Release", targetAudience: "All Users", schedule: "25 Sep 2026, 10:00 AM", status: "Scheduled", sentTo: "—", createdAt: "23 Sep 2026" },
  { id: "notif-004", title: "VIP: Early Access to Broken Signal", message: "Get exclusive first-look at the horror series before anyone else.", type: "Subscription", targetAudience: "VIP Only", schedule: "28 Sep 2026, 8:00 PM", status: "Scheduled", sentTo: "—", createdAt: "22 Sep 2026" },
  { id: "notif-005", title: "Weekend Binge: Free episodes unlocked", message: "Watch 3 premium episodes for free this weekend only!", type: "Push", targetAudience: "Free Only", schedule: "27 Sep 2026, 6:00 PM", status: "Draft", sentTo: "—", createdAt: "24 Sep 2026" },
  { id: "notif-006", title: "Test Notification", message: "This is a test notification that failed to send.", type: "Push", targetAudience: "Segment", schedule: "Immediate", status: "Failed", sentTo: "0", createdAt: "15 Sep 2026" },
];

// ---------- ADMIN ANALYTICS (SUMMARY) ----------
export const platformKPIs = {
  totalUsers: "1.28M",
  dau: "248K",
  watchTime: "4.8M hours",
  subscribers: "82K",
  revenue: "₹1.24Cr",
  retention: "34%",
};

export const contentSummary = {
  publishedSeries: 156,
  episodes: 1842,
  interactiveSeries: 34,
  creators: 428,
  pendingSubmissions: 27,
};

export const engagementSummary = {
  votesToday: "124K",
  predictions: "48K",
  shares: "82K",
  charactersFollowed: "312K",
  avgCompletion: "74%",
};

export const topPerformingSeries = [
  { title: "The Missing Phone", views: "2.4M", completion: "78%", watchTime: "8.4M min", engagement: "91%", status: "Published" as ContentStatus },
  { title: "Shadow Campus", views: "1.8M", completion: "72%", watchTime: "5.2M min", engagement: "84%", status: "Published" as ContentStatus },
  { title: "Last Night Train", views: "1.5M", completion: "85%", watchTime: "2.4M min", engagement: "71%", status: "Published" as ContentStatus },
  { title: "Monsoon Room 302", views: "1.2M", completion: "82%", watchTime: "3.1M min", engagement: "76%", status: "Published" as ContentStatus },
  { title: "Neon Karma 2099", views: "980K", completion: "68%", watchTime: "2.8M min", engagement: "88%", status: "Published" as ContentStatus },
];

export const analyticsCharts = {
  dailyActiveUsers: [
    { label: "Mon", value: 224000 },
    { label: "Tue", value: 231000 },
    { label: "Wed", value: 248000 },
    { label: "Thu", value: 242000 },
    { label: "Fri", value: 268000 },
    { label: "Sat", value: 312000 },
    { label: "Sun", value: 298000 },
  ],
  revenueByMonth: [
    { label: "Apr", value: 42 },
    { label: "May", value: 58 },
    { label: "Jun", value: 72 },
    { label: "Jul", value: 86 },
    { label: "Aug", value: 98 },
    { label: "Sep", value: 124 },
  ],
  genreDistribution: [
    { label: "Mystery · Thriller", pct: 28 },
    { label: "Romance · Drama", pct: 24 },
    { label: "Sci-Fi · Cyberpunk", pct: 16 },
    { label: "Supernatural", pct: 14 },
    { label: "Anthology", pct: 10 },
    { label: "Other", pct: 8 },
  ],
};

// ---------- AUDIT LOG ----------
export interface AuditEntry {
  id: string;
  user: string;
  role: AdminRole;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
  status: "Success" | "Failed" | "Warning";
  details?: string;
}

export const auditLog: AuditEntry[] = [
  { id: "aud-001", user: "Admin", role: "Super Admin", action: "Published Series", entity: "The Missing Phone S2E8", entityId: "ep-005", timestamp: "20 Sep 2026, 14:32", status: "Success" },
  { id: "aud-002", user: "Admin", role: "Super Admin", action: "Approved Creator", entity: "Streetlight Stories", entityId: "streetlight-stories", timestamp: "19 Sep 2026, 11:15", status: "Success" },
  { id: "aud-003", user: "ContentAdmin", role: "Content Admin", action: "Updated Episode", entity: "Shadow Campus — Orientation Night", entityId: "ep-006", timestamp: "18 Sep 2026, 16:45", status: "Success" },
  { id: "aud-004", user: "Admin", role: "Super Admin", action: "Suspended Creator", entity: "Vikram Banned Studios", entityId: "suspended-creator", timestamp: "17 Sep 2026, 09:20", status: "Warning", details: "Policy violation: copyrighted content upload" },
  { id: "aud-005", user: "Editor", role: "Editor", action: "Created Season", entity: "Neon Karma 2099 — Season 1", entityId: "sea-005", timestamp: "16 Sep 2026, 13:08", status: "Success" },
  { id: "aud-006", user: "Admin", role: "Super Admin", action: "Rejected Creator", entity: "TestSubmission Co", entityId: "rejected-creator", timestamp: "20 Sep 2026, 10:00", status: "Success", details: "Insufficient portfolio for onboarding" },
  { id: "aud-007", user: "Finance", role: "Finance", action: "Deactivated Plan", entity: "Student VIP", entityId: "plan-student", timestamp: "15 Sep 2026, 17:30", status: "Success", details: "Paused pending verification integration" },
  { id: "aud-008", user: "ContentAdmin", role: "Content Admin", action: "Bulk Published", entity: "5 episodes of Last Night Train", entityId: "ser-005", timestamp: "14 Sep 2026, 12:00", status: "Success" },
  { id: "aud-009", user: "System", role: "Super Admin", action: "Video Processing Failed", entity: "Screenshot Evidence", entityId: "vid-009", timestamp: "13 Aug 2026, 22:15", status: "Failed", details: "Encoding error: corrupt source file" },
  { id: "aud-010", user: "Admin", role: "Super Admin", action: "Sent Notification", entity: "Story Battle: Shadow Campus vs Neon Karma", entityId: "notif-002", timestamp: "18 Sep 2026, 18:00", status: "Success" },
];

// ---------- ENTITLEMENTS ----------
export interface Entitlement {
  id: string;
  plan: string;
  feature: string;
  enabled: boolean;
}

export const entitlements: Entitlement[] = [
  { id: "ent-001", plan: "VIP Monthly", feature: "Premium Episodes", enabled: true },
  { id: "ent-002", plan: "VIP Monthly", feature: "Ad-Free Experience", enabled: true },
  { id: "ent-003", plan: "VIP Monthly", feature: "Early Access (24h)", enabled: true },
  { id: "ent-004", plan: "VIP Monthly", feature: "Exclusive Interactive Content", enabled: true },
  { id: "ent-005", plan: "VIP Monthly", feature: "1080p Portrait Streaming", enabled: true },
  { id: "ent-006", plan: "VIP Annual", feature: "Premium Episodes", enabled: true },
  { id: "ent-007", plan: "VIP Annual", feature: "Ad-Free Experience", enabled: true },
  { id: "ent-008", plan: "VIP Annual", feature: "Early Access (48h)", enabled: true },
  { id: "ent-009", plan: "VIP Annual", feature: "Exclusive Interactive Content", enabled: true },
  { id: "ent-010", plan: "VIP Annual", feature: "1080p Portrait Streaming", enabled: true },
  { id: "ent-011", plan: "VIP Annual", feature: "Creator Meet Access", enabled: true },
  { id: "ent-012", plan: "VIP Annual", feature: "Beta Features", enabled: true },
  { id: "ent-013", plan: "Free", feature: "First 2 Episodes Free", enabled: true },
  { id: "ent-014", plan: "Free", feature: "SD Quality", enabled: true },
  { id: "ent-015", plan: "Free", feature: "Ad-supported", enabled: true },
];
