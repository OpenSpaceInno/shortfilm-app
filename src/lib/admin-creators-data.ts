/* ==========================================================================
   SHORTREEL ADMIN — CREATOR OPERATIONS & DATA LAYER (ITERATION 4C)
   Full domain models for Creator Management, Applications, Submissions,
   Analytics, Earnings, Activity, Notes, Verification & Lifecycle States.
   ========================================================================== */

export type CreatorLifecycleStatus =
  | "APPLIED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "VERIFIED"
  | "ACTIVE"
  | "SUSPENDED"
  | "REJECTED"
  | "DEACTIVATED";

export type VerificationStatus =
  | "Not Verified"
  | "Verification Pending"
  | "Verified"
  | "Verification Expired";

export type ApplicationStatus =
  | "Pending"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "Changes Requested";

export type SubmissionStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "Changes Requested"
  | "Approved"
  | "Rejected"
  | "Published";

export interface CreatorSocialLinks {
  twitter?: string;
  instagram?: string;
  youtube?: string;
  linkedin?: string;
}

export interface CreatorInternalNote {
  id: string;
  creatorId: string;
  note: string;
  author: string;
  date: string;
}

export interface CreatorActivityEvent {
  id: string;
  creatorId: string;
  date: string;
  time: string;
  action: string;
  actor: string;
  description: string;
}

export interface CreatorEarningTransaction {
  id: string;
  date: string;
  story: string;
  revenueType: "Subscription Revenue Share" | "Content Revenue" | "Bonus" | "Other";
  grossRevenue: string;
  creatorShare: string;
  status: "Pending" | "Approved" | "Paid" | "On Hold";
}

export interface CreatorStoryItem {
  id: string;
  title: string;
  slug: string;
  genre: string;
  episodes: number;
  views: string;
  completion: string;
  interactive: boolean;
  status: "Draft" | "Submitted" | "Under Review" | "Approved" | "Published" | "Rejected" | "Archived";
  publishedDate: string;
  revenue: string;
  shares: string;
  votes: string;
  choices: number;
  seriesId?: string;
}

export interface CreatorSubmissionChecklist {
  contentComplete: boolean;
  metadataComplete: boolean;
  thumbnailAvailable: boolean;
  videoAvailable: boolean;
  storyStructureValid: boolean;
  interactivePathsValid: boolean;
  ageRatingSet: boolean;
  languageSet: boolean;
  copyrightConfirmed: boolean;
}

export interface CreatorSubmission {
  id: string;
  creatorId: string;
  creatorName: string;
  storyTitle: string;
  seriesId?: string;
  submittedDate: string;
  type: "Full Series" | "Interactive Pilot" | "Season Pitch" | "Special Episode";
  reviewer: string;
  status: SubmissionStatus;
  lastUpdated: string;
  storyInfo: {
    title: string;
    genre: string;
    synopsis: string;
    episodeCount: number;
    interactive: boolean;
    targetAudience: string;
    ageRating: string;
    languages: string[];
  };
  contentPreview: {
    poster: string;
    episodesPreview: { number: number; title: string; duration: string; isChoicePoint: boolean }[];
    characters: { name: string; role: string }[];
    choicePoints: { episode: number; prompt: string; choices: string[] }[];
  };
  checklist: CreatorSubmissionChecklist;
  internalNotes: string;
}

export interface CreatorApplication {
  id: string;
  creatorId: string;
  applicantName: string;
  creatorName: string;
  username: string;
  email: string;
  category: string;
  genres: string[];
  languages: string[];
  submittedDate: string;
  portfolio: string;
  followers: string;
  status: ApplicationStatus;
  reviewer: string;
  lastUpdated: string;
  bio: string;
  location: string;
  experience: string;
  previousWork: string;
  targetAudience: string;
  proposedStory: {
    title: string;
    concept: string;
    genre: string;
    format: string;
    episodes: number;
    interactive: boolean;
    targetAudience: string;
    releaseFrequency: string;
  };
  reviewerNotes: string;
  internalComments: string[];
}

export interface AdminCreatorFull {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  coverImage?: string;
  bio: string;
  location: string;
  category: string;
  genres: string[];
  languages: string[];
  experience: string;
  portfolio: string;
  website: string;
  socialLinks: CreatorSocialLinks;
  status: CreatorLifecycleStatus;
  verificationStatus: VerificationStatus;
  verifiedDate?: string;
  verifiedBy?: string;
  suspensionReason?: string;
  suspensionDate?: string;
  joinedAt: string;
  followers: string;
  followersCount: number;
  stories: number;
  published: number;
  views: string;
  viewsCount: number;
  completion: string;
  engagement: string;
  revenue: string;
  revenueAmount: number;
  internalNotes: CreatorInternalNote[];
}

/* ==========================================================================
   INITIAL MOCK CREATORS DATA (Includes all Section 29 creators)
   ========================================================================== */

