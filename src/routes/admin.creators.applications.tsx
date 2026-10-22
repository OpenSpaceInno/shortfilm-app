import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  FileCheck2,
  Filter,
  Globe,
  HelpCircle,
  MessageSquare,
  Search,
  Sparkles,
  User,
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
  FormSelect,
  FormTextarea,
  KPICard,
  SectionCard,
  StatusBadge,
} from "@/components/admin-components";
import { useAdmin } from "@/lib/admin-state";
import { useAdminCreators } from "@/lib/admin-creators-state";
import { type CreatorApplication } from "@/lib/admin-creators-data";

export const Route = createFileRoute("/admin/creators/applications")({
  head: () => ({
    meta: [
      { title: "Creator Applications — ShortReel Admin" },
      { name: "description", content: "Review and onboard new creators applying to ShortReel." },
    ],
  }),
  component: AdminCreatorApplicationsPage,
});

function AdminCreatorApplicationsPage() {
  const { currentUser } = useAdmin();
  const { applications, reviewApplication } = useAdminCreators();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedApp, setSelectedApp] = useState<CreatorApplication | null>(null);

  // Review drawer/modal decisions state
  const [decisionNotes, setDecisionNotes] = useState("");
  const [newInternalComment, setNewInternalComment] = useState("");
  const [confirmApproveModal, setConfirmApproveModal] = useState<CreatorApplication | null>(null);

  const filteredApps = applications.filter((a) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      a.applicantName.toLowerCase().includes(q) ||
      a.creatorName.toLowerCase().includes(q) ||
      a.username.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q);
    const matchStatus = !statusFilter || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = applications.filter((a) => a.status === "Pending").length;
  const underReviewCount = applications.filter((a) => a.status === "Under Review").length;
  const approvedCount = applications.filter((a) => a.status === "Approved").length;
  const rejectedCount = applications.filter((a) => a.status === "Rejected").length;

  const columns: Column<CreatorApplication>[] = [
    {
      key: "applicant",
      label: "Applicant",
      sortable: true,
      render: (a) => (
        <div className="min-w-[180px]">
          <p className="font-semibold text-foreground text-sm">{a.applicantName}</p>
          <p className="text-[11px] text-muted-foreground">{a.email}</p>
        </div>
      ),
    },
    {
      key: "creatorName",
      label: "Creator Profile",
      render: (a) => (
        <div>
          <p className="font-medium text-foreground text-xs">{a.creatorName}</p>
          <p className="font-mono text-[11px] text-muted-foreground">{a.username}</p>
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (a) => (
        <span className="inline-flex items-center rounded-lg bg-muted/40 px-2 py-0.5 text-xs font-medium text-foreground">
          {a.category}
        </span>
      ),
    },
    {
      key: "submittedDate",
      label: "Submitted",
      render: (a) => <span className="text-xs text-muted-foreground">{a.submittedDate}</span>,
    },
    {
      key: "portfolio",
      label: "Portfolio",
      render: (a) => (
        <a
          href={a.portfolio}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <span>View Link</span>
          <ExternalLink className="size-3" />
        </a>
      ),
    },
    {
      key: "followers",
      label: "Followers",
      render: (a) => <span className="text-xs font-medium text-foreground">{a.followers}</span>,
    },
    {
      key: "status",
      label: "Application Status",
      render: (a) => <StatusBadge status={a.status} />,
    },
    {
      key: "reviewer",
      label: "Reviewer",
      render: (a) => (
        <span className="text-xs text-muted-foreground">{a.reviewer || "Unassigned"}</span>
      ),
    },
    {
      key: "lastUpdated",
      label: "Updated",
      render: (a) => <span className="text-[11px] text-muted-foreground">{a.lastUpdated}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      render: (a) => (
        <div className="flex items-center gap-1.5">
          <AdminButton
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedApp(a);
              setDecisionNotes(a.reviewerNotes || "");
            }}
          >
            Review
          </AdminButton>
          <ActionMenu
            actions={[
              {
                label: "Approve Application",
                onClick: () => setConfirmApproveModal(a),
              },
              {
                label: "Request Changes",
                onClick: () => {
                  reviewApplication(a.id, "Changes Requested", "Editorial requested revisions", currentUser?.name || "Admin");
                },
              },
              {
                label: "Reject Application",
                danger: true,
                onClick: () => {
                  reviewApplication(a.id, "Rejected", "Does not meet current slate criteria", currentUser?.name || "Admin");
                },
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <AdminPage
      title="Creator Applications"
      subtitle="Review creator proposals, portfolios, and proposed vertical interactive concepts."
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/admin/creators"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Creators List</span>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard label="Pending Review" value={pendingCount.toString()} icon={<HelpCircle className="size-4" />} />
          <KPICard label="Under Editorial Review" value={underReviewCount.toString()} icon={<FileCheck2 className="size-4" />} />
          <KPICard label="Approved This Quarter" value={approvedCount.toString()} icon={<CheckCircle className="size-4" />} />
          <KPICard label="Rejected" value={rejectedCount.toString()} icon={<XCircle className="size-4" />} />
        </div>

        {/* Filter Bar */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search applicant name, email, or handle..."
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

            <div className="flex flex-wrap items-center gap-1.5">
              {["", "Pending", "Under Review", "Approved", "Changes Requested", "Rejected"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                    statusFilter === st
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  {st || "All Applications"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Applications Data Table */}
        <DataTable
          data={filteredApps}
          columns={columns}
          getRowKey={(a) => a.id}
          pageSize={10}
          emptyMessage="No creator applications match the current filter."
        />
      </div>

      {/* =========================================================================
          APPLICATION DETAIL & REVIEW MODAL (Section 10)
          ========================================================================= */}
      {selectedApp && (
        <AdminModal
          open={!!selectedApp}
          onClose={() => setSelectedApp(null)}
          title={`Application Review: ${selectedApp.creatorName}`}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-6">
            {/* Top applicant header */}
            <div className="flex items-center justify-between border-b border-border pb-4 flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-xl text-foreground">{selectedApp.creatorName}</h3>
                  <span className="font-mono text-xs text-muted-foreground">{selectedApp.username}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Applicant: {selectedApp.applicantName} ({selectedApp.email}) · Submitted {selectedApp.submittedDate}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedApp.status} />
              </div>
            </div>

            {/* Grid 1: Creator Information & Background */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">Creator Information</p>
                <div className="text-xs space-y-2">
                  <div>
                    <span className="text-muted-foreground">Bio:</span>
                    <p className="text-foreground mt-0.5 font-medium">{selectedApp.bio}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-muted-foreground">Location:</span>
                      <p className="text-foreground font-medium">{selectedApp.location}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Category:</span>
                      <p className="text-foreground font-medium">{selectedApp.category}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Languages:</span>
                    <p className="text-foreground font-medium">{selectedApp.languages.join(", ")}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Portfolio:</span>
                    <a
                      href={selectedApp.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline ml-2"
                    >
                      {selectedApp.portfolio}
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">Creator Background</p>
                <div className="text-xs space-y-2">
                  <div>
                    <span className="text-muted-foreground">Content Experience:</span>
                    <p className="text-foreground mt-0.5 font-medium">{selectedApp.experience}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Previous Work:</span>
                    <p className="text-foreground mt-0.5 font-medium">{selectedApp.previousWork}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Target Audience:</span>
                    <p className="text-foreground mt-0.5 font-medium">{selectedApp.targetAudience}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Proposed ShortReel Content */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Proposed ShortReel Concept: {selectedApp.proposedStory.title}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] rounded-full bg-primary/20 text-primary px-2.5 py-0.5 font-bold uppercase">
                    {selectedApp.proposedStory.format}
                  </span>
                  {selectedApp.proposedStory.interactive && (
                    <span className="text-[10px] rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-transparent px-2.5 py-0.5 font-bold uppercase shadow-xs">
                      Interactive: YES
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-foreground leading-relaxed">
                {selectedApp.proposedStory.concept}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/50 text-xs">
                <div>
                  <span className="text-muted-foreground text-[11px]">Genre</span>
                  <p className="font-semibold text-foreground">{selectedApp.proposedStory.genre}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px]">Episodes</span>
                  <p className="font-semibold text-foreground">{selectedApp.proposedStory.episodes} episodes</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px]">Cadence</span>
                  <p className="font-semibold text-foreground">{selectedApp.proposedStory.releaseFrequency}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px]">Audience</span>
                  <p className="font-semibold text-foreground truncate">{selectedApp.proposedStory.targetAudience}</p>
                </div>
              </div>
            </div>

            {/* Review Section: Notes & Comments */}
            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-xs font-bold text-foreground uppercase tracking-wider">Editorial Review & Feedback</p>

              <FormField label="Reviewer Assessment Notes">
                <FormTextarea
                  value={decisionNotes}
                  onChange={setDecisionNotes}
                  placeholder="Enter editorial notes, feedback, or justification for decision..."
                  rows={3}
                />
              </FormField>

              {/* Internal Comments List */}
              {selectedApp.internalComments && selectedApp.internalComments.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">Internal Staff Notes</span>
                  <div className="space-y-1">
                    {selectedApp.internalComments.map((note, idx) => (
                      <div key={idx} className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-foreground">
                        {note}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Final Actions */}
            <div className="flex items-center justify-between border-t border-border pt-4 flex-wrap gap-2">
              <span className="text-xs font-semibold text-muted-foreground">
                Assigned Reviewer: {selectedApp.reviewer || currentUser?.name || "Admin"}
              </span>

              <div className="flex items-center gap-2">
                <AdminButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    reviewApplication(selectedApp.id, "Changes Requested", decisionNotes, currentUser?.name || "Admin");
                    setSelectedApp(null);
                  }}
                >
                  Request Changes
                </AdminButton>
                <AdminButton
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    reviewApplication(selectedApp.id, "Rejected", decisionNotes, currentUser?.name || "Admin");
                    setSelectedApp(null);
                  }}
                >
                  <XCircle className="size-3.5" /> Reject Creator
                </AdminButton>
                <AdminButton
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setConfirmApproveModal(selectedApp);
                  }}
                >
                  <CheckCircle className="size-3.5" /> Approve Creator
                </AdminButton>
              </div>
            </div>
          </div>
        </AdminModal>
      )}

      {/* Confirmation Modal Before Approval (Section 10) */}
      {confirmApproveModal && (
        <AdminModal
          open={!!confirmApproveModal}
          onClose={() => setConfirmApproveModal(null)}
          title="Confirm Creator Approval"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl border border-primary/30 bg-primary/5">
              <p className="font-semibold text-sm text-foreground">
                Approve {confirmApproveModal.creatorName} for ShortReel?
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This will onboard the creator, mark their status as APPROVED, and grant production permissions for "{confirmApproveModal.proposedStory.title}".
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <AdminButton
                variant="secondary"
                size="sm"
                onClick={() => setConfirmApproveModal(null)}
              >
                Cancel
              </AdminButton>
              <AdminButton
                variant="primary"
                size="sm"
                onClick={() => {
                  reviewApplication(
                    confirmApproveModal.id,
                    "Approved",
                    decisionNotes || "Approved by administration.",
                    currentUser?.name || "Super Admin"
                  );
                  setConfirmApproveModal(null);
                  setSelectedApp(null);
                }}
              >
                <CheckCircle className="size-3.5" /> Confirm & Approve
              </AdminButton>
            </div>
          </div>
        </AdminModal>
      )}
    </AdminPage>
  );
}
