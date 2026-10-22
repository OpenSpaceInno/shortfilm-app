import { useState, useMemo, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  X,
} from "lucide-react";
import type { ContentStatus, CreatorStatus, UserStatus, VideoProcessingStatus, NotificationStatus } from "@/lib/admin-data";

/* ==========================================================================
   1. STATUS BADGE — Colour-coded status indicators (High contrast light + dark)
   ========================================================================== */

type BadgeStatus = ContentStatus | CreatorStatus | UserStatus | VideoProcessingStatus | NotificationStatus | string;

const statusStyles: Record<string, string> = {
  Draft: "bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-500/15 dark:border-slate-500/30 dark:text-slate-400",
  "In Review": "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-400",
  Processing: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/15 dark:border-blue-500/30 dark:text-blue-400",
  Ready: "bg-teal-50 border-teal-200 text-teal-800 dark:bg-teal-500/15 dark:border-teal-500/30 dark:text-teal-400",
  Published: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-400",
  Scheduled: "bg-violet-50 border-violet-200 text-violet-800 dark:bg-violet-500/15 dark:border-violet-500/30 dark:text-violet-400",
  Archived: "bg-zinc-100 border-zinc-200 text-zinc-700 dark:bg-zinc-500/15 dark:border-zinc-500/30 dark:text-zinc-400",
  Failed: "bg-rose-50 border-rose-200 text-rose-800 dark:bg-red-500/15 dark:border-red-500/30 dark:text-red-400",
  Active: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-400",
  Inactive: "bg-zinc-100 border-zinc-200 text-zinc-700 dark:bg-zinc-500/15 dark:border-zinc-500/30 dark:text-zinc-400",
  Pending: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-400",
  Suspended: "bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-500/15 dark:border-orange-500/30 dark:text-orange-400",
  Blocked: "bg-rose-50 border-rose-200 text-rose-800 dark:bg-red-500/15 dark:border-red-500/30 dark:text-red-400",
  Rejected: "bg-rose-50 border-rose-200 text-rose-800 dark:bg-red-500/15 dark:border-red-500/30 dark:text-red-400",
  Uploaded: "bg-sky-50 border-sky-200 text-sky-800 dark:bg-sky-500/15 dark:border-sky-500/30 dark:text-sky-400",
  Sent: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-400",
  Success: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-400",
  Warning: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-400",

  // Creator Lifecycle Statuses (4C)
  APPLIED: "bg-sky-50 border-sky-200 text-sky-800 dark:bg-sky-500/15 dark:border-sky-500/30 dark:text-sky-400",
  UNDER_REVIEW: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-400",
  APPROVED: "bg-teal-50 border-teal-200 text-teal-800 dark:bg-teal-500/15 dark:border-teal-500/30 dark:text-teal-400",
  VERIFIED: "bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-500/15 dark:border-purple-500/30 dark:text-purple-300",
  ACTIVE: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-400",
  SUSPENDED: "bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-500/15 dark:border-orange-500/30 dark:text-orange-400",
  REJECTED: "bg-rose-50 border-rose-200 text-rose-800 dark:bg-red-500/15 dark:border-red-500/30 dark:text-red-400",
  DEACTIVATED: "bg-zinc-100 border-zinc-200 text-zinc-700 dark:bg-zinc-500/15 dark:border-zinc-500/30 dark:text-zinc-400",

  // Verification Statuses (4C)
  "Not Verified": "bg-zinc-100 border-zinc-200 text-zinc-700 dark:bg-zinc-500/15 dark:border-zinc-500/30 dark:text-zinc-400",
  "Verification Pending": "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-400",
  Verified: "bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-500/15 dark:border-purple-500/30 dark:text-purple-300",
  "Verification Expired": "bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-500/15 dark:border-orange-500/30 dark:text-orange-400",

  // Submissions & Applications (4C)
  Submitted: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/15 dark:border-blue-500/30 dark:text-blue-400",
  "Under Review": "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-400",
  Approved: "bg-teal-50 border-teal-200 text-teal-800 dark:bg-teal-500/15 dark:border-teal-500/30 dark:text-teal-400",
  "Changes Requested": "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-400",
  Paid: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-400",
  "On Hold": "bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-500/15 dark:border-orange-500/30 dark:text-orange-400",
};

