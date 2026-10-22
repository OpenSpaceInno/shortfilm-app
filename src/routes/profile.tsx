import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crown,
  Edit2,
  Globe,
  HelpCircle,
  History,
  Lock,
  LogOut,
  Mail,
  Phone,
  Play,
  RotateCcw,
  Settings,
  Shield,
  Smartphone,
  Sparkles,
  Trash2,
  Tv,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { BadgeCard, StoryJourneyCard, XPBadge } from "@/components/engagement";
import { badges } from "@/lib/engagement";
import { useEngagement } from "@/lib/engagement-state";
import { PwaInstallRow } from "@/lib/pwa-install";
import { useAuth, DEV_PROFILES, type UserRole } from "@/hooks/use-auth";
import { continueWatching } from "@/lib/catalog";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile & Settings — ShortReel" },
      {
        name: "description",
        content:
          "Manage your ShortReel profile, subscription, notifications, language and watch history.",
      },
      { property: "og:title", content: "Profile & Settings — ShortReel" },
      {
        property: "og:description",
        content: "Your account, subscription and playback preferences.",
      },
    ],
  }),
  component: ProfilePage,
});

const languagesList = [
  { code: "hi", name: "Hindi (हिंदी)", region: "India" },
  { code: "ta", name: "Tamil (தமிழ்)", region: "India" },
  { code: "te", name: "Telugu (తెలుగు)", region: "India" },
  { code: "en", name: "English", region: "Global" },
  { code: "ml", name: "Malayalam (മലയാളം)", region: "India" },
  { code: "kn", name: "Kannada (ಕನ್ನಡ)", region: "India" },
  { code: "bn", name: "Bengali (বাংলা)", region: "India" },
];

