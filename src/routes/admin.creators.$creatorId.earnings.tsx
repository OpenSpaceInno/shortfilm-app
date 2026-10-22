import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Coins,
  CreditCard,
  Download,
  Filter,
  PieChart,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  AdminButton,
  type Column,
  DataTable,
  KPICard,
  SectionCard,
  StatusBadge,
} from "@/components/admin-components";
import { useAdminCreators } from "@/lib/admin-creators-state";
import { type CreatorEarningTransaction } from "@/lib/admin-creators-data";

export const Route = createFileRoute("/admin/creators/$creatorId/earnings")({
  component: CreatorEarningsTab,
});

function CreatorEarningsTab() {
  const { creatorId } = Route.useParams();
  const { getCreator, getCreatorEarnings } = useAdminCreators();

  const [statusFilter, setStatusFilter] = useState("");
  const creator = getCreator(creatorId);
  if (!creator) return null;

  const transactions = getCreatorEarnings(creator.id);

  const filteredTx = statusFilter
    ? transactions.filter((t) => t.status === statusFilter)
    : transactions;

  const columns: Column<CreatorEarningTransaction>[] = [
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (t) => <span className="font-mono text-xs text-muted-foreground">{t.date}</span>,
    },
    {
      key: "story",
      label: "Story / Event",
      render: (t) => (
        <span className="font-semibold text-foreground text-xs">{t.story}</span>
      ),
    },
    {
      key: "revenueType",
      label: "Revenue Type",
      render: (t) => (
        <span className="rounded-lg bg-muted/40 px-2 py-0.5 text-xs text-foreground font-medium">
          {t.revenueType}
        </span>
      ),
    },
    {
      key: "grossRevenue",
      label: "Gross Pool",
      render: (t) => <span className="text-xs text-muted-foreground">{t.grossRevenue}</span>,
    },
    {
      key: "creatorShare",
      label: "Creator Share",
      render: (t) => (
        <span className="font-semibold text-xs text-foreground">{t.creatorShare}</span>
      ),
    },
    {
      key: "status",
      label: "Payout Status",
      render: (t) => <StatusBadge status={t.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Disclaimer banner */}
      <div className="rounded-xl border border-border bg-muted/20 p-3.5 flex items-center justify-between flex-wrap gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary shrink-0" />
          <span>
            <strong className="text-foreground">Mock Financial Operations UI:</strong> Contractual revenue sharing model: 55% Creator / 45% ShortReel Platform. Payouts scheduled bi-weekly.
          </span>
        </div>
        <button
          onClick={() => toast.info(`Exported earnings statement for ${creator.name}`)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors"
        >
          <Download className="size-3" /> Export Statement
        </button>
      </div>

      {/* Top Financial KPI Metrics (Section 20) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPICard label="Total Lifetime Earnings" value={creator.revenue} icon={<Coins className="size-4 text-emerald-600 dark:text-emerald-400" />} />
        <KPICard label="Current Month" value="₹1,32,000" icon={<TrendingUp className="size-4" />} sublabel="September 2026" />
        <KPICard label="Previous Month" value="₹1,18,500" icon={<TrendingUp className="size-4" />} sublabel="August 2026" />
        <KPICard label="Pending Payout" value="₹1,50,000" icon={<CreditCard className="size-4 text-amber-600 dark:text-amber-400" />} sublabel="Next cycle 30 Sep" />
        <KPICard label="Disbursed (Paid)" value="₹4,90,000" icon={<ShieldCheck className="size-4 text-primary" />} sublabel="Bank transfer" />
      </div>

      {/* Revenue Breakdown by Source */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase">Subscription Pool Share</span>
          <p className="font-display text-xl text-foreground">62%</p>
          <p className="text-[11px] text-muted-foreground">VIP subscriber watch-time attribution</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase">Ad / Content Revenue</span>
          <p className="font-display text-xl text-foreground">24%</p>
          <p className="text-[11px] text-muted-foreground">Free tier vertical pre-roll monetization</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase">Interactive & Choice Bonuses</span>
          <p className="font-display text-xl text-foreground">10%</p>
          <p className="text-[11px] text-muted-foreground">High branch engagement bonus pool</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase">Production Grants & Other</span>
          <p className="font-display text-xl text-foreground">4%</p>
          <p className="text-[11px] text-muted-foreground">Initial episode script options</p>
        </div>
      </div>

      {/* Transactions Ledger */}
      <SectionCard
        title="Revenue & Payout Ledger"
        subtitle="Individual episode allocations, revenue share accruals, and disbursement status"
        actions={
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
        }
      >
        <DataTable
          data={filteredTx}
          columns={columns}
          getRowKey={(t) => t.id}
          emptyMessage="No earnings records match the selected filter."
        />
      </SectionCard>
    </div>
  );
}
