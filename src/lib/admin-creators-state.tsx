import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  type AdminCreatorFull,
  type CreatorApplication,
  type CreatorSubmission,
  type CreatorEarningTransaction,
  type CreatorActivityEvent,
  type CreatorStoryItem,
  type CreatorSubmissionChecklist,
  initialCreators,
  initialApplications,
  initialSubmissions,
  mockEarningsTransactions,
  mockActivities,
  mockCreatorStories,
} from "./admin-creators-data";
import { auditLog, type AdminRole } from "./admin-data";
import { adminApi } from "./api-client";

interface AdminCreatorsContextType {
  creators: AdminCreatorFull[];
  applications: CreatorApplication[];
  submissions: CreatorSubmission[];
  earnings: Record<string, CreatorEarningTransaction[]>;
  activities: Record<string, CreatorActivityEvent[]>;
  stories: Record<string, CreatorStoryItem[]>;

  // Lookup helpers
  getCreator: (id: string) => AdminCreatorFull | undefined;
  getCreatorStories: (creatorId: string) => CreatorStoryItem[];
  getCreatorSubmissions: (creatorId: string) => CreatorSubmission[];
  getCreatorEarnings: (creatorId: string) => CreatorEarningTransaction[];
  getCreatorActivity: (creatorId: string) => CreatorActivityEvent[];
  getApplication: (appId: string) => CreatorApplication | undefined;
  getSubmission: (subId: string) => CreatorSubmission | undefined;

  // Lifecycle & Management Actions
  verifyCreator: (creatorId: string, actor?: string) => void;
  suspendCreator: (creatorId: string, reason: string, actor?: string) => void;
  reactivateCreator: (creatorId: string, actor?: string) => void;
  approveCreator: (creatorId: string, actor?: string) => void;
  rejectCreator: (creatorId: string, reason?: string, actor?: string) => void;
  updateCreatorProfile: (creatorId: string, updates: Partial<AdminCreatorFull>, actor?: string) => void;
  addInternalNote: (creatorId: string, noteText: string, author?: string) => void;

  // Application & Submission Actions
  reviewApplication: (
    applicationId: string,
    decision: "Approved" | "Rejected" | "Changes Requested",
    notes: string,
    actor?: string
  ) => void;
  reviewSubmission: (
    submissionId: string,
    decision: "Approved" | "Rejected" | "Changes Requested",
    checklist?: CreatorSubmissionChecklist,
    notes?: string,
    actor?: string
  ) => void;
}

const AdminCreatorsContext = createContext<AdminCreatorsContextType | null>(null);