function ProfilePage() {
  const { earnedBadges, isVip, activePlan, upgradeToVip, cancelVip } = useEngagement();
  const { user, role, setDevRole, login, logout, updateUser, isAuthenticated } = useAuth();
  const earned = new Set(earnedBadges.map((b) => b.id));

  // Modals & Interactive Dialog States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || user?.name || "");
  const [editEmail, setEditEmail] = useState(user?.email || "");
  const [editPhone, setEditPhone] = useState("+91 98765 43210");

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("Hindi (हिंदी) · India");

  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [cacheSize, setCacheSize] = useState("142 MB");
  const [dataSaver, setDataSaver] = useState(true);

  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [vipModalOpen, setVipModalOpen] = useState(false);

  // Sign In Form States for unauthenticated mode
  const [loginPhone, setLoginPhone] = useState("");
  const [loginStep, setLoginStep] = useState<"phone" | "otp">("phone");
  const [otpValue, setOtpValue] = useState("");

  // Sync edit form with user when user changes
  useEffect(() => {
    if (user) {
      setEditName(user.displayName || user.name || "");
      setEditEmail(user.email || "");
    }
  }, [user]);

  // Load language preference from storage
  useEffect(() => {
    const saved = localStorage.getItem("shortreel_pref_lang");
    if (saved) {
      setSelectedLang(saved);
    }
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.error("Name cannot be blank");
      return;
    }
    updateUser({
      displayName: editName.trim(),
      name: editName.trim(),
      email: editEmail.trim(),
    });
    setEditModalOpen(false);
    toast.success("Profile updated successfully!");
  };

  const handleSelectLanguage = (langName: string, region: string) => {
    const full = `${langName} · ${region}`;
    setSelectedLang(full);
    localStorage.setItem("shortreel_pref_lang", full);
    setLanguageModalOpen(false);
    toast.success(`Language set to ${langName}`);
  };

  const handleClearCache = () => {
    setCacheSize("0 MB");
    toast.success("Offline video cache cleared (142 MB freed)");
  };

  const handleResetStoryChoices = () => {
    toast.success("Story decision path history reset to defaults");
    setPrivacyModalOpen(false);
  };

  const handleDemoLogin = async (profileKey: UserRole) => {
    const profile = DEV_PROFILES[profileKey];
    setDevRole(profileKey);
    await login(profile.email);
    toast.success(`Signed in as ${profile.displayName}`);
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginPhone.length < 8) {
      toast.error("Please enter a valid phone number");
      return;
    }
    setLoginStep("otp");
    toast.info("Verification code sent: 4829");
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue === "4829" || otpValue.length === 4) {
      await login(`user_${loginPhone.slice(-4)}@shortreel.io`);
      setLoginStep("phone");
      setLoginPhone("");
      setOtpValue("");
      toast.success("Signed in successfully!");
    } else {
      toast.error("Invalid code. Use 4829 for demo.");
    }
  };

  const nameStr = user?.displayName || user?.name || "Aarav Rao";
  const initials = nameStr
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isAdminRole = ["SUPER_ADMIN", "CONTENT_ADMIN", "EDITOR", "ANALYST", "FINANCE"].includes(
    role
  );

  return (
    <AppShell>
      <PageHeader
        title="Profile"
        subtitle="Manage playback, VIP status, story XP & security"
      />

      {/* 1. UNAUTHENTICATED STATE: Sleek Sign In Card */}
      {!isAuthenticated || !user ? (
        <div className="mx-5 space-y-5">
          <div className="rounded-3xl border border-primary/40 bg-gradient-to-b from-card via-card to-primary/5 p-6 shadow-xl text-center space-y-4">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-inner">
              <User className="size-8" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground tracking-wide">
                Sign In to ShortReel
              </h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Sync your interactive choices, claim earned badges, unlock VIP episodes, and continue where you left off.
              </p>
            </div>

            {/* Quick Demo Login Profiles */}
            <div className="pt-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Fast Sign In with Demo Profiles
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => handleDemoLogin("USER")}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-border/80 bg-background/80 hover:border-primary/50 hover:bg-primary/5 transition-all text-left cursor-pointer"
                >
                  <Crown className="size-4 text-amber-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">Priya Sharma</p>
                    <p className="text-[10px] text-muted-foreground">VIP Viewer</p>
                  </div>
                </button>

                <button
                  onClick={() => handleDemoLogin("CREATOR")}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-border/80 bg-background/80 hover:border-fuchsia-500/50 hover:bg-fuchsia-500/5 transition-all text-left cursor-pointer"
                >
                  <Sparkles className="size-4 text-fuchsia-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">Vikramaditya M.</p>
                    <p className="text-[10px] text-muted-foreground">Studio Creator</p>
                  </div>
                </button>

                <button
                  onClick={() => handleDemoLogin("SUPER_ADMIN")}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-border/80 bg-background/80 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-left cursor-pointer"
                >
                  <Shield className="size-4 text-purple-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">Platform Admin</p>
                    <p className="text-[10px] text-muted-foreground">Command Center</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="h-px bg-border flex-1" />
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                or via phone
              </span>
              <div className="h-px bg-border flex-1" />
            </div>

            {/* Mobile / OTP Form */}
            {loginStep === "phone" ? (
              <form onSubmit={handlePhoneSubmit} className="space-y-3">
                <div className="relative">
                  <Phone className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="tel"
                    placeholder="Enter 10-digit mobile number"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all cursor-pointer"
                >
                  Get Verification Code
                </button>
              </form>
            ) : (
              <form onSubmit={handleOtpVerify} className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Enter 4-digit code sent to <span className="text-foreground font-semibold">{loginPhone}</span>
                </p>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="Demo code: 4829"
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-center text-sm font-mono tracking-widest text-foreground focus:border-primary focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLoginStep("phone")}
                    className="flex-1 rounded-xl border border-border py-2 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-primary py-2 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all cursor-pointer"
                  >
                    Verify &amp; Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : (
        /* 2. AUTHENTICATED STATE: Comprehensive Consumer Profile & Controls */
        <div className="space-y-5">
          {/* User Bio Card */}
          <div className="mx-5 flex items-center justify-between gap-4 rounded-3xl border border-border/80 bg-card/90 p-5 shadow-xs">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative shrink-0">
                <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-tr from-primary/30 to-primary/10 font-display text-xl text-primary font-bold shadow-xs">
                  {initials}
                </span>
                <button
                  onClick={() => setEditModalOpen(true)}
                  className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground shadow-xs hover:scale-110 transition-transform cursor-pointer"
                  title="Edit profile"
                >
                  <Edit2 className="size-2.5" />
                </button>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-base font-bold text-foreground truncate">{nameStr}</p>
                  <button
                    onClick={() => setEditModalOpen(true)}
                    className="text-[11px] text-primary hover:underline font-semibold"
                  >
                    Edit
                  </button>
                </div>
                <p className="truncate text-xs text-muted-foreground mt-0.5">
                  {user?.email || "+91 98765 43210"}
                </p>
                <div className="mt-2 inline-flex">
                  <XPBadge />
                </div>
              </div>
            </div>

            {/* Role indicator & Developer Role Selector */}
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 shadow-2xs">
                {role}
              </span>
              <select
                value={role}
                onChange={(e) => {
                  const newRole = e.target.value as UserRole;
                  setDevRole(newRole);
                  toast.success(`Switched role to ${newRole}`);
                }}
                className="text-[11px] bg-background border border-border rounded-lg px-2 py-1 text-muted-foreground cursor-pointer outline-none shadow-xs font-medium"
                title="Switch active user role"
              >
                <option value="USER">Viewer (User)</option>
                <option value="CREATOR">Creator</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="CONTENT_ADMIN">Content Admin</option>
                <option value="EDITOR">Editor</option>
                <option value="ANALYST">Analyst</option>
                <option value="FINANCE">Finance</option>
              </select>
            </div>
          </div>

          {/* Admin Role Quick Portal (When in an Admin Role) */}
          {isAdminRole && (
            <Link
              to="/admin/dashboard"
              className="mx-5 flex items-center justify-between gap-3 rounded-2xl border border-purple-500/40 bg-gradient-to-r from-card via-purple-500/10 to-card p-4 shadow-sm hover:border-purple-500/70 transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-purple-500/20 text-purple-400 group-hover:scale-105 transition-transform">
                  <Shield className="size-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground">ShortReel Admin Console</p>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      {role}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Launch executive operations, review pipeline &amp; analytics
                  </p>
                </div>
              </div>
              <ChevronRight className="size-5 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}

          {/* Creator Studio Quick Portal */}
          <Link
            to="/creator/studio"
            className="mx-5 flex items-center justify-between gap-3 rounded-2xl border border-primary/40 bg-gradient-to-r from-card via-primary/10 to-card p-4 shadow-sm hover:border-primary/60 transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-primary/20 text-primary group-hover:scale-105 transition-transform">
                <Sparkles className="size-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">Creator Studio Workspace</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Build vertical branching series, AI concepts &amp; track earnings
                </p>
              </div>
            </div>
            <ChevronRight className="size-5 text-primary group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* Story Journey Gamification */}
          <div className="mx-5">
            <StoryJourneyCard />
          </div>

          {/* Badges Shelf */}
          <section className="mx-5">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="font-display text-xl tracking-wide text-foreground font-bold">
                Achievement Badges
              </h2>
              <span className="text-xs font-semibold text-muted-foreground">
                {earned.size} of {badges.length} unlocked
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {badges.map((b) => (
                <BadgeCard key={b.id} badge={b} earned={earned.has(b.id)} />
              ))}
            </div>
          </section>

          {/* VIP Membership Card */}
          {isVip ? (
            <div className="mx-5 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-card to-card p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <p className="inline-flex items-center gap-2 text-sm font-bold text-amber-500">
                  <Crown className="size-4" /> VIP Active Member
                </p>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {activePlan || "Annual VIP Pass"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                All premium episodes, branching decisions, 1080p stream and secret alternate endings unlocked.
              </p>
              <div className="pt-2 flex gap-2">
                <Link
                  to="/plans"
                  className="flex-1 inline-flex items-center justify-center rounded-xl border border-border bg-card/80 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-xs"
                >
                  Change Plan
                </Link>
                <button
                  onClick={() => setVipModalOpen(true)}
                  className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-500 hover:bg-amber-500/20 transition-colors cursor-pointer"
                >
                  Manage Perks
                </button>
              </div>
            </div>
          ) : (
            <div className="mx-5 rounded-2xl border border-primary/30 bg-card p-4 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="inline-flex items-center gap-2 text-sm font-bold text-primary">
                  <Crown className="size-4" /> Free Plan
                </p>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                  Standard SD
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                You're enjoying free pilot episodes. Upgrade to VIP to unlock all complete seasons, branching decisions, and ad-free playback.
              </p>
              <Link
                to="/plans"
                className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
              >
                Upgrade to VIP Pass (from ₹99/mo)
              </Link>
            </div>
          )}

          {/* ShortReel PWA & Notifications */}
          <div className="mx-5 space-y-3">
            <Link
              to="/pwa"
              className="flex items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-card p-4 hover:border-primary/50 transition-colors shadow-xs group"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary group-hover:scale-105 transition-transform">
                  <Smartphone className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">ShortReel Mobile PWA</p>
                  <p className="text-xs text-muted-foreground">Install on Android &amp; iOS, offline cache guide</p>
                </div>
              </div>
              <ChevronRight className="size-4 text-primary group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              to="/notifications"
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 shadow-xs hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Bell className="size-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Notifications</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">New episode alerts</span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
            </Link>
          </div>

          {/* Interactive Profile Settings Rows */}
          <ul className="mx-5 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
            <li>
              <PwaInstallRow />
            </li>

            {/* Watch History Row */}
            <li>
              <button
                onClick={() => setHistoryModalOpen(true)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <History className="size-4 text-muted-foreground" />
                <span className="flex-1 text-sm font-medium text-foreground">Watch History</span>
                <span className="text-[11px] text-muted-foreground">42 episodes</span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </button>
            </li>

            {/* Language & Region Row */}
            <li>
              <button
                onClick={() => setLanguageModalOpen(true)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <Globe className="size-4 text-muted-foreground" />
                <span className="flex-1 text-sm font-medium text-foreground">Language &amp; Region</span>
                <span className="text-[11px] text-primary font-medium">{selectedLang}</span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </button>
            </li>

            {/* Privacy & Data Row */}
            <li>
              <button
                onClick={() => setPrivacyModalOpen(true)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <Shield className="size-4 text-muted-foreground" />
                <span className="flex-1 text-sm font-medium text-foreground">Privacy &amp; Data Storage</span>
                <span className="text-[11px] text-muted-foreground">{cacheSize} cached</span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </button>
            </li>

            {/* Help & Support Row */}
            <li>
              <button
                onClick={() => setHelpModalOpen(true)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <HelpCircle className="size-4 text-muted-foreground" />
                <span className="flex-1 text-sm font-medium text-foreground">Help &amp; Support</span>
                <span className="text-[11px] text-muted-foreground">FAQs &amp; Chat</span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </button>
            </li>
          </ul>

          {/* Sign Out Button */}
          <div className="mx-5 pt-2">
            <button
              onClick={() => {
                logout();
                toast.info("Signed out of your ShortReel account");
              }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 py-3 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            >
              <LogOut className="size-4" /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 1: EDIT PROFILE
          ===================================================================== */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-foreground">Edit Profile</h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Display Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  placeholder="Enter full name"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  placeholder="name@domain.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Mobile Phone</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  placeholder="+91..."
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="flex-1 rounded-xl border border-border py-2 text-xs font-semibold text-muted-foreground hover:bg-muted cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-primary py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: WATCH HISTORY
          ===================================================================== */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">Recent Watch History</h3>
                <p className="text-xs text-muted-foreground">Pick up where you left off</p>
              </div>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {continueWatching.map((item) => (
                <div
                  key={item.series.slug}
                  className="flex items-center gap-3 rounded-2xl border border-border/80 bg-muted/20 p-2.5 hover:border-primary/40 transition-all"
                >
                  <img
                    src={item.series.poster}
                    alt={item.series.title}
                    className="size-14 rounded-xl object-cover shrink-0 shadow-xs"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{item.series.title}</p>
                    <p className="text-[11px] text-muted-foreground">{item.episode.title}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-muted/60 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.round((item.episode.progress ?? 0.5) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {Math.round((item.episode.progress ?? 0.5) * 100)}%
                      </span>
                    </div>
                  </div>
                  <Link
                    to="/watch/$slug"
                    params={{ slug: item.series.slug }}
                    onClick={() => setHistoryModalOpen(false)}
                    className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-xs hover:scale-105 transition-transform shrink-0"
                    title="Play episode"
                  >
                    <Play className="size-3.5 fill-current ml-0.5" />
                  </Link>
                </div>
              ))}
            </div>

            <div className="pt-2 flex gap-2">
              <Link
                to="/library"
                onClick={() => setHistoryModalOpen(false)}
                className="w-full inline-flex items-center justify-center rounded-xl bg-primary/10 border border-primary/30 py-2.5 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
              >
                Go to My Full Library
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: LANGUAGE & REGION
          ===================================================================== */}
      {languageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">Content Language</h3>
                <p className="text-xs text-muted-foreground">Select your audio and subtitle preference</p>
              </div>
              <button
                onClick={() => setLanguageModalOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {languagesList.map((lang) => {
                const prefix = lang.name.split(" ")[0] ?? "";
                const isSelected = selectedLang.includes(prefix);
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleSelectLanguage(lang.name, lang.region)}
                    className={`flex w-full items-center justify-between rounded-xl p-3 text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-xs font-bold"
                        : "bg-muted/30 text-foreground hover:bg-muted/60"
                    }`}
                  >
                    <span>{lang.name}</span>
                    {isSelected && <Check className="size-4" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 4: PRIVACY & DATA STORAGE
          ===================================================================== */}
      {privacyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">Privacy &amp; Cache</h3>
                <p className="text-xs text-muted-foreground">Local storage &amp; offline playback</p>
              </div>
              <button
                onClick={() => setPrivacyModalOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-muted/20">
                <div>
                  <p className="font-semibold text-foreground">Downloaded Video Cache</p>
                  <p className="text-[11px] text-muted-foreground">PWA service worker media cache</p>
                </div>
                <span className="font-mono font-bold text-primary">{cacheSize}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-muted/20">
                <div>
                  <p className="font-semibold text-foreground">Mobile Data Saver</p>
                  <p className="text-[11px] text-muted-foreground">Stream at 480p on cellular</p>
                </div>
                <button
                  onClick={() => setDataSaver(!dataSaver)}
                  className={`size-6 rounded-md grid place-items-center font-bold text-[10px] cursor-pointer ${
                    dataSaver ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {dataSaver ? "ON" : "OFF"}
                </button>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  onClick={handleClearCache}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-border p-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <Trash2 className="size-3.5 text-destructive" /> Clear Offline Cache
                </button>
                <button
                  onClick={handleResetStoryChoices}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-border p-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <RotateCcw className="size-3.5 text-amber-500" /> Reset Interactive Choices
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 5: HELP & SUPPORT
          ===================================================================== */}
      {helpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">Help &amp; Support</h3>
                <p className="text-xs text-muted-foreground">Instant answers &amp; priority contact</p>
              </div>
              <button
                onClick={() => setHelpModalOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* FAQs */}
            <div className="space-y-2 text-xs">
              {[
                {
                  q: "How do interactive story choices work?",
                  a: "At critical narrative moments, you will see a 10-second timer prompt with Option A and Option B. Your choice dynamically branches the plot and unlocks distinct alternate endings.",
                },
                {
                  q: "Can I watch episodes offline?",
                  a: "Yes! Using our PWA app, open any episode while connected to Wi-Fi and it will automatically cache to your device for offline viewing.",
                },
                {
                  q: "How does VIP Membership billing work?",
                  a: "VIP Monthly is ₹99/mo and Annual Pass is ₹799/yr. You can cancel or pause anytime from your profile without cancellation penalties.",
                },
                {
                  q: "How can I become a ShortReel creator?",
                  a: "Switch to the Creator role or visit our Creators page to pitch your vertical story concept and access our AI Story Studio.",
                },
              ].map((faq, i) => (
                <div key={i} className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-1">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex w-full items-center justify-between font-bold text-foreground text-left cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span className="text-primary text-base font-mono">{openFaq === i ? "−" : "+"}</span>
                  </button>
                  {openFaq === i && <p className="text-[11px] text-muted-foreground pt-1 leading-relaxed">{faq.a}</p>}
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  toast.success("Connecting to 24/7 Priority Support Chat...");
                  setHelpModalOpen(false);
                }}
                className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all cursor-pointer"
              >
                Start Live Support Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 6: MANAGE VIP MEMBERSHIP
          ===================================================================== */}
      {vipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="size-5 text-amber-500" />
                <h3 className="font-display text-xl font-bold text-foreground">VIP Perks</h3>
              </div>
              <button
                onClick={() => setVipModalOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-1">
                <p className="font-bold text-foreground">Current Plan: {activePlan || "Annual VIP Pass"}</p>
                <p className="text-[11px] text-muted-foreground">Renewal Date: 20 Oct 2027 • ₹799/yr</p>
              </div>

              <ul className="space-y-1.5 text-xs text-muted-foreground pt-1">
                <li className="flex items-center gap-2 text-foreground font-medium">
                  <CheckCircle2 className="size-3.5 text-emerald-500" /> All 156+ Series Unlocked
                </li>
                <li className="flex items-center gap-2 text-foreground font-medium">
                  <CheckCircle2 className="size-3.5 text-emerald-500" /> Ad-Free 1080p Portrait Stream
                </li>
                <li className="flex items-center gap-2 text-foreground font-medium">
                  <CheckCircle2 className="size-3.5 text-emerald-500" /> Exclusive Interactive Endings
                </li>
                <li className="flex items-center gap-2 text-foreground font-medium">
                  <CheckCircle2 className="size-3.5 text-emerald-500" /> 24-Hour Early Access on Drops
                </li>
              </ul>

              <div className="pt-2 flex gap-2">
                <Link
                  to="/plans"
                  onClick={() => setVipModalOpen(false)}
                  className="flex-1 rounded-xl bg-primary py-2 text-center text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  Change Tier
                </Link>
                <button
                  onClick={() => {
                    cancelVip();
                    setVipModalOpen(false);
                    toast.info("VIP Membership paused.");
                  }}
                  className="flex-1 rounded-xl border border-destructive/30 bg-destructive/10 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20 cursor-pointer"
                >
                  Pause VIP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