export const initialCreators: AdminCreatorFull[] = [
  {
    id: "arjun-mehta",
    name: "Arjun Mehta",
    username: "@arjunstories",
    email: "arjun.mehta@shortreel.creators.in",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    coverImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    bio: "Jaipur-based dramatic storyteller specializing in grounded family dilemmas and high-stakes vertical narratives.",
    location: "Jaipur, Rajasthan",
    category: "Drama",
    genres: ["Drama", "Family", "Suspense"],
    languages: ["Hindi", "Rajasthani"],
    experience: "7+ years indie film direction, 2 national short film awards",
    portfolio: "https://arjunmehtafilms.portfolio.site",
    website: "https://arjunstories.in",
    socialLinks: {
      instagram: "https://instagram.com/arjunstories",
      twitter: "https://twitter.com/arjunstories",
      youtube: "https://youtube.com/@arjunstories",
    },
    status: "VERIFIED",
    verificationStatus: "Verified",
    verifiedDate: "12 Aug 2026",
    verifiedBy: "Super Admin",
    joinedAt: "15 Jan 2026",
    followers: "128K",
    followersCount: 128000,
    stories: 8,
    published: 6,
    views: "8.4M",
    viewsCount: 8400000,
    completion: "81%",
    engagement: "92%",
    revenue: "₹6,40,000",
    revenueAmount: 640000,
    internalNotes: [
      {
        id: "note-1",
        creatorId: "arjun-mehta",
        note: "Strong performance on Hindi drama slate. Pitch for Season 2 of Jaipur Noir looks promising.",
        author: "Super Admin",
        date: "14 Sep 2026",
      },
    ],
  },
  {
    id: "priya-nair",
    name: "Priya Nair",
    username: "@priyawrites",
    email: "priya.nair@writenetwork.org",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80",
    coverImage: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1200&q=80",
    bio: "Romantic fiction writer and director capturing intimate city encounters, monsoon heartbreaks and late-night dialogues.",
    location: "Kochi / Mumbai",
    category: "Romance",
    genres: ["Romance", "Drama", "Slice of Life"],
    languages: ["Hindi", "Malayalam", "English"],
    experience: "Published novelist with Penguin India, screenwritten 3 regional streaming features",
    portfolio: "https://priyanair.me/works",
    website: "https://priyawrites.com",
    socialLinks: {
      instagram: "https://instagram.com/priyawrites",
      twitter: "https://twitter.com/priyawrites",
    },
    status: "ACTIVE",
    verificationStatus: "Verified",
    verifiedDate: "05 Jul 2026",
    verifiedBy: "Creator Manager",
    joinedAt: "10 Mar 2026",
    followers: "86K",
    followersCount: 86000,
    stories: 5,
    published: 4,
    views: "5.1M",
    viewsCount: 5100000,
    completion: "79%",
    engagement: "87%",
    revenue: "₹4,12,000",
    revenueAmount: 412000,
    internalNotes: [
      {
        id: "note-2",
        creatorId: "priya-nair",
        note: "Monsoon Room 302 performed exceptionally well with female demographic (18-28).",
        author: "Creator Manager",
        date: "18 Sep 2026",
      },
    ],
  },
  {
    id: "kabir-rao",
    name: "Kabir Rao",
    username: "@kabirverse",
    email: "kabir@cybernoir.studio",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    coverImage: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80",
    bio: "Pioneering vertical cyberpunk and psychological thrillers with high-octane branching story choices.",
    location: "Bengaluru, Karnataka",
    category: "Thriller",
    genres: ["Thriller", "Sci-Fi", "Cyberpunk"],
    languages: ["Hindi", "Kannada", "English"],
    experience: "VFX supervisor & game writer, former Ubisoft narrative consultant",
    portfolio: "https://kabirverse.artstation.com",
    website: "https://kabirverse.io",
    socialLinks: {
      twitter: "https://twitter.com/kabirverse",
      youtube: "https://youtube.com/@kabirverse",
      linkedin: "https://linkedin.com/in/kabir-rao",
    },
    status: "VERIFIED",
    verificationStatus: "Verified",
    verifiedDate: "20 May 2026",
    verifiedBy: "Super Admin",
    joinedAt: "01 Feb 2026",
    followers: "214K",
    followersCount: 214000,
    stories: 11,
    published: 8,
    views: "14.2M",
    viewsCount: 14200000,
    completion: "84%",
    engagement: "94%",
    revenue: "₹11,80,000",
    revenueAmount: 1180000,
    internalNotes: [
      {
        id: "note-3",
        creatorId: "kabir-rao",
        note: "Top interactive series contributor. 'Neon Karma 2099' has highest choice completion on platform.",
        author: "Super Admin",
        date: "22 Sep 2026",
      },
    ],
  },
  {
    id: "meera-sharma",
    name: "Meera Sharma",
    username: "@meerastories",
    email: "meera.sharma@narrativehive.in",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80",
    coverImage: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80",
    bio: "Creating socially conscious vertical series exploring modern workplace politics, urban ambitions and relationship dilemmas.",
    location: "New Delhi",
    category: "Drama",
    genres: ["Drama", "Workplace", "Romance"],
    languages: ["Hindi", "English"],
    experience: "Theatre director at NSD alumni ensemble, documentary filmmaker",
    portfolio: "https://meerasharma.com/portfolio",
    website: "https://meerasharma.com",
    socialLinks: {
      instagram: "https://instagram.com/meerastories",
      twitter: "https://twitter.com/meerastories",
    },
    status: "UNDER_REVIEW",
    verificationStatus: "Verification Pending",
    joinedAt: "10 Aug 2026",
    followers: "42K",
    followersCount: 42000,
    stories: 3,
    published: 2,
    views: "1.9M",
    viewsCount: 1900000,
    completion: "73%",
    engagement: "80%",
    revenue: "₹1,45,000",
    revenueAmount: 145000,
    internalNotes: [
      {
        id: "note-4",
        creatorId: "meera-sharma",
        note: "Verification documentation submitted on 15 Sep. ID proof matches registered entity.",
        author: "Creator Manager",
        date: "16 Sep 2026",
      },
    ],
  },
  {
    id: "rohan-kapoor",
    name: "Rohan Kapoor",
    username: "@rohank",
    email: "rohan@neonframe.co",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    coverImage: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
    bio: "Audio-visual horror craftsman. Former YRF assistant director experimenting with binaural soundscapes.",
    location: "Pune, Maharashtra",
    category: "Mystery",
    genres: ["Mystery", "Horror", "Suspense"],
    languages: ["Hindi", "Marathi"],
    experience: "Commercial director, assistant director on 2 Yash Raj Films productions",
    portfolio: "https://neonframe.co/rohan",
    website: "https://neonframe.co",
    socialLinks: {
      instagram: "https://instagram.com/rohankapoor",
      twitter: "https://twitter.com/rohank",
    },
    status: "APPLIED",
    verificationStatus: "Not Verified",
    joinedAt: "01 Sep 2026",
    followers: "19K",
    followersCount: 19000,
    stories: 2,
    published: 1,
    views: "890K",
    viewsCount: 890000,
    completion: "68%",
    engagement: "76%",
    revenue: "₹74,000",
    revenueAmount: 74000,
    internalNotes: [
      {
        id: "note-5",
        creatorId: "rohan-kapoor",
        note: "Submitted new concept 'Frequency 108.7' for review. Technical audio specs check out.",
        author: "Editor",
        date: "21 Sep 2026",
      },
    ],
  },
  {
    id: "ananya-studios",
    name: "Ananya Studios",
    username: "@ananyastudios",
    email: "team@ananyastudios.in",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
    coverImage: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=80",
    bio: "A four-person writers room in Hyderabad creating vertical romance and drama with a strong interactive spine.",
    location: "Hyderabad, Telangana",
    category: "Drama",
    genres: ["Drama", "Romance", "Interactive"],
    languages: ["Hindi", "Telugu"],
    experience: "Over 50 million total views across vertical short series",
    portfolio: "https://ananyastudios.in/portfolio",
    website: "https://ananyastudios.in",
    socialLinks: {
      instagram: "https://instagram.com/ananyastudios",
      youtube: "https://youtube.com/@ananyastudios",
    },
    status: "ACTIVE",
    verificationStatus: "Verified",
    verifiedDate: "15 Apr 2026",
    verifiedBy: "Super Admin",
    joinedAt: "15 Mar 2026",
    followers: "1.2M",
    followersCount: 1200000,
    stories: 6,
    published: 5,
    views: "48.6M",
    viewsCount: 48600000,
    completion: "82%",
    engagement: "95%",
    revenue: "₹34,50,000",
    revenueAmount: 3450000,
    internalNotes: [
      {
        id: "note-6",
        creatorId: "ananya-studios",
        note: "Premier partner studio. Top-performing series 'The Missing Phone' continues strong week-over-week retention.",
        author: "Super Admin",
        date: "20 Sep 2026",
      },
    ],
  },
  {
    id: "suspended-creator",
    name: "Vikram Banned Studios",
    username: "@vikramfilms",
    email: "vikram@banned.co",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80",
    bio: "Account suspended for copyright infringement and repeated policy non-compliance.",
    location: "Mumbai",
    category: "Thriller",
    genres: ["Thriller"],
    languages: ["Hindi"],
    experience: "Indie producer",
    portfolio: "https://banned.co",
    website: "https://banned.co",
    socialLinks: {},
    status: "SUSPENDED",
    verificationStatus: "Not Verified",
    suspensionReason: "Policy violation: Unauthorized upload of copyrighted third-party background soundtrack.",
    suspensionDate: "17 Sep 2026",
    joinedAt: "01 Feb 2026",
    followers: "5.1K",
    followersCount: 5100,
    stories: 1,
    published: 0,
    views: "420K",
    viewsCount: 420000,
    completion: "45%",
    engagement: "42%",
    revenue: "₹0",
    revenueAmount: 0,
    internalNotes: [
      {
        id: "note-7",
        creatorId: "suspended-creator",
        note: "DMCA takedown notice received from T-Series. Account suspended per platform strike policy.",
        author: "Super Admin",
        date: "17 Sep 2026",
      },
    ],
  },
  {
    id: "rejected-creator",
    name: "TestSubmission Co",
    username: "@testsubmit",
    email: "test@submit.co",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80",
    bio: "Application rejected due to incomplete portfolio and low video quality samples.",
    location: "Chandigarh",
    category: "Comedy",
    genres: ["Comedy"],
    languages: ["Punjabi"],
    experience: "Amateur creator",
    portfolio: "https://submit.co/portfolio",
    website: "https://submit.co",
    socialLinks: {},
    status: "REJECTED",
    verificationStatus: "Not Verified",
    joinedAt: "20 Sep 2026",
    followers: "0",
    followersCount: 0,
    stories: 0,
    published: 0,
    views: "0",
    viewsCount: 0,
    completion: "0%",
    engagement: "0%",
    revenue: "₹0",
    revenueAmount: 0,
    internalNotes: [
      {
        id: "note-8",
        creatorId: "rejected-creator",
        note: "Sample videos failed vertical portrait 1080p bitrate requirements. Re-application advised after 60 days.",
        author: "Creator Manager",
        date: "20 Sep 2026",
      },
    ],
  },
];

