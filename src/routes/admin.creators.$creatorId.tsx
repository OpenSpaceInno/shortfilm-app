import { useState } from "react";
import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Ban,
  BarChart3,
  CheckCircle,
  Clapperboard,
  Clock,
  Coins,
  Crown,
  Edit3,
  ExternalLink,
  Eye,
  FileCheck2,
  Film,
  Globe,
  Layers,
  MessageSquare,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPage } from "@/components/admin-layout";
import {
  ActionMenu,
  AdminButton,
  AdminModal,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  KPICard,
  StatusBadge,
} from "@/components/admin-components";
import { useAdmin } from "@/lib/admin-state";
import { useAdminCreators } from "@/lib/admin-creators-state";

export const Route = createFileRoute("/admin/creators/$creatorId")({
  head: () => ({
    meta: [
      { title: "Creator Profile — ShortReel Admin" },
    ],
  }),
  component: AdminCreatorDetailLayout,
});

function AdminCreatorDetailLayout() {
  const { creatorId } = Route.useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAdmin();
  const {
    getCreator,
    getCreatorStories,
    getCreatorSubmissions,
    getCreatorEarnings,
    getCreatorActivity,
    verifyCreator,
    suspendCreator,
    reactivateCreator,
    updateCreatorProfile,
    addInternalNote,
  } = useAdminCreators();

  const creator = getCreator(creatorId);

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReasonCategory, setSuspendReasonCategory] = useState("Policy violation");
  const [suspendNotes, setSuspendNotes] = useState("");
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");

  // Edit form state
  const [editName, setEditName] = useState(creator?.name || "");
  const [editBio, setEditBio] = useState(creator?.bio || "");
  const [editCategory, setEditCategory] = useState(creator?.category || "Drama");
  const [editLocation, setEditLocation] = useState(creator?.location || "");
  const [editWebsite, setEditWebsite] = useState(creator?.website || "");

  if (!creator) {
    return (
      <AdminPage title="Creator Not Found">
        <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-4">
          <p className="text-muted-foreground text-sm">
            No creator profile matches identifier <span className="font-mono text-foreground font-semibold">{creatorId}</span>.
          </p>
          <Link
            to="/admin/creators"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <ArrowLeft className="size-4" /> Back to Creator Management
          </Link>
        </div>
      </AdminPage>
    );
  }

  const creatorStories = getCreatorStories(creator.id);
  const creatorSubmissions = getCreatorSubmissions(creator.id);
  const creatorEarnings = getCreatorEarnings(creator.id);
  const creatorActivity = getCreatorActivity(creator.id);

  // Tab items
  const tabs = [
    { label: "Overview", to: `/admin/creators/${creator.id}`, exact: true, icon: Sparkles },
    { label: "Profile", to: `/admin/creators/${creator.id}/profile`, icon: User },
    { label: `Stories (${creatorStories.length || creator.stories})`, to: `/admin/creators/${creator.id}/stories`, icon: Film },
    { label: `Submissions (${creatorSubmissions.length})`, to: `/admin/creators/${creator.id}/submissions`, icon: FileCheck2 },
    { label: "Analytics", to: `/admin/creators/${creator.id}/analytics`, icon: BarChart3 },
    { label: "Earnings", to: `/admin/creators/${creator.id}/earnings`, icon: Coins },
    { label: `Activity (${creatorActivity.length})`, to: `/admin/creators/${creator.id}/activity`, icon: Clock },
  ];

  return (
    <AdminPage
      title={creator.name}
      subtitle={`Creator operations for ${creator.username} · Joined ${creator.joinedAt}`}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/admin/creators"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Creators List</span>
          </Link>

          <Link
            to="/creator/$id"
            params={{ id: creator.id }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <Globe className="size-3.5" />
            <span>View Public Profile</span>
          </Link>

          <Link
            to="/creator/studio"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <Clapperboard className="size-3.5" />
            <span>Creator Studio</span>
          </Link>

          <AdminButton
            variant="secondary"
            size="sm"
            onClick={() => {
              setEditName(creator.name);
              setEditBio(creator.bio);
              setEditCategory(creator.category);
              setEditLocation(creator.location);
              setEditWebsite(creator.website);
              setShowEditModal(true);
            }}
          >
            <Edit3 className="size-3.5" /> Edit Profile
          </AdminButton>

          <AdminButton
            variant="secondary"
            size="sm"
            onClick={() => setShowNoteModal(true)}
          >
            <MessageSquare className="size-3.5" /> Add Note
          </AdminButton>

          {creator.verificationStatus !== "Verified" ? (
            <AdminButton
              variant="primary"
              size="sm"
              onClick={() => setShowVerifyModal(true)}
            >
              <ShieldCheck className="size-3.5" /> Verify Creator
            </AdminButton>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-xl bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 text-xs font-semibold text-purple-300">
              <ShieldCheck className="size-3.5" /> Verified Account
            </span>
          )}

          {creator.status !== "SUSPENDED" ? (
            <AdminButton
              variant="danger"
              size="sm"
              onClick={() => {
                setSuspendNotes("");
                setShowSuspendModal(true);
              }}
            >
              <Ban className="size-3.5" /> Suspend
            </AdminButton>
          ) : (
            <AdminButton
              variant="primary"
              size="sm"
              onClick={() => setShowReactivateModal(true)}
            >
              <RotateCcw className="size-3.5" /> Reactivate
            </AdminButton>
          )}

          {/* Section 31: Creator Detail Action Menu */}
          <ActionMenu
            actions={[
              {
                label: "Edit Creator",
                onClick: () => {
                  setEditName(creator.name);
                  setEditBio(creator.bio);
                  setEditCategory(creator.category);
                  setEditLocation(creator.location);
                  setEditWebsite(creator.website);
                  setShowEditModal(true);
                },
              },
              ...(creator.verificationStatus !== "Verified"
                ? [
                    {
                      label: "Verify Creator",
                      onClick: () => setShowVerifyModal(true),
                    },
                  ]
                : []),
              ...(creator.status !== "SUSPENDED"
                ? [
                    {
                      label: "Suspend Creator",
                      danger: true,
                      onClick: () => {
                        setSuspendNotes("");
                        setShowSuspendModal(true);
                      },
                    },
                  ]
                : [
                    {
                      label: "Reactivate Creator",
                      onClick: () => setShowReactivateModal(true),
                    },
                  ]),
              {
                label: "View Public Profile",
                onClick: () => navigate({ to: "/creator/$id", params: { id: creator.id } }),
              },
              {
                label: "View Creator Studio",
                onClick: () => navigate({ to: "/creator/studio" }),
              },
              {
                label: "View Stories",
                onClick: () => navigate({ to: "/admin/creators/$creatorId/stories", params: { creatorId: creator.id } }),
              },
              {
                label: "View Analytics",
                onClick: () => navigate({ to: "/admin/creators/$creatorId/analytics", params: { creatorId: creator.id } }),
              },
              {
                label: "View Earnings",
                onClick: () => navigate({ to: "/admin/creators/$creatorId/earnings", params: { creatorId: creator.id } }),
              },
              {
                label: "View Activity",
                onClick: () => navigate({ to: "/admin/creators/$creatorId/activity", params: { creatorId: creator.id } }),
              },
              {
                label: "Add Internal Note",
                onClick: () => setShowNoteModal(true),
              },
            ]}
          />
        </div>
      }
    >
      <div className="space-y-6">
        {/* Creator Header Card (Section 11) */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* Cover image or decorative gradient */}
          <div className="h-32 w-full bg-gradient-to-r from-primary/30 via-accent/20 to-card relative">
            {creator.coverImage && (
              <img
                src={creator.coverImage}
                alt="Cover"
                className="w-full h-full object-cover opacity-40 mix-blend-overlay"
              />
            )}
          </div>

          <div className="px-6 pb-6 pt-0 relative">
            <div className="flex flex-wrap items-end justify-between gap-4 -mt-12 mb-4">
              <div className="flex items-end gap-4">
                <img
                  src={creator.avatar}
                  alt={creator.name}
                  className="size-24 rounded-2xl object-cover border-4 border-card shadow-xl shrink-0 bg-muted"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-display text-2xl tracking-wide text-foreground">
                      {creator.name}
                    </h2>
                    <span className="font-mono text-sm text-muted-foreground">
                      {creator.username}
                    </span>
                    <StatusBadge status={creator.status} />
                    <StatusBadge status={creator.verificationStatus} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {creator.category} · {creator.location} · Joined {creator.joinedAt}
                    {creator.verifiedBy && ` · Verified by ${creator.verifiedBy}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Suspension Alert if suspended */}
            {creator.status === "SUSPENDED" && (
              <div className="mb-4 rounded-xl border border-amber-200 dark:border-orange-500/40 bg-amber-50 dark:bg-orange-500/10 p-3.5 flex items-start gap-3 text-xs text-amber-800 dark:text-orange-300 shadow-xs">
                <ShieldAlert className="size-5 shrink-0 mt-0.5 text-amber-600 dark:text-orange-400" />
                <div>
                  <p className="font-bold text-amber-900 dark:text-orange-200 uppercase tracking-wider text-[11px]">
                    Account Under Administrative Suspension
                  </p>
                  <p className="mt-0.5 text-amber-800 dark:text-orange-300">
                    Reason: {creator.suspensionReason || "Administrative policy review"}
                    {creator.suspensionDate && ` (Logged on ${creator.suspensionDate})`}
                  </p>
                </div>
              </div>
            )}

            {/* Metrics Pills / Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-3 border-t border-border/60">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">Followers</span>
                <p className="font-display text-lg text-foreground">{creator.followers}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">Stories</span>
                <p className="font-display text-lg text-foreground">{creator.stories}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">Published</span>
                <p className="font-display text-lg text-emerald-600 dark:text-emerald-400 font-semibold">{creator.published}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">Lifetime Views</span>
                <p className="font-display text-lg text-foreground">{creator.views}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">Avg Engagement</span>
                <p className="font-display text-lg text-foreground">{creator.engagement}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">Revenue</span>
                <p className="font-display text-lg text-foreground font-semibold">{creator.revenue}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 7 Tabs Bar (Section 12) */}
        <div className="flex items-center gap-1 border-b border-border pb-px overflow-x-auto text-xs">
          {tabs.map((tab) => {
            const isActive = tab.exact
              ? location.pathname === tab.to || location.pathname === `${tab.to}/`
              : location.pathname.startsWith(tab.to);

            return (
              <Link
                key={tab.label}
                to={tab.to}
                className={`flex items-center gap-2 px-4 py-2.5 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="size-3.5" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Active Tab Content Area */}
        <div>
          <Outlet />
        </div>
      </div>

      {/* =========================================================================
          EDIT CREATOR PROFILE MODAL (Section 14)
          ========================================================================= */}
      {showEditModal && (
        <AdminModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          title={`Edit Creator Profile: ${creator.name}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            <FormField label="Display Name" required>
              <FormInput value={editName} onChange={setEditName} />
            </FormField>

            <FormField label="Bio / Narrative Statement">
              <FormTextarea value={editBio} onChange={setEditBio} rows={3} />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Primary Category">
                <FormSelect
                  value={editCategory}
                  onChange={setEditCategory}
                  options={[
                    { value: "Drama", label: "Drama" },
                    { value: "Romance", label: "Romance" },
                    { value: "Thriller", label: "Thriller" },
                    { value: "Mystery", label: "Mystery" },
                    { value: "Sci-Fi", label: "Sci-Fi" },
                    { value: "Comedy", label: "Comedy" },
                    { value: "Supernatural", label: "Supernatural" },
                  ]}
                />
              </FormField>

              <FormField label="Location">
                <FormInput value={editLocation} onChange={setEditLocation} />
              </FormField>
            </div>

            <FormField label="Website / Portfolio URL">
              <FormInput value={editWebsite} onChange={setEditWebsite} placeholder="https://..." />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <AdminButton variant="secondary" size="sm" onClick={() => setShowEditModal(false)}>
                Cancel
              </AdminButton>
              <AdminButton
                variant="primary"
                size="sm"
                onClick={() => {
                  updateCreatorProfile(
                    creator.id,
                    {
                      name: editName,
                      bio: editBio,
                      category: editCategory,
                      location: editLocation,
                      website: editWebsite,
                    },
                    currentUser?.name || "Admin"
                  );
                  setShowEditModal(false);
                }}
              >
                Save Profile
              </AdminButton>
            </div>
          </div>
        </AdminModal>
      )}

      {/* =========================================================================
          VERIFY CONFIRMATION MODAL (Section 22)
          ========================================================================= */}
      {showVerifyModal && (
        <AdminModal
          open={showVerifyModal}
          onClose={() => setShowVerifyModal(false)}
          title="Verify Creator Identity"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              Verify <span className="font-semibold text-primary">{creator.name}</span> ({creator.username})?
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This will mark the creator as verified on ShortReel, render the verified badge across series cards and consumer profile screens, and log verification metadata.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <AdminButton variant="secondary" size="sm" onClick={() => setShowVerifyModal(false)}>
                Cancel
              </AdminButton>
              <AdminButton
                variant="primary"
                size="sm"
                onClick={() => {
                  verifyCreator(creator.id, currentUser?.name || "Super Admin");
                  setShowVerifyModal(false);
                }}
              >
                <CheckCircle className="size-3.5" /> Verify Creator
              </AdminButton>
            </div>
          </div>
        </AdminModal>
      )}

      {/* =========================================================================
          SUSPEND CREATOR MODAL (Section 23)
          ========================================================================= */}
      {showSuspendModal && (
        <AdminModal
          open={showSuspendModal}
          onClose={() => setShowSuspendModal(false)}
          title={`Suspend Creator: ${creator.name}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <FormField label="Reason Category" required>
              <FormSelect
                value={suspendReasonCategory}
                onChange={setSuspendReasonCategory}
                options={[
                  { value: "Policy violation", label: "Policy violation" },
                  { value: "Content issue", label: "Content issue" },
                  { value: "Copyright concern", label: "Copyright concern" },
                  { value: "Quality review", label: "Quality review" },
                  { value: "Other", label: "Other" },
                ]}
              />
            </FormField>

            <FormField label="Administrative Reason / Notes" required>
              <FormTextarea
                value={suspendNotes}
                onChange={setSuspendNotes}
                placeholder="Document specific grounds for suspension..."
                rows={3}
              />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <AdminButton variant="secondary" size="sm" onClick={() => setShowSuspendModal(false)}>
                Cancel
              </AdminButton>
              <AdminButton
                variant="danger"
                size="sm"
                disabled={!suspendNotes.trim()}
                onClick={() => {
                  suspendCreator(
                    creator.id,
                    `${suspendReasonCategory}: ${suspendNotes.trim()}`,
                    currentUser?.name || "Super Admin"
                  );
                  setShowSuspendModal(false);
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
      {showReactivateModal && (
        <AdminModal
          open={showReactivateModal}
          onClose={() => setShowReactivateModal(false)}
          title="Reactivate Creator"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              Are you sure you want to reactivate <span className="font-semibold text-primary">{creator.name}</span>?
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This will restore their status to <span className="text-emerald-600 dark:text-emerald-400 font-semibold">ACTIVE</span> and allow publishing episodes and submitting stories.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <AdminButton variant="secondary" size="sm" onClick={() => setShowReactivateModal(false)}>
                Cancel
              </AdminButton>
              <AdminButton
                variant="primary"
                size="sm"
                onClick={() => {
                  reactivateCreator(creator.id, currentUser?.name || "Super Admin");
                  setShowReactivateModal(false);
                }}
              >
                <RotateCcw className="size-3.5" /> Reactivate Creator
              </AdminButton>
            </div>
          </div>
        </AdminModal>
      )}

      {/* =========================================================================
          ADD INTERNAL NOTE MODAL (Section 32)
          ========================================================================= */}
      {showNoteModal && (
        <AdminModal
          open={showNoteModal}
          onClose={() => setShowNoteModal(false)}
          title="Add Internal Staff Note"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <FormField label="Internal Note" required>
              <FormTextarea
                value={noteText}
                onChange={setNoteText}
                placeholder="Enter confidential notes, review findings, or instructions..."
                rows={4}
              />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <AdminButton variant="secondary" size="sm" onClick={() => setShowNoteModal(false)}>
                Cancel
              </AdminButton>
              <AdminButton
                variant="primary"
                size="sm"
                disabled={!noteText.trim()}
                onClick={() => {
                  addInternalNote(creator.id, noteText.trim(), currentUser?.name || "Admin");
                  setNoteText("");
                  setShowNoteModal(false);
                }}
              >
                Save Note
              </AdminButton>
            </div>
          </div>
        </AdminModal>
      )}
    </AdminPage>
  );
}