export function StatusBadge({ status }: { status: BadgeStatus }) {
  const style = statusStyles[status] ?? "bg-muted/60 border-border text-muted-foreground";
  const isPulsing =
    status === "Published" ||
    status === "Active" ||
    status === "ACTIVE" ||
    status === "VERIFIED" ||
    status === "Verified" ||
    status === "Sent" ||
    status === "Success" ||
    status === "Ready";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${style}`}
    >
      <span
        className={`size-1.5 rounded-full ${
          isPulsing ? "bg-current animate-pulse" : "bg-current opacity-70"
        }`}
      />
      {status}
    </span>
  );
}

/* ==========================================================================
   2. KPI CARD — Dashboard metric display (Friendly, tactile, elevated)
   ========================================================================== */

export function KPICard({
  label,
  value,
  sublabel,
  trend,
  icon,
}: {
  label: string;
  value: string;
  sublabel?: string;
  trend?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md shadow-xs group">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{label}</p>
        {icon && (
          <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-xs">
            {icon}
          </div>
        )}
      </div>
      <p className="font-display text-3xl tracking-wide text-foreground mt-1.5">
        {value}
      </p>
      {(sublabel || trend) && (
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {trend && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-500/30 px-2 py-0.5 text-[11px] font-semibold">
              {trend}
            </span>
          )}
          {sublabel && (
            <span className="text-[11px] text-muted-foreground">{sublabel}</span>
          )}
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   3. SEARCH & FILTER BAR
   ========================================================================== */

export function SearchFilterBar({
  searchValue,
  onSearchChange,
  placeholder = "Search...",
  statusOptions,
  selectedStatus,
  onStatusChange,
  children,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  statusOptions?: string[];
  selectedStatus?: string;
  onStatusChange?: (status: string) => void;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-border/80 bg-card pl-9 pr-8 py-2 text-sm text-foreground shadow-xs placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
        />
        {searchValue && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Status Filter */}
      {statusOptions && onStatusChange && (
        <div className="flex items-center gap-1.5">
          <Filter className="size-3.5 text-muted-foreground" />
          <select
            value={selectedStatus ?? ""}
            onChange={(e) => onStatusChange(e.target.value)}
            className="rounded-xl border border-border/80 bg-card px-3 py-2 text-xs font-medium text-foreground shadow-xs focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      )}

      {children}
    </div>
  );
}

/* ==========================================================================
   4. DATA TABLE — Sortable, paginated (Clean elevated card wrapper)
   ========================================================================== */

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  getRowKey: (item: T) => string;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  bulkActions?: ReactNode;
  emptyMessage?: string;
}

export function DataTable<T>({
  data,
  columns,
  pageSize = 10,
  getRowKey,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  bulkActions,
  emptyMessage = "No data found",
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(data.length / pageSize);
  const pagedData = data.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleSelectAll = () => {
    if (!onSelectionChange) return;
    const allKeys = pagedData.map(getRowKey);
    if (allKeys.every((k) => selectedIds.includes(k))) {
      onSelectionChange(selectedIds.filter((id) => !allKeys.includes(id)));
    } else {
      onSelectionChange([...new Set([...selectedIds, ...allKeys])]);
    }
  };

  const toggleSelect = (id: string) => {
    if (!onSelectionChange) return;
    onSelectionChange(
      selectedIds.includes(id)
        ? selectedIds.filter((i) => i !== id)
        : [...selectedIds, id],
    );
  };

  const allSelected =
    pagedData.length > 0 && pagedData.every((item) => selectedIds.includes(getRowKey(item)));

  return (
    <div className="space-y-3">
      {/* Bulk actions bar */}
      {selectable && selectedIds.length > 0 && bulkActions && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2">
          <span className="text-xs font-semibold text-primary">
            {selectedIds.length} selected
          </span>
          <div className="h-4 w-px bg-border" />
          {bulkActions}
          <button
            onClick={() => onSelectionChange?.([])}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-xs">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-slate-50/80 dark:bg-muted/30">
              {selectable && (
                <th className="w-10 px-3 py-3">
                  <button
                    onClick={toggleSelectAll}
                    className={`grid size-4 place-items-center rounded border transition-colors cursor-pointer ${
                      allSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                  >
                    {allSelected && <Check className="size-3" />}
                  </button>
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground ${col.className ?? ""}`}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => handleSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
                    >
                      {col.label}
                      {sortKey === col.key ? (
                        sortDir === "asc" ? (
                          <ArrowUp className="size-3" />
                        ) : (
                          <ArrowDown className="size-3" />
                        )
                      ) : (
                        <ArrowUpDown className="size-3 opacity-40" />
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pagedData.map((item) => {
                const id = getRowKey(item);
                const isSelected = selectedIds.includes(id);
                return (
                  <tr
                    key={id}
                    className={`border-b border-border/60 transition-colors hover:bg-slate-50/70 dark:hover:bg-muted/30 ${
                      isSelected ? "bg-primary/5" : ""
                    }`}
                  >
                    {selectable && (
                      <td className="w-10 px-3 py-3">
                        <button
                          onClick={() => toggleSelect(id)}
                          className={`grid size-4 place-items-center rounded border transition-colors cursor-pointer ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-card hover:border-primary/50"
                          }`}
                        >
                          {isSelected && <Check className="size-3" />}
                        </button>
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-3 py-3 text-xs ${col.className ?? ""}`}
                      >
                        {col.render(item)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-card">
            <p className="text-xs text-muted-foreground">
              Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, data.length)} of{" "}
              {data.length}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="rounded-lg border border-border p-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="size-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`size-7 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    page === i
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page === totalPages - 1}
                className="rounded-lg border border-border p-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   5. MINI BAR CHART — Simple inline chart for analytics
   ========================================================================== */

export function MiniBarChart({
  data,
  height = 120,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] font-semibold text-foreground">
            {d.value >= 1000 ? `${(d.value / 1000).toFixed(0)}K` : d.value}
          </span>
          <div
            className="w-full rounded-t-md bg-gradient-to-t from-primary/90 to-primary/40 transition-all shadow-xs"
            style={{ height: `${(d.value / max) * (height - 30)}px`, minHeight: 4 }}
          />
          <span className="text-[10px] text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ==========================================================================
   6. ADMIN ACTION BUTTONS
   ========================================================================== */

export function AdminButton({
  children,
  variant = "primary",
  size = "sm",
  onClick,
  disabled,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer";
  const sizeClass = size === "md" ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs";
  const variantClass = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs hover:shadow-sm",
    secondary: "border border-border/80 bg-card text-foreground hover:bg-muted/60 shadow-xs",
    ghost: "text-muted-foreground hover:text-foreground hover:bg-muted/40",
    danger: "border border-rose-200 dark:border-red-500/30 bg-rose-50 dark:bg-red-500/10 text-rose-700 dark:text-red-400 hover:bg-rose-100 dark:hover:bg-red-500/20",
  }[variant];

  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${sizeClass} ${variantClass}`}>
      {children}
    </button>
  );
}

