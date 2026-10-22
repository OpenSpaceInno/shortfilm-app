import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
  CheckCircle,
  FileCheck2,
  Film,
  GitBranch,
  Layers,
  Sparkles,
  User,
  Video,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  ActionMenu,
  AdminButton,
  AdminModal,
  type Column,
  DataTable,
  FormField,
  FormTextarea,
  SectionCard,
  StatusBadge,
} from "@/components/admin-components";
import { useAdmin } from "@/lib/admin-state";
import { useAdminCreators } from "@/lib/admin-creators-state";
import { type CreatorSubmission, type CreatorSubmissionChecklist } from "@/lib/admin-creators-data";

export const Route = createFileRoute("/admin/creators/$creatorId/submissions")({
  component: CreatorSubmissionsTab,
});

function CreatorSubmissionsTab() {
  const { creatorId } = Route.useParams();
  const { currentUser } = useAdmin();
  const { getCreator, getCreatorSubmissions, reviewSubmission } = useAdminCreators();

  const creator = getCreator(creatorId);
  const [reviewingSub, setReviewingSub] = useState<CreatorSubmission | null>(null);
  const [checklist, setChecklist] = useState<CreatorSubmissionChecklist | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  if (!creator) return null;

  const submissions = getCreatorSubmissions(creator.id);

  const handleOpenReview = (sub: CreatorSubmission) => {
    setReviewingSub(sub);
    setChecklist({ ...sub.checklist });
    setReviewNotes(sub.internalNotes || "");
  };

  const toggleChecklistItem = (key: keyof CreatorSubmissionChecklist) => {
    if (!checklist) return;
    setChecklist({ ...checklist, [key]: !checklist[key] });
  };

  const columns: Column<CreatorSubmission>[] = [
    {
      key: "submission",
      label: "Submission Title",
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary font-bold">
            <FileCheck2 className="size-4" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">{s.storyTitle}</p>
            <p className="text-[11px] text-muted-foreground">{s.type}</p>
          </div>
        </div>
      ),
    },
    {
      key: "submittedDate",
      label: "Submitted Date",
      render: (s) => <span className="text-xs text-muted-foreground">{s.submittedDate}</span>,
    },
    {
      key: "type",
      label: "Format",
      render: (s) => (
        <span className="rounded-lg bg-muted/40 px-2 py-0.5 text-xs text-foreground font-medium">
          {s.type}
        </span>
      ),
    },
    {
      key: "reviewer",
      label: "Reviewer",
      render: (s) => (
        <span className="text-xs text-muted-foreground">{s.reviewer || "Unassigned"}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (s) => <StatusBadge status={s.status} />,
    },
    {
      key: "lastUpdated",
      label: "Last Updated",
      render: (s) => <span className="text-[11px] text-muted-foreground">{s.lastUpdated}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      render: (s) => (
        <div className="flex items-center gap-2">
          <AdminButton
            variant="secondary"
            size="sm"
            onClick={() => handleOpenReview(s)}
          >
            Review Submission
          </AdminButton>
          <ActionMenu
            actions={[
              {
                label: "Approve Submission",
                onClick: () => {
                  reviewSubmission(s.id, "Approved", undefined, "Approved directly", currentUser?.name || "Admin");
                },
              },
              {
                label: "Request Changes",
                onClick: () => {
                  reviewSubmission(s.id, "Changes Requested", undefined, "Editorial requested revisions", currentUser?.name || "Admin");
                },
              },
              {
                label: "Reject Submission",
                danger: true,
                onClick: () => {
                  reviewSubmission(s.id, "Rejected", undefined, "Rejected by editorial review", currentUser?.name || "Admin");
                },
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SectionCard
        title={`Submissions & Pitches (${submissions.length})`}
        subtitle="Story proposals, season pitches, and pilot scripts under editorial evaluation"
      >
        <DataTable
          data={submissions}
          columns={columns}
          getRowKey={(s) => s.id}
          emptyMessage="This creator has not submitted any stories yet."
        />
      </SectionCard>

      {/* =========================================================================
          SUBMISSION REVIEW MODAL & CHECKLIST (Section 17)
          ========================================================================= */}
      {reviewingSub && checklist && (
        <AdminModal
          open={!!reviewingSub}
          onClose={() => setReviewingSub(null)}
          title={`Review Submission: ${reviewingSub.storyTitle}`}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-6">
            {/* Story Information */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-display text-xl text-foreground">{reviewingSub.storyTitle}</h3>
                  <p className="text-xs text-muted-foreground">
                    Creator: {reviewingSub.creatorName} · {reviewingSub.storyInfo.genre} · {reviewingSub.storyInfo.ageRating}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] rounded-full bg-primary/20 text-primary px-2.5 py-0.5 font-bold uppercase">
                    {reviewingSub.storyInfo.episodeCount} Episodes
                  </span>
                  {reviewingSub.storyInfo.interactive && (
                    <span className="text-[10px] rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-transparent px-2.5 py-0.5 font-bold uppercase shadow-xs">
                      Interactive: YES
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-foreground leading-relaxed">
                {reviewingSub.storyInfo.synopsis}
              </p>

              <div className="text-xs text-muted-foreground pt-1">
                <span className="font-semibold text-foreground">Target Audience:</span> {reviewingSub.storyInfo.targetAudience}
              </div>
            </div>

            {/* Content Preview & Structure */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Episodes Preview */}
              <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-2">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Episode List Preview
                </p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {reviewingSub.contentPreview.episodesPreview.map((ep) => (
                    <div
                      key={ep.number}
                      className="flex items-center justify-between p-2 rounded-lg border border-border/50 bg-background text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="size-5 grid place-items-center rounded bg-muted text-[10px] font-bold">
                          {ep.number}
                        </span>
                        <span className="font-medium text-foreground">{ep.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground">{ep.duration}</span>
                        {ep.isChoicePoint && (
                          <span className="text-[9px] rounded bg-purple-500/20 text-purple-300 px-1 py-0.5 font-bold uppercase">
                            Choice Point
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Characters & Interactive Points */}
              <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Characters & Interactive Decisions
                </p>
                <div className="space-y-1.5">
                  <span className="text-[11px] text-muted-foreground font-semibold">Key Characters</span>
                  <div className="flex flex-wrap gap-1.5">
                    {reviewingSub.contentPreview.characters.map((ch, idx) => (
                      <span key={idx} className="rounded-lg bg-card border border-border px-2 py-1 text-[11px] text-foreground">
                        <span className="font-semibold">{ch.name}</span> ({ch.role})
                      </span>
                    ))}
                  </div>
                </div>

                {reviewingSub.contentPreview.choicePoints.length > 0 && reviewingSub.contentPreview.choicePoints[0] && (
                  <div className="space-y-1.5 pt-2 border-t border-border/50 text-xs">
                    <span className="text-[11px] text-muted-foreground font-semibold">Sample Choice Node</span>
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-2 text-xs space-y-1">
                      <p className="font-semibold text-foreground">
                        Ep {reviewingSub.contentPreview.choicePoints[0]?.episode}: {reviewingSub.contentPreview.choicePoints[0]?.prompt}
                      </p>
                      <div className="flex gap-2 text-[11px] text-primary">
                        {reviewingSub.contentPreview.choicePoints[0]?.choices.map((c, i) => (
                          <span key={i} className="rounded bg-primary/10 px-2 py-0.5">
                            Branch {i + 1}: {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Review Checklist (Section 17) */}
            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Editorial Quality & Compliance Checklist
                </p>
                <span className="text-xs text-muted-foreground">
                  Toggle status: Pass vs Needs Attention
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {[
                  { key: "contentComplete" as const, label: "Content Complete" },
                  { key: "metadataComplete" as const, label: "Metadata Complete" },
                  { key: "thumbnailAvailable" as const, label: "Thumbnail Available" },
                  { key: "videoAvailable" as const, label: "Video Available (1080p)" },
                  { key: "storyStructureValid" as const, label: "Story Structure Valid" },
                  { key: "interactivePathsValid" as const, label: "Interactive Paths Valid" },
                  { key: "ageRatingSet" as const, label: "Age Rating Set" },
                  { key: "languageSet" as const, label: "Language & Subs Set" },
                  { key: "copyrightConfirmed" as const, label: "Copyright Confirmed" },
                ].map((item) => {
                  const passed = checklist[item.key];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleChecklistItem(item.key)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all shadow-xs cursor-pointer ${
                        passed
                          ? "border-emerald-200 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400"
                          : "border-amber-200 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400"
                      }`}
                    >
                      <span>{item.label}</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-card dark:bg-background/50 border border-border/60 shadow-xs">
                        {passed ? "Pass" : "Needs Attention"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Internal Review Notes */}
            <FormField label="Internal Editorial Notes & Feedback">
              <FormTextarea
                value={reviewNotes}
                onChange={setReviewNotes}
                placeholder="Enter feedback notes to return to creator..."
                rows={3}
              />
            </FormField>

            {/* Actions */}
            <div className="flex items-center justify-between border-t border-border pt-4 flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">
                Current status: <StatusBadge status={reviewingSub.status} />
              </span>

              <div className="flex items-center gap-2">
                <AdminButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    reviewSubmission(
                      reviewingSub.id,
                      "Changes Requested",
                      checklist,
                      reviewNotes,
                      currentUser?.name || "Content Admin"
                    );
                    setReviewingSub(null);
                  }}
                >
                  Request Changes
                </AdminButton>
                <AdminButton
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    reviewSubmission(
                      reviewingSub.id,
                      "Rejected",
                      checklist,
                      reviewNotes,
                      currentUser?.name || "Content Admin"
                    );
                    setReviewingSub(null);
                  }}
                >
                  <XCircle className="size-3.5" /> Reject Submission
                </AdminButton>
                <AdminButton
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    reviewSubmission(
                      reviewingSub.id,
                      "Approved",
                      checklist,
                      reviewNotes,
                      currentUser?.name || "Content Admin"
                    );
                    setReviewingSub(null);
                  }}
                >
                  <CheckCircle className="size-3.5" /> Approve Submission
                </AdminButton>
              </div>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
