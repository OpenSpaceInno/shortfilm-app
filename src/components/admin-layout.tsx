import { useState, useMemo, useEffect } from "react";
import { Link, useMatches } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Activity,
  BarChart3,
  Bell,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Coins,
  Clapperboard,
  Crown,
  FileCheck2,
  FileText,
  FileVideo,
  Film,
  FlaskConical,
  Gamepad2,
  GitBranch,
  Globe,
  Home,
  Layers,
  LayoutDashboard,
  Lightbulb,
  ListVideo,
  LogOut,
  MessageSquare,
  MonitorPlay,
  PieChart,
  ScrollText,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tags,
  TrendingUp,
  Trophy,
  Tv,
  User,
  UserCog,
  Users,
  Users2,
  Video,
  Vote,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useAdmin } from "@/lib/admin-state";
import type { AdminRole } from "@/lib/admin-data";
import { adminRoles } from "@/lib/admin-data";
import type { ReactNode } from "react";

/* ==========================================================================
   ADMIN SIDEBAR LAYOUT
   Professional, desktop-first, collapsible sections.
   ========================================================================== */

interface SidebarItem {
  label: string;
  to?: string;
  icon: LucideIcon;
  disabled?: boolean;
  roles?: AdminRole[];
}

interface SidebarSection {
  title: string;
  icon: LucideIcon;
  defaultOpen?: boolean;
  roles?: AdminRole[];
  items: SidebarItem[];
}