export function AdminCreatorsProvider({ children }: { children: ReactNode }) {
  const [creators, setCreators] = useState<AdminCreatorFull[]>(initialCreators);
  const [applications, setApplications] = useState<CreatorApplication[]>(initialApplications);
  const [submissions, setSubmissions] = useState<CreatorSubmission[]>(initialSubmissions);
  const [earnings] = useState<Record<string, CreatorEarningTransaction[]>>(mockEarningsTransactions);
  const [activities, setActivities] = useState<Record<string, CreatorActivityEvent[]>>(mockActivities);
  const [stories] = useState<Record<string, CreatorStoryItem[]>>(mockCreatorStories);

  // Helper to record an activity event and platform audit log
  const recordEvent = useCallback(
    (creatorId: string, action: string, description: string, actor: string = "Super Admin") => {
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

      const newEvent: CreatorActivityEvent = {
        id: `act-${Date.now()}`,
        creatorId,
        date: dateStr,
        time: timeStr,
        action,
        actor,
        description,
      };

      setActivities((prev) => ({
        ...prev,
        [creatorId]: [newEvent, ...(prev[creatorId] || [])],
      }));

      // Append to shared platform audit log
      auditLog.unshift({
        id: `aud-${Date.now()}`,
        user: actor,
        role: (actor.includes("Admin") ? "Super Admin" : "Creator Manager") as AdminRole,
        action,
        entity: `Creator: ${creatorId}`,
        entityId: creatorId,
        timestamp: `${dateStr}, ${timeStr}`,
        status: action.includes("Reject") || action.includes("Suspend") ? "Warning" : "Success",
        details: description,
      });
    },
    []
  );

  const getCreator = useCallback(
    (id: string) => creators.find((c) => c.id === id || c.username.replace("@", "") === id.replace("@", "")),
    [creators]
  );

  const getCreatorStories = useCallback(
    (creatorId: string) => stories[creatorId] || [],
    [stories]
  );

  const getCreatorSubmissions = useCallback(
    (creatorId: string) => submissions.filter((s) => s.creatorId === creatorId),
    [submissions]
  );

  const getCreatorEarnings = useCallback(
    (creatorId: string) => earnings[creatorId] || [],
    [earnings]
  );

  const getCreatorActivity = useCallback(
    (creatorId: string) => activities[creatorId] || [],
    [activities]
  );

  const getApplication = useCallback(
    (appId: string) => applications.find((a) => a.id === appId),
    [applications]
  );

  const getSubmission = useCallback(
    (subId: string) => submissions.find((s) => s.id === subId),
    [submissions]
  );

  // 1. Verify Creator
  const verifyCreator = useCallback(
    (creatorId: string, actor: string = "Super Admin") => {
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

      setCreators((prev) =>
        prev.map((c) =>
          c.id === creatorId
            ? {
                ...c,
                status: c.status === "APPLIED" || c.status === "UNDER_REVIEW" ? "VERIFIED" : c.status,
                verificationStatus: "Verified",
                verifiedDate: dateStr,
                verifiedBy: actor,
              }
            : c
        )
      );

      recordEvent(creatorId, "Creator Verified", `Marked creator as verified on ShortReel by ${actor}.`, actor);
      toast.success("Creator successfully verified with official badge!");
    },
    [recordEvent]
  );

  // 2. Suspend Creator
  const suspendCreator = useCallback(
    (creatorId: string, reason: string, actor: string = "Super Admin") => {
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

      setCreators((prev) =>
        prev.map((c) =>
          c.id === creatorId
            ? {
                ...c,
                status: "SUSPENDED",
                suspensionReason: reason,
                suspensionDate: dateStr,
              }
            : c
        )
      );

      recordEvent(creatorId, "Creator Suspended", `Suspended due to: ${reason}`, actor);
      toast.error(`Creator account suspended. Reason: ${reason}`);
    },
    [recordEvent]
  );

  // 3. Reactivate Creator
  const reactivateCreator = useCallback(
    (creatorId: string, actor: string = "Super Admin") => {
      setCreators((prev) =>
        prev.map((c) => {
          if (c.id === creatorId) {
            const { suspensionReason: _sr, suspensionDate: _sd, ...rest } = c;
            return {
              ...rest,
              status: "ACTIVE" as const,
            };
          }
          return c;
        })
      );

      recordEvent(creatorId, "Creator Reactivated", "Account reactivated by administrator.", actor);
      toast.success("Creator account reactivated and restored to Active status.");
    },
    [recordEvent]
  );

  // 4. Approve Creator
  const approveCreator = useCallback(
    (creatorId: string, actor: string = "Super Admin") => {
      setCreators((prev) =>
        prev.map((c) =>
          c.id === creatorId
            ? {
                ...c,
                status: "APPROVED",
              }
            : c
        )
      );

      // Also update linked application if any
      setApplications((prev) =>
        prev.map((a) =>
          a.creatorId === creatorId ? { ...a, status: "Approved", reviewer: actor } : a
        )
      );

      recordEvent(creatorId, "Creator Approved", "Creator approved for content production.", actor);
      toast.success("Creator application and onboarding approved!");
    },
    [recordEvent]
  );

  // 5. Reject Creator
  const rejectCreator = useCallback(
    (creatorId: string, reason: string = "Incomplete portfolio", actor: string = "Creator Manager") => {
      setCreators((prev) =>
        prev.map((c) =>
          c.id === creatorId
            ? {
                ...c,
                status: "REJECTED",
              }
            : c
        )
      );

      setApplications((prev) =>
        prev.map((a) =>
          a.creatorId === creatorId ? { ...a, status: "Rejected", reviewer: actor, reviewerNotes: reason } : a
        )
      );

      recordEvent(creatorId, "Creator Rejected", `Rejected. Reason: ${reason}`, actor);
      toast.warning(`Creator rejected. Feedback noted.`);
    },
    [recordEvent]
  );

  // 6. Update Creator Profile
  const updateCreatorProfile = useCallback(
    (creatorId: string, updates: Partial<AdminCreatorFull>, actor: string = "Admin") => {
      setCreators((prev) =>
        prev.map((c) => (c.id === creatorId ? { ...c, ...updates } : c))
      );

      recordEvent(creatorId, "Profile Updated", "Profile metadata edited by admin.", actor);
      toast.success("Creator profile successfully updated!");
    },
    [recordEvent]
  );

  // 7. Add Internal Note
  const addInternalNote = useCallback(
    (creatorId: string, noteText: string, author: string = "Admin") => {
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

      const newNote = {
        id: `note-${Date.now()}`,
        creatorId,
        note: noteText,
        author,
        date: dateStr,
      };

      setCreators((prev) =>
        prev.map((c) =>
          c.id === creatorId
            ? { ...c, internalNotes: [newNote, ...(c.internalNotes || [])] }
            : c
        )
      );

      recordEvent(creatorId, "Internal Note Added", `Note added by ${author}: "${noteText.slice(0, 40)}..."`, author);
      toast.success("Internal note added.");
    },
    [recordEvent]
  );

  // 8. Review Application
  const reviewApplication = useCallback(
    (
      applicationId: string,
      decision: "Approved" | "Rejected" | "Changes Requested",
      notes: string,
      actor: string = "Super Admin"
    ) => {
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

      setApplications((prev) =>
        prev.map((a) =>
          a.id === applicationId
            ? {
                ...a,
                status: decision,
                reviewer: actor,
                reviewerNotes: notes,
                lastUpdated: dateStr,
              }
            : a
        )
      );

      const app = applications.find((a) => a.id === applicationId);
      if (app) {
        if (decision === "Approved") {
          setCreators((prev) =>
            prev.map((c) => (c.id === app.creatorId ? { ...c, status: "APPROVED" } : c))
          );
        } else if (decision === "Rejected") {
          setCreators((prev) =>
            prev.map((c) => (c.id === app.creatorId ? { ...c, status: "REJECTED" } : c))
          );
        }
        recordEvent(app.creatorId, `Application ${decision}`, `Decision: ${decision}. Notes: ${notes}`, actor);
      }

      toast.success(`Application marked as ${decision}.`);
    },
    [applications, recordEvent]
  );

  // 9. Review Submission
  const reviewSubmission = useCallback(
    (
      submissionId: string,
      decision: "Approved" | "Rejected" | "Changes Requested",
      checklist?: CreatorSubmissionChecklist,
      notes?: string,
      actor: string = "Content Admin"
    ) => {
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId
            ? {
                ...s,
                status: decision,
                reviewer: actor,
                lastUpdated: dateStr,
                checklist: checklist ? { ...s.checklist, ...checklist } : s.checklist,
                internalNotes: notes || s.internalNotes,
              }
            : s
        )
      );

      const sub = submissions.find((s) => s.id === submissionId);
      if (sub) {
        recordEvent(
          sub.creatorId,
          `Submission ${decision}`,
          `Story '${sub.storyTitle}' was marked as ${decision}. ${notes ? `Notes: ${notes}` : ""}`,
          actor
        );
      }

      // Backend submission queue review sync (P10.2)
      const actionKey = decision === "Approved" ? "approve" : decision === "Rejected" ? "reject" : "changes";
      adminApi.reviewSubmission(submissionId, actionKey, {
        notes,
        reason: notes || `Submission marked as ${decision}`,
        feedback: notes || `Editorial review: ${decision}`,
        requiredChanges: checklist ? Object.keys(checklist) : undefined,
      }).catch(() => {
        // Optimistic offline fallback
      });

      toast.success(`Submission marked as ${decision}!`);
    },
    [submissions, recordEvent]
  );

  const value = useMemo(
    () => ({
      creators,
      applications,
      submissions,
      earnings,
      activities,
      stories,
      getCreator,
      getCreatorStories,
      getCreatorSubmissions,
      getCreatorEarnings,
      getCreatorActivity,
      getApplication,
      getSubmission,
      verifyCreator,
      suspendCreator,
      reactivateCreator,
      approveCreator,
      rejectCreator,
      updateCreatorProfile,
      addInternalNote,
      reviewApplication,
      reviewSubmission,
    }),
    [
      creators,
      applications,
      submissions,
      earnings,
      activities,
      stories,
      getCreator,
      getCreatorStories,
      getCreatorSubmissions,
      getCreatorEarnings,
      getCreatorActivity,
      getApplication,
      getSubmission,
      verifyCreator,
      suspendCreator,
      reactivateCreator,
      approveCreator,
      rejectCreator,
      updateCreatorProfile,
      addInternalNote,
      reviewApplication,
      reviewSubmission,
    ]
  );

  return (
    <AdminCreatorsContext.Provider value={value}>
      {children}
    </AdminCreatorsContext.Provider>
  );
}

export function useAdminCreators() {
  const ctx = useContext(AdminCreatorsContext);
  if (!ctx) {
    throw new Error("useAdminCreators must be used within AdminCreatorsProvider");
  }
  return ctx;
}