/* ==========================================================================
   INITIAL MOCK APPLICATIONS
   ========================================================================== */

export const initialApplications: CreatorApplication[] = [
  {
    id: "app-001",
    creatorId: "rohan-kapoor",
    applicantName: "Rohan Kapoor",
    creatorName: "Rohan Kapoor",
    username: "@rohank",
    email: "rohan@neonframe.co",
    category: "Mystery",
    genres: ["Mystery", "Horror", "Psychological"],
    languages: ["Hindi", "Marathi"],
    submittedDate: "21 Sep 2026",
    portfolio: "https://neonframe.co/rohan",
    followers: "19K",
    status: "Pending",
    reviewer: "Unassigned",
    lastUpdated: "21 Sep 2026",
    bio: "Cyberpunk and atmospheric mystery director. 5 years commercial filmmaking.",
    location: "Pune, Maharashtra",
    experience: "YRF Assistant Director (2 films), 10+ branded fashion commercials",
    previousWork: "Short film 'Late Shift' selected at Dharamshala Film Festival 2024",
    targetAudience: "Young adults 18-30 seeking edge-of-seat suspense",
    proposedStory: {
      title: "Frequency 108.7",
      concept: "A small-town radio DJ starts receiving distress signals on a dead frequency during his 2 AM shift. Listeners vote to determine whether he investigates the signal origins or calls the police.",
      genre: "Mystery · Thriller",
      format: "Vertical Episodic 9:16 (1080p portrait)",
      episodes: 8,
      interactive: true,
      targetAudience: "Thriller and true crime enthusiasts",
      releaseFrequency: "Twice weekly (Tue / Fri)",
    },
    reviewerNotes: "Pitch deck submitted with moodboards and sample 60-second pilot sequence.",
    internalComments: [
      "Technical sample looks great. Needs confirmation on audio master rights.",
    ],
  },
  {
    id: "app-002",
    creatorId: "meera-sharma",
    applicantName: "Meera Sharma",
    creatorName: "Meera Sharma",
    username: "@meerastories",
    email: "meera.sharma@narrativehive.in",
    category: "Drama",
    genres: ["Drama", "Workplace"],
    languages: ["Hindi", "English"],
    submittedDate: "18 Sep 2026",
    portfolio: "https://meerasharma.com/portfolio",
    followers: "42K",
    status: "Under Review",
    reviewer: "Super Admin",
    lastUpdated: "19 Sep 2026",
    bio: "NSD alumnus exploring modern corporate tension and personal loyalties.",
    location: "New Delhi",
    experience: "10+ stage productions, 3 docu-series",
    previousWork: "Web pilot 'Cubicle Warfare' with 400K YouTube views",
    targetAudience: "Urban professionals 22-38",
    proposedStory: {
      title: "The Boardroom Whistleblower",
      concept: "A junior compliance officer finds a multi-crore embezzlement audit file. Each episode presents a high-pressure ethical fork where viewers choose whom she trusts.",
      genre: "Drama · Suspense",
      format: "Vertical Portrait Episodic (9:16)",
      episodes: 10,
      interactive: true,
      targetAudience: "Drama & mystery fans",
      releaseFrequency: "Weekly on Mondays",
    },
    reviewerNotes: "Strong narrative arc, character profiles are detailed.",
    internalComments: [
      "Review episode 4 branching logic before greenlighting.",
    ],
  },
  {
    id: "app-003",
    creatorId: "arjun-mehta",
    applicantName: "Arjun Mehta",
    creatorName: "Arjun Mehta",
    username: "@arjunstories",
    email: "arjun.mehta@shortreel.creators.in",
    category: "Drama",
    genres: ["Drama", "Crime"],
    languages: ["Hindi"],
    submittedDate: "10 Jan 2026",
    portfolio: "https://arjunmehtafilms.portfolio.site",
    followers: "128K",
    status: "Approved",
    reviewer: "Super Admin",
    lastUpdated: "15 Jan 2026",
    bio: "Established drama creator from Jaipur.",
    location: "Jaipur, Rajasthan",
    experience: "Extensive short form and vertical video catalog",
    previousWork: "Produced 6 published series on ShortReel",
    targetAudience: "Mass Hindi drama viewership",
    proposedStory: {
      title: "The Missing Phone: Season 2",
      concept: "Following the cliffhanger finale of Season 1, Riya discovers her phone was part of a larger syndicate.",
      genre: "Mystery · Thriller",
      format: "Vertical 9:16",
      episodes: 12,
      interactive: true,
      targetAudience: "Young adult mass audience",
      releaseFrequency: "Daily cliffhanger drop",
    },
    reviewerNotes: "Approved unconditionally based on Season 1 stellar completion rate.",
    internalComments: ["Premier tier creator."],
  },
  {
    id: "app-004",
    creatorId: "rejected-creator",
    applicantName: "TestSubmission Co",
    creatorName: "TestSubmission Co",
    username: "@testsubmit",
    email: "test@submit.co",
    category: "Comedy",
    genres: ["Comedy"],
    languages: ["Punjabi"],
    submittedDate: "15 Sep 2026",
    portfolio: "https://submit.co/portfolio",
    followers: "0",
    status: "Rejected",
    reviewer: "Creator Manager",
    lastUpdated: "20 Sep 2026",
    bio: "Amateur creator group.",
    location: "Chandigarh",
    experience: "None verified",
    previousWork: "None",
    targetAudience: "Unknown",
    proposedStory: {
      title: "Untitled Comedy Sketch Series",
      concept: "Generic college pranks filmed without script or sound mastering.",
      genre: "Comedy",
      format: "16:9 cropped to 9:16",
      episodes: 4,
      interactive: false,
      targetAudience: "General",
      releaseFrequency: "Ad-hoc",
    },
    reviewerNotes: "Rejected. Submissions failed portrait framing and audio quality guidelines.",
    internalComments: [
      "Ineligible at this stage.",
    ],
  },
  {
    id: "app-005",
    creatorId: "priya-nair",
    applicantName: "Priya Nair",
    creatorName: "Priya Nair",
    username: "@priyawrites",
    email: "priya.nair@writenetwork.org",
    category: "Romance",
    genres: ["Romance", "Drama"],
    languages: ["Hindi", "Malayalam"],
    submittedDate: "14 Sep 2026",
    portfolio: "https://priyanair.me/works",
    followers: "86K",
    status: "Changes Requested",
    reviewer: "Content Admin",
    lastUpdated: "17 Sep 2026",
    bio: "Romantic fiction writer.",
    location: "Kochi",
    experience: "Published author",
    previousWork: "Monsoon Room 302",
    targetAudience: "Romance readers and viewers",
    proposedStory: {
      title: "Coffee at 2 AM",
      concept: "Two night-shift hospital doctors keep missing each other's shifts until a sudden cyclone traps them in the cafeteria.",
      genre: "Romance · Drama",
      format: "Vertical 9:16",
      episodes: 8,
      interactive: true,
      targetAudience: "18-35 romance lovers",
      releaseFrequency: "Twice weekly",
    },
    reviewerNotes: "Great pitch. Requested creator to add two audience voting points at episodes 3 and 7.",
    internalComments: [
      "Awaiting revised interactive story map from Priya.",
    ],
  },
];