const sidebarSections: SidebarSection[] = [
  {
    title: "CONTENT",
    icon: Film,
    defaultOpen: true,
    roles: ["Super Admin", "Content Admin", "Editor"],
    items: [
      { label: "Series", to: "/admin/series", icon: Tv, roles: ["Super Admin", "Content Admin", "Editor"] },
      { label: "Seasons", to: "/admin/seasons", icon: Layers, roles: ["Super Admin", "Content Admin", "Editor"] },
      { label: "Episodes", to: "/admin/episodes", icon: ListVideo, roles: ["Super Admin", "Content Admin", "Editor"] },
      { label: "Videos", to: "/admin/videos", icon: Video, roles: ["Super Admin", "Content Admin", "Editor"] },
      { label: "Genres", icon: Tags, disabled: true, roles: ["Super Admin", "Content Admin"] },
      { label: "Languages", icon: Globe, disabled: true, roles: ["Super Admin", "Content Admin"] },
    ],
  },
  {
    title: "INTERACTIVE",
    icon: Gamepad2,
    defaultOpen: true,
    roles: ["Super Admin", "Content Admin", "Editor", "Analyst"],
    items: [
      { label: "Interactive Series", to: "/admin/interactive", icon: Tv, roles: ["Super Admin", "Content Admin", "Editor"] },
      { label: "Story Builder", to: "/admin/builder", icon: GitBranch, roles: ["Super Admin", "Content Admin", "Editor"] },
      { label: "Story Nodes & Choices", to: "/admin/builder", icon: Sparkles, roles: ["Super Admin", "Content Admin", "Editor"] },
      { label: "Votes & Live Results", to: "/admin/votes", icon: Vote, roles: ["Super Admin", "Editor", "Analyst"] },
      { label: "Predictions", to: "/admin/predictions", icon: Trophy, roles: ["Super Admin", "Analyst"] },
    ],
  },
  {
    title: "PEOPLE",
    icon: Users2,
    defaultOpen: true,
    roles: ["Super Admin", "Creator Manager", "Content Admin", "Editor"],
    items: [
      { label: "Users", to: "/admin/users", icon: Users, roles: ["Super Admin"] },
      { label: "Creators", to: "/admin/creators", icon: Clapperboard, roles: ["Super Admin", "Creator Manager", "Content Admin"] },
      { label: "Applications", to: "/admin/creators/applications", icon: FileCheck2, roles: ["Super Admin", "Creator Manager"] },
      { label: "Characters", to: "/admin/characters", icon: User, roles: ["Super Admin", "Content Admin", "Editor"] },
    ],
  },
  {
    title: "STORY LAB",
    icon: FlaskConical,
    defaultOpen: true,
    roles: ["Super Admin", "Content Admin", "Editor", "Creator Manager", "Analyst"],
    items: [
      { label: "Overview", to: "/admin/story-lab", icon: Sparkles, roles: ["Super Admin", "Content Admin", "Editor", "Creator Manager", "Analyst"] },
      { label: "Story Intelligence", to: "/admin/story-lab/stories", icon: Tv, roles: ["Super Admin", "Content Admin", "Editor", "Analyst"] },
      { label: "Audience Signals", to: "/admin/story-lab/audience", icon: Users, roles: ["Super Admin", "Creator Manager", "Analyst"] },
      { label: "Character Signals", to: "/admin/story-lab/characters", icon: User, roles: ["Super Admin", "Content Admin", "Analyst"] },
      { label: "Interactive Signals", to: "/admin/story-lab/interactive", icon: GitBranch, roles: ["Super Admin", "Content Admin", "Editor", "Analyst"] },
      { label: "Opportunities", to: "/admin/story-lab/opportunities", icon: Lightbulb, roles: ["Super Admin", "Creator Manager", "Analyst"] },
      { label: "Experiments", to: "/admin/story-lab/experiments", icon: FlaskConical, roles: ["Super Admin", "Analyst"] },
    ],
  },
  {
    title: "BUSINESS",
    icon: Briefcase,
    defaultOpen: true,
    roles: ["Super Admin", "Finance", "Analyst", "Content Admin", "Creator Manager"],
    items: [
      { label: "Overview", to: "/admin/business", icon: LayoutDashboard, roles: ["Super Admin", "Finance", "Analyst", "Content Admin", "Creator Manager"] },
      { label: "Audience", to: "/admin/business/audience", icon: Users, roles: ["Super Admin", "Analyst", "Content Admin", "Creator Manager"] },
      { label: "Engagement", to: "/admin/business/engagement", icon: Activity, roles: ["Super Admin", "Analyst", "Content Admin"] },
      { label: "Subscriptions", to: "/admin/business/subscriptions", icon: Crown, roles: ["Super Admin", "Finance"] },
      { label: "Revenue", to: "/admin/business/revenue", icon: Coins, roles: ["Super Admin", "Finance"] },
      { label: "Content Economics", to: "/admin/business/content-economics", icon: Film, roles: ["Super Admin", "Finance", "Content Admin", "Analyst"] },
      { label: "Creator Economics", to: "/admin/business/creator-economics", icon: Clapperboard, roles: ["Super Admin", "Creator Manager", "Analyst"] },
      { label: "Executive Reports", to: "/admin/business/reports", icon: FileText, roles: ["Super Admin", "Finance", "Analyst"] },
    ],
  },
  {
    title: "MONETISATION",
    icon: Coins,
    roles: ["Super Admin", "Finance"],
    items: [
      { label: "Subscriptions", to: "/admin/subscriptions", icon: Crown, roles: ["Super Admin", "Finance"] },
      { label: "Entitlements", to: "/admin/subscriptions", icon: ShieldCheck, roles: ["Super Admin", "Finance"] },
    ],
  },
  {
    title: "COMMUNICATION",
    icon: MessageSquare,
    roles: ["Super Admin", "Content Admin", "Creator Manager"],
    items: [
      { label: "Notifications", to: "/admin/notifications", icon: Bell, roles: ["Super Admin", "Content Admin", "Creator Manager"] },
      { label: "Campaigns", icon: Zap, disabled: true, roles: ["Super Admin", "Content Admin"] },
    ],
  },
  {
    title: "ANALYTICS",
    icon: BarChart3,
    roles: ["Super Admin", "Analyst", "Finance"],
    items: [
      { label: "Analytics", to: "/admin/analytics", icon: PieChart, roles: ["Super Admin", "Analyst", "Finance"] },
    ],
  },
  {
    title: "SETTINGS",
    icon: Settings,
    roles: ["Super Admin"],
    items: [
      { label: "Settings", to: "/admin/settings", icon: Settings, roles: ["Super Admin"] },
    ],
  },
];

