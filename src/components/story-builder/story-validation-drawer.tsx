import { AlertCircle, AlertTriangle, CheckCircle2, ShieldCheck, X } from "lucide-react";
import { AdminButton } from "@/components/admin-components";
import { type StoryValidationResult } from "@/lib/story-engine-data";

interface StoryValidationDrawerProps {
  open: boolean;
  onClose: () => void;
  validation: StoryValidationResult;
  onPublishStory: () => void;
}

export function StoryValidationDrawer({
  open,
  onClose,
  validation,
  onPublishStory,
}: StoryValidationDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed top-0 right-0 z-50 h-screen w-full max-w-md bg-card/95 backdrop-blur-md border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4 bg-muted/20">
        <div className="flex items-center gap-2.5">
          <div
            className={`grid size-9 place-items-center rounded-xl font-bold text-xs shrink-0 ${
              validation.isValid
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            <ShieldCheck className="size-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">Story Validation Engine</h3>
            <p className="text-[11px] text-muted-foreground">Pre-publishing integrity check</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Overall Status Banner */}
        <div
          className={`p-4 rounded-2xl border ${
            validation.isValid
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2.5 mb-1">
            {validation.isValid ? (
              <CheckCircle2 className="size-4 text-emerald-400" />
            ) : (
              <AlertCircle className="size-4 text-red-400" />
            )}
            <span className="font-bold text-sm">
              {validation.isValid
                ? "All Story Checks Passed"
                : `${validation.errors.length} Critical Issue(s) Found`}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {validation.isValid
              ? "The interactive branch graph is topologically sound, navigable, and certified ready for broadcast."
              : "Unconnected nodes or broken destinations must be repaired before publishing to production."}
          </p>
        </div>

        {/* Errors list */}
        {validation.errors.length > 0 && (
          <div className="space-y-2">
            <p className="font-bold text-xs text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="size-3.5" /> Required Fixes
            </p>
            <div className="space-y-1.5">
              {validation.errors.map((err, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-300 flex items-start gap-2"
                >
                  <span className="font-mono text-red-400 font-bold shrink-0">#{i + 1}</span>
                  <span>{err}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings list */}
        {validation.warnings.length > 0 && (
          <div className="space-y-2">
            <p className="font-bold text-xs text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="size-3.5" /> Editorial Advisories
            </p>
            <div className="space-y-1.5">
              {validation.warnings.map((warn, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-300 flex items-start gap-2"
                >
                  <span className="font-mono text-amber-400 font-bold shrink-0">!</span>
                  <span>{warn}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Passed Checks list */}
        <div className="space-y-2">
          <p className="font-bold text-xs text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5" /> Verified Rules ({validation.passedChecks.length})
          </p>
          <div className="space-y-1.5">
            {validation.passedChecks.map((chk, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl border border-border bg-card/60 text-xs text-muted-foreground flex items-center gap-2"
              >
                <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                <span className="text-foreground">{chk}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border p-4 bg-muted/20 flex items-center justify-between gap-3">
        <AdminButton variant="secondary" size="sm" onClick={onClose}>
          Close
        </AdminButton>
        <AdminButton
          variant="primary"
          size="sm"
          disabled={!validation.isValid}
          onClick={() => {
            onPublishStory();
            onClose();
          }}
        >
          {validation.isValid ? "Publish Story to Live" : "Resolve Issues to Publish"}
        </AdminButton>
      </div>
    </div>
  );
}