/* ==========================================================================
   INITIAL MOCK SUBMISSIONS
   ========================================================================== */

export const initialSubmissions: CreatorSubmission[] = [
  {
    id: "sub-101",
    creatorId: "arjun-mehta",
    creatorName: "Arjun Mehta",
    storyTitle: "The Midnight Train",
    seriesId: "ser-005",
    submittedDate: "20 Sep 2026",
    type: "Full Series",
    reviewer: "Content Admin",
    status: "Under Review",
    lastUpdated: "22 Sep 2026",
    storyInfo: {
      title: "The Midnight Train",
      genre: "Mystery · Thriller",
      synopsis: "Six strangers board the final intercity express to Mumbai, only to find the next stop doesn't exist on the railway map.",
      episodeCount: 10,
      interactive: true,
      targetAudience: "Thriller and suspense fans aged 16-35",
      ageRating: "16+",
      languages: ["Hindi", "English subtitles"],
    },
    contentPreview: {
      poster: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=600&q=80",
      episodesPreview: [
        { number: 1, title: "The Boarding Pass", duration: "1:45", isChoicePoint: true },
        { number: 2, title: "Coach B3", duration: "1:58", isChoicePoint: false },
        { number: 3, title: "Emergency Pull", duration: "2:10", isChoicePoint: true },
        { number: 4, title: "Dark Tunnel", duration: "1:52", isChoicePoint: false },
      ],
      characters: [
        { name: "Dev", role: "Protagonist / Off-duty cop" },
        { name: "Ananya", role: "Mysterious Passenger in Berth 4" },
        { name: "TC Sharma", role: "Train Conductor" },
      ],
      choicePoints: [
        {
          episode: 1,
          prompt: "Should Dev inspect the unattended suitcase or ignore it and stay in his compartment?",
          choices: ["Inspect Suitcase", "Remain in Compartment"],
        },
        {
          episode: 3,
          prompt: "The train enters an unmapped tunnel. Does Dev pull the emergency brake or follow the conductor?",
          choices: ["Pull Emergency Brake", "Follow Conductor quietly"],
        },
      ],
    },
    checklist: {
      contentComplete: true,
      metadataComplete: true,
      thumbnailAvailable: true,
      videoAvailable: true,
      storyStructureValid: true,
      interactivePathsValid: true,
      ageRatingSet: true,
      languageSet: true,
      copyrightConfirmed: true,
    },
    internalNotes: "Strong candidate for Season 1 flagship release. Visual grading is clean.",
  },
  {
    id: "sub-102",
    creatorId: "priya-nair",
    creatorName: "Priya Nair",
    storyTitle: "Coffee at 2 AM",
    submittedDate: "16 Sep 2026",
    type: "Season Pitch",
    reviewer: "Creator Manager",
    status: "Changes Requested",
    lastUpdated: "18 Sep 2026",
    storyInfo: {
      title: "Coffee at 2 AM",
      genre: "Romance · Slice of Life",
      synopsis: "Two doctors on graveyard shift keep leaving notes on coffee cups, sparking an unexpected romance.",
      episodeCount: 8,
      interactive: true,
      targetAudience: "Young adults 18-28",
      ageRating: "13+",
      languages: ["Hindi"],
    },
    contentPreview: {
      poster: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80",
      episodesPreview: [
        { number: 1, title: "The Blue Cup", duration: "1:35", isChoicePoint: true },
        { number: 2, title: "Code Yellow", duration: "1:42", isChoicePoint: false },
      ],
      characters: [
        { name: "Dr. Tara", role: "Resident Surgeon" },
        { name: "Dr. Siddharth", role: "Pediatric Registrar" },
      ],
      choicePoints: [
        {
          episode: 1,
          prompt: "Does Tara reply to the note on the coffee cup with her real name or an inside joke?",
          choices: ["Leave Real Name", "Sign with Inside Joke"],
        },
      ],
    },
    checklist: {
      contentComplete: true,
      metadataComplete: true,
      thumbnailAvailable: true,
      videoAvailable: false,
      storyStructureValid: true,
      interactivePathsValid: false,
      ageRatingSet: true,
      languageSet: true,
      copyrightConfirmed: true,
    },
    internalNotes: "Interactive branch structure needs 1 additional choice node before final approval.",
  },
  {
    id: "sub-103",
    creatorId: "kabir-rao",
    creatorName: "Kabir Rao",
    storyTitle: "Neon Karma: Override",
    seriesId: "ser-004",
    submittedDate: "12 Sep 2026",
    type: "Special Episode",
    reviewer: "Super Admin",
    status: "Approved",
    lastUpdated: "14 Sep 2026",
    storyInfo: {
      title: "Neon Karma: Override",
      genre: "Sci-Fi · Cyberpunk",
      synopsis: "An exclusive standalone live-choice event exploring Zara-7's first memory heist.",
      episodeCount: 1,
      interactive: true,
      targetAudience: "Cyberpunk and interactive game fans",
      ageRating: "16+",
      languages: ["Hindi", "English"],
    },
    contentPreview: {
      poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80",
      episodesPreview: [
        { number: 1, title: "Override Protocol", duration: "3:15", isChoicePoint: true },
      ],
      characters: [
        { name: "Zara-7", role: "Memory Hacker" },
        { name: "The Client", role: "Corporate Handler" },
      ],
      choicePoints: [
        {
          episode: 1,
          prompt: "The firewall breaches. Does Zara download the executive memory or destroy the terminal?",
          choices: ["Download Memory", "Trigger Self-Destruct"],
        },
      ],
    },
    checklist: {
      contentComplete: true,
      metadataComplete: true,
      thumbnailAvailable: true,
      videoAvailable: true,
      storyStructureValid: true,
      interactivePathsValid: true,
      ageRatingSet: true,
      languageSet: true,
      copyrightConfirmed: true,
    },
    internalNotes: "Approved for VIP subscriber exclusive drop.",
  },
];