/* ==========================================================================
   7. SECTION CARD
   ========================================================================== */

export function SectionCard({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-xs hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg tracking-wide text-foreground">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

/* ==========================================================================
   8. ACTION MENU — Dropdown for row actions
   ========================================================================== */

export function ActionMenu({
  actions,
}: {
  actions: { label: string; onClick: () => void; danger?: boolean; disabled?: boolean }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg border border-border/80 bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shadow-xs cursor-pointer"
      >
        Actions ▾
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-border/80 bg-card shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150">
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={() => {
                  if (!action.disabled) {
                    action.onClick();
                    setOpen(false);
                  }
                }}
                disabled={action.disabled}
                className={`block w-full text-left px-3.5 py-1.5 text-xs transition-colors cursor-pointer ${
                  action.disabled
                    ? "text-muted-foreground/40 cursor-not-allowed"
                    : action.danger
                    ? "text-rose-700 dark:text-red-400 hover:bg-rose-50 dark:hover:bg-red-500/10"
                    : "text-foreground hover:bg-muted/50"
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ==========================================================================
   9. MODAL / DIALOG
   ========================================================================== */

export function AdminModal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm dark:bg-black/70"
        onClick={onClose}
      />
      <div
        className={`relative ${maxWidth} w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-border/80 bg-card shadow-2xl animate-in zoom-in-95 duration-150`}
      >
        <div className="flex items-center justify-between border-b border-border/80 px-6 py-4 bg-muted/20">
          <h2 className="font-display text-xl tracking-wide text-foreground">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ==========================================================================
   10. FORM FIELD
   ========================================================================== */

export function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
        {required && <span className="text-rose-600 dark:text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export function FormInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-border/80 bg-card px-3.5 py-2 text-sm text-foreground shadow-xs placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
    />
  );
}

export function FormTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-xl border border-border/80 bg-card px-3.5 py-2 text-sm text-foreground shadow-xs placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all leading-relaxed"
    />
  );
}

export function FormSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-border/80 bg-card px-3.5 py-2 text-sm text-foreground shadow-xs focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all cursor-pointer"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