function SidebarCollapsible({
  section,
  currentRole,
}: {
  section: SidebarSection;
  currentRole: AdminRole;
}) {
  const matches = useMatches();
  const currentPath = matches[matches.length - 1]?.fullPath ?? "";
  const hasActiveChild = section.items.some((item) => item.to && currentPath.startsWith(item.to));
  const [open, setOpen] = useState(section.defaultOpen || hasActiveChild);

  useEffect(() => {
    if (hasActiveChild) {
      setOpen(true);
    }
  }, [hasActiveChild, currentRole]);

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-colors ${
          hasActiveChild
            ? "text-primary bg-primary/10 font-extrabold"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <section.icon className="size-3.5 shrink-0" />
          <span className="truncate">{section.title}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[9px] font-mono font-medium text-muted-foreground/70">
            {section.items.length}
          </span>
          {open ? (
            <ChevronDown className="size-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3 text-muted-foreground" />
          )}
        </div>
      </button>

      {open && (
        <div className="ml-2.5 mt-0.5 space-y-0.5 border-l border-border/60 pl-2.5">
          {section.items.map((item) => {
            const isActive = item.to && currentPath.startsWith(item.to);
            if (item.disabled) {
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground/40 cursor-not-allowed select-none"
                  title="Coming Soon"
                >
                  <item.icon className="size-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
              );
            }
            return (
              <Link
                key={item.label}
                to={item.to!}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-primary/15 text-primary font-bold shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <item.icon className="size-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { ThemeToggle } from "@/lib/theme-provider";

export function AdminSidebar() {
  const { currentUser, logout, switchRole } = useAdmin();
  const [showRoleSwitch, setShowRoleSwitch] = useState(false);
  const matches = useMatches();
  const currentPath = matches[matches.length - 1]?.fullPath ?? "";

  const activeRole: AdminRole = currentUser?.role ?? "Super Admin";

  // Filter sections and items dynamically based on the active role switch
  const visibleSections = useMemo(() => {
    if (activeRole === "Super Admin") {
      return sidebarSections;
    }

    return sidebarSections
      .filter((section) => !section.roles || section.roles.includes(activeRole))
      .map((section) => {
        const filteredItems = section.items.filter((item) => {
          if (!item.roles) return true;
          return item.roles.includes(activeRole);
        });

        return {
          ...section,
          items: filteredItems,
        };
      })
      .filter((section) => section.items.length > 0);
  }, [activeRole]);

  const totalVisibleModules = useMemo(() => {
    return visibleSections.reduce((acc, s) => acc + s.items.length, 1); // +1 for dashboard
  }, [visibleSections]);

  const handleRoleSelect = (newRole: AdminRole) => {
    switchRole(newRole);
    setShowRoleSwitch(false);
    toast.success(`Role switched to ${newRole}`, {
      description: `Navigation updated with accessible modules for ${newRole}.`,
    });
  };

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar shadow-xs select-none">
      {/* Brand Header - Pinned at top */}
      <div className="border-b border-border/80 px-4 py-3.5 shrink-0 flex items-center justify-between">
        <Link to="/admin/dashboard" className="flex items-center gap-2.5 group">
          <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-rose-500 text-white font-display text-sm font-bold shadow-sm ring-2 ring-primary/20 group-hover:scale-105 transition-transform">
            SR
          </div>
          <div>
            <p className="font-display text-base tracking-wider text-foreground font-bold">
              SHORTREEL
            </p>
            <p className="text-[10px] text-muted-foreground font-semibold tracking-wider uppercase">
              Admin Console
            </p>
          </div>
        </Link>
        <span className="rounded-full bg-primary/10 border border-primary/25 px-2 py-0.5 text-[9px] font-mono font-bold text-primary">
          v2.4
        </span>
      </div>

      {/* Role Filter Status Pill */}
      <div className="border-b border-border/60 bg-muted/20 px-3.5 py-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="grid size-5 place-items-center rounded-md bg-primary/15 text-primary text-[10px] font-bold shrink-0">
              <Shield className="size-3" />
            </span>
            <div className="min-w-0">
              <span className="block truncate text-xs font-bold text-foreground">
                {activeRole}
              </span>
              <span className="block text-[10px] text-muted-foreground">
                Active Role Filter
              </span>
            </div>
          </div>
          <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-mono font-semibold text-primary shrink-0">
            {activeRole === "Super Admin" ? "All Modules" : `${totalVisibleModules} Modules`}
          </span>
        </div>
      </div>

      {/* Navigation: Independent Scroll Container */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1 overscroll-contain admin-scroll">
        {/* Dashboard - standalone */}
        <Link
          to="/admin/dashboard"
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
            currentPath === "/admin/dashboard" || currentPath === "/admin"
              ? "bg-primary/15 text-primary font-bold shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
          }`}
        >
          <LayoutDashboard className="size-4 shrink-0" />
          <span>Dashboard</span>
        </Link>

        <div className="my-1.5 border-t border-border/40" />

        {/* Collapsible Sections filtered by active role */}
        {visibleSections.map((section) => (
          <SidebarCollapsible key={section.title} section={section} currentRole={activeRole} />
        ))}
      </nav>

      {/* Footer: Admin Profile & Role Switching - Pinned at bottom */}
      <div className="border-t border-border px-3 py-2.5 space-y-2 shrink-0 bg-sidebar">
        {/* Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleSwitch(!showRoleSwitch)}
            className="flex w-full items-center justify-between rounded-lg bg-card/80 border border-border/70 px-2.5 py-1.5 text-[11px] font-semibold text-foreground hover:bg-muted/50 transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-1.5 truncate">
              <UserCog className="size-3.5 text-primary shrink-0" />
              <span className="truncate">Role: {activeRole}</span>
            </div>
            <ChevronDown className="size-3 text-muted-foreground shrink-0" />
          </button>

          {showRoleSwitch && (
            <div className="absolute bottom-full left-0 right-0 mb-1 rounded-xl border border-border bg-card shadow-xl p-1.5 z-50">
              <p className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Switch Role Filter
              </p>
              {adminRoles.map(({ role, description }) => (
                <button
                  key={role}
                  onClick={() => handleRoleSelect(role)}
                  className={`flex items-center justify-between w-full text-left rounded-lg px-2 py-1.5 text-xs transition-colors ${
                    activeRole === role
                      ? "bg-primary/15 text-primary font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                  title={description}
                >
                  <span className="font-medium">{role}</span>
                  {activeRole === role && (
                    <span className="size-1.5 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Mode Toggle */}
        <ThemeToggle className="w-full justify-center" showLabel />

        {/* User + Logout */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/15 text-primary text-[10px] font-bold">
              {currentUser?.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2) ?? "AD"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-foreground">
                {currentUser?.name}
              </p>
              <p className="truncate text-[10px] text-muted-foreground">
                {currentUser?.email}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Logout"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ==========================================================================
   ADMIN PAGE WRAPPER
   Header bar + independent scroll content area.
   ========================================================================== */

export function AdminPage({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Page Header - pinned at top of main scroll container */}
      <header className="sticky top-0 z-30 shrink-0 border-b border-border bg-card/95 backdrop-blur-md px-6 py-4 shadow-xs">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl tracking-wide text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            {actions}
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 p-6 min-w-0">{children}</main>
    </div>
  );
}

/* ==========================================================================
   CONSUMER RETURN BUTTON
   Quick link to return to the consumer OTT from admin.
   ========================================================================== */

export function ConsumerReturnLink() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      <MonitorPlay className="size-3.5" />
      View Consumer App
    </Link>
  );
}

/* ==========================================================================
   ADMIN RBAC GUARD (P10.1)
   Role-based gate wrapper for protecting admin sections.
   ========================================================================== */

export function AdminRbacGuard({
  requiredRoles,
  sectionName = "this administrative module",
  children,
}: {
  requiredRoles: AdminRole | AdminRole[];
  sectionName?: string;
  children: ReactNode;
}) {
  const { currentUser, switchRole, hasRole } = useAdmin();
  const allowed = hasRole(requiredRoles);

  if (!allowed) {
    const rolesList = Array.isArray(requiredRoles) ? requiredRoles.join(" or ") : requiredRoles;
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-4 max-w-xl mx-auto my-12">
        <div className="grid size-12 place-items-center rounded-2xl bg-destructive/15 text-destructive mx-auto">
          <ShieldAlert className="size-6" />
        </div>
        <div>
          <h3 className="font-display text-2xl tracking-wide text-foreground">
            Access Restricted
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Access to {sectionName} requires <strong>{rolesList}</strong> privileges.
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your current session role is <span className="font-semibold text-primary">{currentUser?.role || "Viewer"}</span>.
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={() => switchRole("Super Admin")}
            className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            Switch to Super Admin (Dev Mode)
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