/* ==========================================================================
   INITIAL MOCK EARNINGS
   ========================================================================== */

export const mockEarningsTransactions: Record<string, CreatorEarningTransaction[]> = {
  "arjun-mehta": [
    { id: "tx-001", date: "20 Sep 2026", story: "The Missing Phone", revenueType: "Subscription Revenue Share", grossRevenue: "₹2,40,000", creatorShare: "₹1,32,000", status: "Paid" },
    { id: "tx-002", date: "15 Sep 2026", story: "Shadow Campus", revenueType: "Content Revenue", grossRevenue: "₹1,80,000", creatorShare: "₹99,000", status: "Paid" },
    { id: "tx-003", date: "01 Sep 2026", story: "Echoes of Jaipur", revenueType: "Subscription Revenue Share", grossRevenue: "₹3,10,000", creatorShare: "₹1,70,500", status: "Approved" },
    { id: "tx-004", date: "24 Aug 2026", story: "Top Engagement Bonus", revenueType: "Bonus", grossRevenue: "₹50,000", creatorShare: "₹50,000", status: "Paid" },
    { id: "tx-005", date: "22 Sep 2026", story: "The Midnight Train (Advance)", revenueType: "Other", grossRevenue: "₹1,50,000", creatorShare: "₹1,50,000", status: "Pending" },
  ],
  "kabir-rao": [
    { id: "tx-101", date: "22 Sep 2026", story: "Neon Karma 2099", revenueType: "Subscription Revenue Share", grossRevenue: "₹4,80,000", creatorShare: "₹2,64,000", status: "Approved" },
    { id: "tx-102", date: "18 Sep 2026", story: "Code Red Mumbai", revenueType: "Content Revenue", grossRevenue: "₹3,20,000", creatorShare: "₹1,76,000", status: "Paid" },
    { id: "tx-103", date: "01 Sep 2026", story: "Neon Karma S1 Payout", revenueType: "Subscription Revenue Share", grossRevenue: "₹5,40,000", creatorShare: "₹2,97,000", status: "Paid" },
    { id: "tx-104", date: "15 Aug 2026", story: "Interactive Innovation Grant", revenueType: "Bonus", grossRevenue: "₹1,00,000", creatorShare: "₹1,00,000", status: "Paid" },
  ],
  "priya-nair": [
    { id: "tx-201", date: "20 Sep 2026", story: "Monsoon Room 302", revenueType: "Subscription Revenue Share", grossRevenue: "₹1,90,000", creatorShare: "₹1,04,500", status: "Paid" },
    { id: "tx-202", date: "10 Sep 2026", story: "One Night Rain", revenueType: "Content Revenue", grossRevenue: "₹1,40,000", creatorShare: "₹77,000", status: "Approved" },
    { id: "tx-203", date: "01 Sep 2026", story: "Coffee at 2 AM Pitch Option", revenueType: "Other", grossRevenue: "₹50,000", creatorShare: "₹50,000", status: "Paid" },
  ],
};

