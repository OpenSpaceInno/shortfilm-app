import { useState, useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Ban,
  BarChart3,
  CheckCircle,
  Clapperboard,
  Coins,
  FileCheck2,
  Film,
  Filter,
  Flame,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPage } from "@/components/admin-layout";
import {
  ActionMenu,
  AdminButton,
  AdminModal,
  type Column,
  DataTable,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  KPICard,
  StatusBadge,
} from "@/components/admin-components";
import { useAdmin } from "@/lib/admin-state";
import { useAdminCreators } from "@/lib/admin-creators-state";
import { type AdminCreatorFull, type CreatorLifecycleStatus } from "@/lib/admin-creators-data";

export const Route = createFileRoute("/admin/creators/")({
  head: () => ({
    meta: [
      { title: "Creator Management — ShortReel Admin" },
      { name: "description", content: "Manage creators, submissions, performance and creator operations." },
    ],
  }),
  component: AdminCreatorsDashboardPage,
});

function AdminCreatorsDashboardPage() {
  const navigate = useNavigate();
  const { currentUser } = useAdmin();
  const {
    creators,
    applications,
    verifyCreator,
    suspendCreator,
    reactivateCreator,
    approveCreator,
  } = useAdminCreators();

  // Search & Filters State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "followers" | "stories" | "views" | "revenue" | "joined">("followers");

  // Operational Dialog States
  const [verifyModalCreator, setVerifyModalCreator] = useState<AdminCreatorFull | null>(null);
  const [suspendModalCreator, setSuspendModalCreator] = useState<AdminCreatorFull | null>(null);
  const [suspendReasonCategory, setSuspendReasonCategory] = useState("Policy violation");
  const [suspendNotes, setSuspendNotes] = useState("");
  const [reactivateModalCreator, setReactivateModalCreator] = useState<AdminCreatorFull | null>(null);

  // Filtered & Sorted Creators
  const filteredCreators = useMemo(() => {
    return creators
      .filter((c) => {
        const query = search.trim().toLowerCase();
        const matchesSearch =
          !query ||
          c.name.toLowerCase().includes(query) ||
          c.username.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.id.toLowerCase().includes(query);

        const matchesStatus = !statusFilter || c.status === statusFilter;
        const matchesCategory = !categoryFilter || c.category === categoryFilter;
        const matchesVerification = !verificationFilter || c.verificationStatus === verificationFilter;

        let matchesDate = true;
        if (dateFilter === "month") {
          matchesDate = c.joinedAt.includes("Sep 2026");
        } else if (dateFilter === "90days") {
          matchesDate = c.joinedAt.includes("Jul 2026") || c.joinedAt.includes("Aug 2026") || c.joinedAt.includes("Sep 2026");
        } else if (dateFilter === "earlier") {
          matchesDate = !c.joinedAt.includes("Jul 2026") && !c.joinedAt.includes("Aug 2026") && !c.joinedAt.includes("Sep 2026");
        }

        return matchesSearch && matchesStatus && matchesCategory && matchesVerification && matchesDate;
      })
      .sort((a, b) => {
        if (sortBy === "followers") return b.followersCount - a.followersCount;
        if (sortBy === "stories") return b.stories - a.stories;
        if (sortBy === "views") return b.viewsCount - a.viewsCount;
        if (sortBy === "revenue") return b.revenueAmount - a.revenueAmount;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return 0;
      });
  }, [creators, search, statusFilter, categoryFilter, verificationFilter, dateFilter, sortBy]);

  // Derived KPI Metrics
  const activeCount = creators.filter((c) => c.status === "ACTIVE" || c.status === "VERIFIED").length;
  const pendingAppsCount = applications.filter((a) => a.status === "Pending" || a.status === "Under Review").length;
  const verifiedCount = creators.filter((c) => c.verificationStatus === "Verified").length;
  const suspendedCount = creators.filter((c) => c.status === "SUSPENDED").length;
  const totalPublishedStories = creators.reduce((acc, c) => acc + c.published, 0);

  // Table Columns
  const columns: Column<AdminCreatorFull>[] = [
    {
      key: "creator",
      label: "Creator",
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-3 min-w-[210px]">
          <img
            src={c.avatar}
            alt={c.name}
            className="size-9 rounded-full object-cover border border-border shrink-0 bg-muted"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Link
                to="/admin/creators/$creatorId"
                params={{ creatorId: c.id }}
                className="font-semibold text-foreground text-sm hover:text-primary transition-colors truncate"
              >
                {c.name}
              </Link>
              {c.verificationStatus === "Verified" && (
                <span title="Verified Creator">
                  <ShieldCheck className="size-3.5 text-primary shrink-0" />
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">{c.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "username",
      label: "Username",
      render: (c) => (
        <span className="font-mono text-xs text-muted-foreground">{c.username}</span>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (c) => (
        <span className="inline-flex items-center rounded-lg bg-muted/40 px-2 py-0.5 text-xs font-medium text-foreground">
          {c.category}
        </span>
      ),
    },
    {
      key: "followers",
      label: "Followers",
      sortable: true,
      render: (c) => (
        <span className="font-semibold text-foreground text-xs">{c.followers}</span>
      ),
    },
    {
      key: "stories",
      label: "Stories",
      sortable: true,
      render: (c) => (
        <span className="text-foreground text-xs font-medium">{c.stories}</span>
      ),
    },
    {
      key: "published",
      label: "Published",
      render: (c) => (
        <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">{c.published}</span>
      ),
    },
    {
      key: "views",
      label: "Views",
      render: (c) => (
        <span className="text-xs text-muted-foreground">{c.views}</span>
      ),
    },
    {
      key: "engagement",
      label: "Engagement",
      render: (c) => (
        <span className="text-xs font-medium text-foreground">{c.engagement}</span>
      ),
    },
    {
      key: "revenue",
      label: "Revenue",
      render: (c) => (
        <span className="text-xs font-semibold text-foreground">{c.revenue}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (c) => <StatusBadge status={c.status} />,
    },
    {
      key: "joinedAt",
      label: "Joined",
      render: (c) => (
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">{c.joinedAt}</span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (c) => (
        <ActionMenu
          actions={[
            {
              label: "View Profile & Details",
              onClick: () => navigate({ to: "/admin/creators/$creatorId", params: { creatorId: c.id } }),
            },
            {
              label: "View Stories",
              onClick: () => navigate({ to: "/admin/creators/$creatorId/stories", params: { creatorId: c.id } }),
            },
            {
              label: "View Analytics",
              onClick: () => navigate({ to: "/admin/creators/$creatorId/analytics", params: { creatorId: c.id } }),
            },
            ...(c.verificationStatus !== "Verified"
              ? [
                  {
                    label: "Verify Creator",
                    onClick: () => setVerifyModalCreator(c),
                  },
                ]
              : []),
            ...(c.status === "APPLIED" || c.status === "UNDER_REVIEW"
              ? [
                  {
                    label: "Approve Onboarding",
                    onClick: () => approveCreator(c.id, currentUser?.name || "Admin"),
                  },
                ]
              : []),
            ...(c.status !== "SUSPENDED"
              ? [
                  {
                    label: "Suspend Creator",
                    danger: true,
                    onClick: () => {
                      setSuspendModalCreator(c);
                      setSuspendNotes("");
                    },
                  },
                ]
              : [
                  {
                    label: "Reactivate Creator",
                    onClick: () => setReactivateModalCreator(c),
                  },
                ]),
          ]}
        />
      ),
    },
  ];

  return (
    <AdminPage
      title="Creator Management"
      subtitle="Manage creators, submissions, performance and creator operations."
      actions={
        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/creators/applications"
            className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
          >
            <FileCheck2 className="size-3.5" />
            <span>Review Applications</span>
            {pendingAppsCount > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {pendingAppsCount}
              </span>
            )}
          </Link>
          <Link
            to="/creator/studio"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <Clapperboard className="size-3.5" />
            <span>Open Creator Studio</span>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Top KPI Cards (Section 6) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPICard
            label="Total Creators"
            value={creators.length.toString()}
            icon={<Users className="size-4" />}
            sublabel="+3 this month"
          />
          <KPICard
            label="Active Creators"
            value={activeCount.toString()}
            icon={<TrendingUp className="size-4" />}
            trend={`${Math.round((activeCount / (creators.length || 1)) * 100)}% active`}
          />
          <KPICard
            label="Pending Applications"
            value={pendingAppsCount.toString()}
            icon={<FileCheck2 className="size-4" />}
            sublabel="Awaiting editorial"
          />
          <KPICard
            label="Verified Creators"
            value={verifiedCount.toString()}
            icon={<ShieldCheck className="size-4" />}
            sublabel="Identity checked"
          />
          <KPICard
            label="Suspended"
            value={suspendedCount.toString()}
            icon={<ShieldAlert className="size-4" />}
            sublabel="Compliance hold"
          />
          <KPICard
            label="Active Stories"
            value={totalPublishedStories.toString()}
            icon={<Film className="size-4" />}
            sublabel="In streaming catalog"
          />
        </div>

        {/* Additional Useful Metrics (Section 6) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3.5 rounded-2xl border border-border bg-card/60 backdrop-blur-sm">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Creators Added This Month
            </span>
            <p className="font-display text-lg text-foreground font-semibold">
              +{creators.filter((c) => c.joinedAt.includes("Sep 2026")).length}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Stories Submitted
            </span>
            <p className="font-display text-lg text-foreground font-semibold">
              {applications.length + 3}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Stories Published
            </span>
            <p className="font-display text-lg text-emerald-600 dark:text-emerald-400 font-semibold">
              {totalPublishedStories}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Platform Engagement
            </span>
            <p className="font-display text-lg text-foreground font-semibold">
              87.4%
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Total Creator Revenue
            </span>
            <p className="font-display text-lg text-foreground font-semibold">
              ₹58.9L
            </p>
          </div>
        </div>

        {/* Search, Filter Bar and Sorting */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[260px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search creator name, @username, email, or ID..."
                className="w-full rounded-xl border border-border bg-background pl-9 pr-8 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="VERIFIED">VERIFIED</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                  <option value="APPLIED">APPLIED</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">All Categories</option>
                  <option value="Drama">Drama</option>
                  <option value="Romance">Romance</option>
                  <option value="Thriller">Thriller</option>
                  <option value="Mystery">Mystery</option>
                  <option value="Sci-Fi">Sci-Fi</option>
                  <option value="Comedy">Comedy</option>
                </select>
              </div>

              {/* Verification Filter */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">Badge:</span>
                <select
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value)}
                  className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">All Verification</option>
                  <option value="Verified">Verified</option>
                  <option value="Verification Pending">Pending</option>
                  <option value="Not Verified">Not Verified</option>
                </select>
              </div>

              {/* Date Filter (Section 8) */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">Date:</span>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">All Time</option>
                  <option value="month">Joined This Month (Sep 2026)</option>
                  <option value="90days">Last 90 Days</option>
                  <option value="earlier">Earlier in 2026</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="followers">Most Followers</option>
                  <option value="views">Most Views</option>
                  <option value="stories">Most Stories</option>
                  <option value="revenue">Highest Revenue</option>
                  <option value="name">Alphabetical</option>
                </select>
              </div>

              {(search || statusFilter || categoryFilter || verificationFilter || dateFilter) && (
                <button
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("");
                    setCategoryFilter("");
                    setVerificationFilter("");
                    setDateFilter("");
                  }}
                  className="rounded-xl border border-border bg-muted/40 px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Creator List Data Table */}
        <DataTable
          data={filteredCreators}
          columns={columns}
          getRowKey={(c) => c.id}
          pageSize={10}
          emptyMessage="No creators found matching your search and filter criteria."
        />
      </div>

      {/* =========================================================================
          VERIFICATION CONFIRMATION MODAL (Section 22)
          ========================================================================= */}
      {verifyModalCreator && (
        <AdminModal
          open={!!verifyModalCreator}
          onClose={() => setVerifyModalCreator(null)}
          title="Verify Creator Identity"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/30 bg-primary/5">
              <ShieldCheck className="size-8 text-primary shrink-0" />
              <div>
                <p className="font-semibold text-sm text-foreground">
                  Verify {verifyModalCreator.name}?
                </p>
                <p className="text-xs text-muted-foreground">
                  This will award the official verified checkmark to <span className="font-mono">{verifyModalCreator.username}</span> and unlock high-trust creator operations.
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Before proceeding, ensure KYC verification, official government ID documents, and intellectual property attestations have been recorded in the platform records.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <AdminButton
                variant="secondary"
                size="sm"
                onClick={() => setVerifyModalCreator(null)}
              >
                Cancel
              </AdminButton>
              <AdminButton
                variant="primary"
                size="sm"
                onClick={() => {
                  verifyCreator(verifyModalCreator.id, currentUser?.name || "Super Admin");
                  setVerifyModalCreator(null);
                }}
              >
                <CheckCircle className="size-3.5" /> Confirm Verification
              </AdminButton>
            </div>
          </div>
        </AdminModal>
      )}

      {/* =========================================================================
          SUSPEND CREATOR MODAL (Section 23)
          ========================================================================= */}
      {suspendModalCreator && (
        <AdminModal
          open={!!suspendModalCreator}
          onClose={() => setSuspendModalCreator(null)}
          title={`Suspend Creator: ${suspendModalCreator.name}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-400">
              Suspension immediately halts new story submissions and pauses monetisation payouts. Existing catalog episodes will remain visible under administrative review.
            </div>

            <FormField label="Suspension Category" required>
              <FormSelect
                value={suspendReasonCategory}
                onChange={setSuspendReasonCategory}
                options={[
                  { value: "Policy violation", label: "Policy violation" },
                  { value: "Content issue", label: "Content issue (inappropriate / offensive)" },
                  { value: "Copyright concern", label: "Copyright concern / DMCA" },
                  { value: "Quality review", label: "Quality review fail" },
                  { value: "Other", label: "Other" },
                ]}
              />
            </FormField>

            <FormField label="Reason & Administrative Notes" required>
              <FormTextarea
                value={suspendNotes}
                onChange={setSuspendNotes}
                placeholder="Explain the specific trigger, policy clause, or incident report..."
                rows={3}
              />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <AdminButton
                variant="secondary"
                size="sm"
                onClick={() => setSuspendModalCreator(null)}
              >
                Cancel
              </AdminButton>
              <AdminButton
                variant="danger"
                size="sm"
                disabled={!suspendNotes.trim()}
                onClick={() => {
                  suspendCreator(
                    suspendModalCreator.id,
                    `${suspendReasonCategory}: ${suspendNotes.trim()}`,
                    currentUser?.name || "Super Admin"
                  );
                  setSuspendModalCreator(null);
                }}
              >
                <Ban className="size-3.5" /> Suspend Creator
              </AdminButton>
            </div>
          </div>
        </AdminModal>
      )}

      {/* =========================================================================
          REACTIVATE CREATOR MODAL (Section 24)
          ========================================================================= */}
      {reactivateModalCreator && (
        <AdminModal
          open={!!reactivateModalCreator}
          onClose={() => setReactivateModalCreator(null)}
          title="Reactivate Creator Account"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              Are you sure you want to reactivate <span className="font-semibold text-primary">{reactivateModalCreator.name}</span>?
            </p>
            {reactivateModalCreator.suspensionReason && (
              <div className="p-3 rounded-xl border border-border bg-muted/20 text-xs text-muted-foreground">
                <span className="font-bold text-foreground">Previous suspension reason:</span>{" "}
                {reactivateModalCreator.suspensionReason}
              </div>
            )}
            <p className="text-xs text-muted-foreground leading-relaxed">
              Reactivating will restore status to <span className="text-emerald-600 dark:text-emerald-400 font-semibold">ACTIVE</span> and re-enable story creation and payout scheduling.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <AdminButton
                variant="secondary"
                size="sm"
                onClick={() => setReactivateModalCreator(null)}
              >
                Cancel
              </AdminButton>
              <AdminButton
                variant="primary"
                size="sm"
                onClick={() => {
                  reactivateCreator(reactivateModalCreator.id, currentUser?.name || "Super Admin");
                  setReactivateModalCreator(null);
                }}
              >
                <RotateCcw className="size-3.5" /> Confirm Reactivate
              </AdminButton>
            </div>
          </div>
        </AdminModal>
      )}
    </AdminPage>
  );
}