/* ==========================================================================
   INITIAL MOCK ACTIVITIES
   ========================================================================== */

export const mockActivities: Record<string, CreatorActivityEvent[]> = {
  "arjun-mehta": [
    { id: "act-01", creatorId: "arjun-mehta", date: "22 Sep 2026", time: "16:45", action: "Submission Reviewed", actor: "Content Admin", description: "Submission for 'The Midnight Train' marked as Under Review." },
    { id: "act-02", creatorId: "arjun-mehta", date: "20 Sep 2026", time: "11:20", action: "Story Submitted", actor: "Arjun Mehta", description: "Submitted 10-episode interactive thriller 'The Midnight Train'." },
    { id: "act-03", creatorId: "arjun-mehta", date: "15 Sep 2026", time: "14:10", action: "Internal Note Added", actor: "Super Admin", description: "Added note regarding Hindi drama slate performance." },
    { id: "act-04", creatorId: "arjun-mehta", date: "12 Aug 2026", time: "10:00", action: "Creator Verified", actor: "Super Admin", description: "Creator identity verified and verified badge awarded." },
    { id: "act-05", creatorId: "arjun-mehta", date: "01 Jun 2026", time: "09:30", action: "Episode Published", actor: "System", description: "Episode 18 of 'The Missing Phone' released to public." },
    { id: "act-06", creatorId: "arjun-mehta", date: "15 Jan 2026", time: "15:00", action: "Creator Approved", actor: "Super Admin", description: "Application approved and creator onboarded." },
    { id: "act-07", creatorId: "arjun-mehta", date: "10 Jan 2026", time: "12:15", action: "Application Submitted", actor: "Arjun Mehta", description: "Creator submitted initial platform partnership application." },
  ],
  "kabir-rao": [
    { id: "act-11", creatorId: "kabir-rao", date: "22 Sep 2026", time: "18:00", action: "Revenue Event", actor: "System", description: "Monthly revenue share of ₹2,64,000 processed." },
    { id: "act-12", creatorId: "kabir-rao", date: "14 Sep 2026", time: "15:30", action: "Story Approved", actor: "Super Admin", description: "'Neon Karma: Override' approved for VIP premiere." },
    { id: "act-13", creatorId: "kabir-rao", date: "12 Sep 2026", time: "10:15", action: "Story Submitted", actor: "Kabir Rao", description: "Submitted interactive special episode." },
    { id: "act-14", creatorId: "kabir-rao", date: "20 May 2026", time: "11:00", action: "Creator Verified", actor: "Super Admin", description: "Granted official verified badge." },
  ],
  "priya-nair": [
    { id: "act-21", creatorId: "priya-nair", date: "18 Sep 2026", time: "16:20", action: "Submission Reviewed", actor: "Creator Manager", description: "Requested 1 additional interactive decision point on 'Coffee at 2 AM'." },
    { id: "act-22", creatorId: "priya-nair", date: "14 Sep 2026", time: "09:00", action: "Story Submitted", actor: "Priya Nair", description: "Pitch submitted for 8-episode hospital romance." },
    { id: "act-23", creatorId: "priya-nair", date: "05 Jul 2026", time: "13:45", action: "Creator Verified", actor: "Creator Manager", description: "Profile verification confirmed." },
  ],
};

/* ==========================================================================
   INITIAL MOCK CREATOR STORIES
   ========================================================================== */

export const mockCreatorStories: Record<string, CreatorStoryItem[]> = {
  "arjun-mehta": [
    { id: "st-001", title: "The Missing Phone", slug: "the-missing-phone", genre: "Mystery · Thriller", episodes: 18, views: "2.4M", completion: "78%", interactive: true, status: "Published", publishedDate: "01 Jun 2026", revenue: "₹2,84,000", shares: "42K", votes: "128K", choices: 12, seriesId: "ser-001" },
    { id: "st-002", title: "Shadow Campus", slug: "shadow-campus", genre: "Drama · Suspense", episodes: 12, views: "1.8M", completion: "72%", interactive: true, status: "Published", publishedDate: "15 May 2026", revenue: "₹1,95,000", shares: "28K", votes: "94K", choices: 8, seriesId: "ser-002" },
    { id: "st-003", title: "The Midnight Train", slug: "the-midnight-train", genre: "Mystery · Thriller", episodes: 10, views: "0", completion: "0%", interactive: true, status: "Under Review", publishedDate: "—", revenue: "₹0", shares: "0", votes: "0", choices: 14, seriesId: "ser-005" },
    { id: "st-004", title: "Jaipur Noir: Season 1", slug: "jaipur-noir", genre: "Crime · Drama", episodes: 8, views: "1.2M", completion: "84%", interactive: false, status: "Published", publishedDate: "20 Apr 2026", revenue: "₹98,000", shares: "19K", votes: "0", choices: 0 },
    { id: "st-005", title: "Hawa Mahal Secrets", slug: "hawa-mahal-secrets", genre: "Mystery", episodes: 6, views: "920K", completion: "81%", interactive: true, status: "Published", publishedDate: "10 Mar 2026", revenue: "₹63,000", shares: "14K", votes: "48K", choices: 6 },
    { id: "st-006", title: "Echoes of Jaipur", slug: "echoes-of-jaipur", genre: "Drama", episodes: 8, views: "2.0M", completion: "85%", interactive: false, status: "Published", publishedDate: "01 Feb 2026", revenue: "₹1,45,000", shares: "35K", votes: "0", choices: 0 },
  ],
  "kabir-rao": [
    { id: "st-101", title: "Neon Karma 2099", slug: "neon-karma-2099", genre: "Sci-Fi · Cyberpunk", episodes: 10, views: "980K", completion: "76%", interactive: true, status: "Published", publishedDate: "20 Jul 2026", revenue: "₹3,90,000", shares: "64K", votes: "210K", choices: 22, seriesId: "ser-004" },
    { id: "st-102", title: "Code Red Mumbai", slug: "code-red-mumbai", genre: "Thriller · Action", episodes: 12, views: "4.8M", completion: "86%", interactive: true, status: "Published", publishedDate: "15 Apr 2026", revenue: "₹4,20,000", shares: "88K", votes: "340K", choices: 18 },
    { id: "st-103", title: "The Cyber Syndicate", slug: "cyber-syndicate", genre: "Sci-Fi", episodes: 8, views: "3.2M", completion: "82%", interactive: true, status: "Published", publishedDate: "01 Mar 2026", revenue: "₹2,60,000", shares: "51K", votes: "180K", choices: 14 },
    { id: "st-104", title: "Neon Karma: Override", slug: "neon-karma-override", genre: "Sci-Fi", episodes: 1, views: "0", completion: "0%", interactive: true, status: "Approved", publishedDate: "—", revenue: "₹0", shares: "0", votes: "0", choices: 4 },
  ],
  "priya-nair": [
    { id: "st-201", title: "Monsoon Room 302", slug: "monsoon-room-302", genre: "Romance · Drama", episodes: 8, views: "1.2M", completion: "94%", interactive: false, status: "Published", publishedDate: "01 Jul 2026", revenue: "₹2,10,000", shares: "48K", votes: "0", choices: 0, seriesId: "ser-003" },
    { id: "st-202", title: "Rain Across Marine Drive", slug: "marine-drive-rain", genre: "Romance", episodes: 6, views: "1.8M", completion: "79%", interactive: true, status: "Published", publishedDate: "15 May 2026", revenue: "₹1,40,000", shares: "38K", votes: "92K", choices: 8 },
    { id: "st-203", title: "Coffee at 2 AM", slug: "coffee-at-2am", genre: "Romance", episodes: 8, views: "0", completion: "0%", interactive: true, status: "Submitted", publishedDate: "—", revenue: "₹0", shares: "0", votes: "0", choices: 6 },
  ],
  "meera-sharma": [
    { id: "st-301", title: "The Boardroom Whistleblower", slug: "boardroom-whistleblower", genre: "Drama", episodes: 10, views: "0", completion: "0%", interactive: true, status: "Under Review", publishedDate: "—", revenue: "₹0", shares: "0", votes: "0", choices: 10 },
    { id: "st-302", title: "Behind Closed Curtains", slug: "behind-closed-curtains", genre: "Drama", episodes: 6, views: "1.9M", completion: "73%", interactive: false, status: "Published", publishedDate: "01 Jun 2026", revenue: "₹1,45,000", shares: "21K", votes: "0", choices: 0 },
  ],
  "rohan-kapoor": [
    { id: "st-401", title: "Broken Signal", slug: "broken-signal", genre: "Horror · Mystery", episodes: 6, views: "890K", completion: "68%", interactive: false, status: "Published", publishedDate: "10 Sep 2026", revenue: "₹74,000", shares: "12K", votes: "0", choices: 0, seriesId: "ser-008" },
    { id: "st-402", title: "Frequency 108.7", slug: "frequency-108-7", genre: "Mystery", episodes: 8, views: "0", completion: "0%", interactive: true, status: "Draft", publishedDate: "—", revenue: "₹0", shares: "0", votes: "0", choices: 8 },
  ],
  "ananya-studios": [
    { id: "st-501", title: "Messages From Tomorrow", slug: "messages-from-tomorrow", genre: "Romance · Sci-Fi", episodes: 8, views: "7.6M", completion: "84%", interactive: true, status: "Published", publishedDate: "15 Apr 2026", revenue: "₹6,80,000", shares: "140K", votes: "380K", choices: 16 },
    { id: "st-502", title: "Umbrella Hearts", slug: "umbrella-hearts", genre: "Romance", episodes: 6, views: "8.9M", completion: "80%", interactive: true, status: "Published", publishedDate: "10 May 2026", revenue: "₹8,20,000", shares: "190K", votes: "450K", choices: 14 },
    { id: "st-503", title: "Rooftop Monsoon", slug: "rooftop-monsoon", genre: "Drama", episodes: 8, views: "12.4M", completion: "86%", interactive: true, status: "Published", publishedDate: "01 Jun 2026", revenue: "₹11,40,000", shares: "260K", votes: "620K", choices: 20 },
  ],
};
