import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
  CheckCircle2,
  Coins,
  Crown,
  Lock,
  Plus,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  X,
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
  KPICard,
  SectionCard,
  StatusBadge,
} from "@/components/admin-components";
import { adminPlans, type AdminPlan } from "@/lib/admin-data";

export const Route = createFileRoute("/admin/subscriptions")({
  head: () => ({ meta: [{ title: "Subscriptions & Entitlements — ShortReel Admin" }] }),
  component: AdminSubscriptionsPage,
});

interface EntitlementRule {
  id: string;
  feature: string;
  description: string;
  freeTier: string;
  vipTier: string;
  status: "Active" | "Draft";
}

const initialEntitlements: EntitlementRule[] = [
  {
    id: "ent-1",
    feature: "Premium Episodes",
    description: "Access beyond the free teaser episodes",
    freeTier: "First 2 episodes only",
    vipTier: "Unlimited all episodes",
    status: "Active",
  },
  {
    id: "ent-2",
    feature: "Ad-Free Experience",
    description: "Uninterrupted vertical playback",
    freeTier: "Standard pre-roll & mid-roll ads",
    vipTier: "100% Ad-Free",
    status: "Active",
  },
  {
    id: "ent-3",
    feature: "Early Access",
    description: "Release window ahead of public drop",
    freeTier: "Standard schedule",
    vipTier: "48-Hour Early Access",
    status: "Active",
  },
  {
    id: "ent-4",
    feature: "Exclusive Interactive Content",
    description: "VIP-only story choices and secret director endings",
    freeTier: "Standard story branches",
    vipTier: "Secret endings & VIP choices",
    status: "Active",
  },
  {
    id: "ent-5",
    feature: "High Definition Streaming",
    description: "Maximum bitrate and resolution profile",
    freeTier: "720p HD",
    vipTier: "1080p FHD & 4K HDR",
    status: "Active",
  },
  {
    id: "ent-6",
    feature: "Story Prediction Bonus",
    description: "Multiplier for guessing story outcomes correctly",
    freeTier: "1x standard XP",
    vipTier: "2x Double XP + Golden Badge",
    status: "Active",
  },
];

function AdminSubscriptionsPage() {
  const [showEdit, setShowEdit] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AdminPlan | null>(null);
  const [entitlements, setEntitlements] = useState<EntitlementRule[]>(initialEntitlements);
  const [showNewEntitlement, setShowNewEntitlement] = useState(false);
  const [newEntFeature, setNewEntFeature] = useState("");
  const [newEntDesc, setNewEntDesc] = useState("");
  const [newEntFree, setNewEntFree] = useState("");
  const [newEntVip, setNewEntVip] = useState("");

  const columns: Column<AdminPlan>[] = [
    {
      key: "name",
      label: "Plan",
      render: (p) => (
        <div className="flex items-center gap-3 min-w-[180px]">
          <div
            className={`grid size-9 shrink-0 place-items-center rounded-xl font-display text-xs font-bold ${
              p.name === "VIP Monthly"
                ? "bg-amber-500/15 text-amber-400"
                : p.name === "VIP Annual"
                ? "bg-violet-500/15 text-violet-400"
                : p.name === "Student VIP"
                ? "bg-teal-500/15 text-teal-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {p.name === "Free" ? "F" : <Crown className="size-4" />}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm">{p.name}</p>
            <p className="text-[11px] text-muted-foreground">{p.duration}</p>
          </div>
        </div>
      ),
    },
    {
      key: "price",
      label: "Price",
      render: (p) => <span className="font-semibold text-foreground">{p.price}</span>,
    },
    {
      key: "subscribers",
      label: "Subscribers",
      render: (p) => <span className="text-foreground font-medium">{p.subscribers}</span>,
    },
    {
      key: "revenue",
      label: "Revenue",
      render: (p) => <span className="text-foreground font-medium text-xs">{p.revenue}</span>,
    },
    {
      key: "features",
      label: "Features",
      render: (p) => (
        <div className="flex flex-wrap gap-1">
          {p.features.slice(0, 3).map((f) => (
            <span
              key={f}
              className="text-[10px] rounded-full bg-muted/40 px-2 py-0.5 text-muted-foreground"
            >
              {f}
            </span>
          ))}
          {p.features.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{p.features.length - 3}</span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (p) => <StatusBadge status={p.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (p) => (
        <ActionMenu
          actions={[
            {
              label: "Edit Plan",
              onClick: () => {
                setEditingPlan(p);
                setShowEdit(true);
              },
            },
            {
              label: "View Subscribers",
              onClick: () => toast.info(`Viewing subscribers of ${p.name}`),
            },
            {
              label: p.status === "Active" ? "Deactivate" : "Activate",
              onClick: () => toast.success(`Updated: ${p.name}`),
            },
          ]}
        />
      ),
    },
  ];

  const handleCreateEntitlement = () => {
    if (!newEntFeature.trim()) {
      toast.error("Feature name is required.");
      return;
    }
    const newRule: EntitlementRule = {
      id: `ent-${Date.now()}`,
      feature: newEntFeature,
      description: newEntDesc || "Custom entitlement rule",
      freeTier: newEntFree || "Not available",
      vipTier: newEntVip || "Enabled",
      status: "Active",
    };
    setEntitlements([...entitlements, newRule]);
    setShowNewEntitlement(false);
    setNewEntFeature("");
    setNewEntDesc("");
    setNewEntFree("");
    setNewEntVip("");
    toast.success(`Entitlement "${newRule.feature}" created!`);
  };

  return (
    <AdminPage
      title="Subscriptions & Entitlements"
      subtitle="Manage subscription tiers, pricing, and VIP access permissions"
      actions={
        <AdminButton
          variant="primary"
          size="md"
          onClick={() => {
            setEditingPlan({
              id: `plan-${Date.now()}`,
              name: "New Tier",
              price: "₹149",
              duration: "Monthly",
              subscribers: "0",
              revenue: "₹0",
              status: "Active",
              features: ["Ad-Free", "Full Episodes", "HD 1080p"],
            });
            setShowEdit(true);
          }}
        >
          <Plus className="size-4" /> CREATE PLAN
        </AdminButton>
      }
    >
      <div className="space-y-6">
        {/* KPI Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard
            label="Total Plans"
            value={adminPlans.length.toString()}
            icon={<Users className="size-4" />}
          />
          <KPICard
            label="Active VIP Plans"
            value={adminPlans.filter((p) => p.status === "Active").length.toString()}
            icon={<Crown className="size-4" />}
          />
          <KPICard
            label="Monthly Revenue"
            value="₹18.7L"
            trend="+22.1%"
            icon={<Coins className="size-4" />}
          />
          <KPICard
            label="ARPU"
            value="₹42"
            trend="+5.2%"
            icon={<TrendingUp className="size-4" />}
          />
        </div>

        {/* Section 21: Subscription Plans */}
        <SectionCard title="Subscription Plans" subtitle="Configure pricing, billing cycle, and status">
          <DataTable data={adminPlans} columns={columns} getRowKey={(p) => p.id} />
        </SectionCard>

        {/* Section 22: Entitlements Management Interface */}
        <div id="entitlements" className="space-y-4">
          <SectionCard
            title="Entitlement Rules Matrix"
            subtitle="Define and control features unlocked by VIP subscription versus Free tiers"
            actions={
              <AdminButton
                variant="secondary"
                size="sm"
                onClick={() => setShowNewEntitlement(true)}
              >
                <Plus className="size-3" /> Add Entitlement
              </AdminButton>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-muted-foreground uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Feature Entitlement</th>
                    <th className="py-3 px-4">Free Tier Access</th>
                    <th className="py-3 px-4">VIP Tier Access</th>
                    <th className="py-3 px-4">Rule Status</th>
                    <th className="py-3 px-4 text-right">Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {entitlements.map((rule) => (
                    <tr key={rule.id} className="hover:bg-muted/10 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="grid size-7 place-items-center rounded bg-primary/10 text-primary">
                            <ShieldCheck className="size-4" />
                          </span>
                          <div>
                            <p className="font-semibold text-foreground text-sm">{rule.feature}</p>
                            <p className="text-[11px] text-muted-foreground">{rule.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground font-mono text-[11px]">
                        {rule.freeTier}
                      </td>
                      <td className="py-3.5 px-4 text-primary font-medium text-xs">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-primary/10">
                          <Crown className="size-3 text-primary" />
                          {rule.vipTier}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={rule.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = entitlements.map((r) =>
                              r.id === rule.id
                                ? { ...r, status: r.status === "Active" ? ("Draft" as const) : ("Active" as const) }
                                : r
                            );
                            setEntitlements(updated);
                            toast.success(`Entitlement "${rule.feature}" updated!`);
                          }}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                            rule.status === "Active"
                              ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {rule.status === "Active" ? "Enabled" : "Disabled"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Sparkles className="size-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    Prepared for Payment Gateway &amp; DRM Integration
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Entitlement tokens will automatically validate on playback via JWT session claims.
                  </p>
                </div>
              </div>
              <AdminButton
                variant="secondary"
                size="sm"
                onClick={() => toast.info("Syncing entitlements to consumer edge nodes...")}
              >
                Sync Rules
              </AdminButton>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Edit/Create Plan Modal */}
      <AdminModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title={`Edit Plan — ${editingPlan?.name}`}
      >
        <div className="space-y-4">
          <FormField label="Plan Name">
            <FormInput
              value={editingPlan?.name ?? ""}
              onChange={(v) =>
                setEditingPlan((prev) => (prev ? { ...prev, name: v } : null))
              }
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Price">
              <FormInput
                value={editingPlan?.price ?? ""}
                onChange={(v) =>
                  setEditingPlan((prev) => (prev ? { ...prev, price: v } : null))
                }
              />
            </FormField>
            <FormField label="Duration">
              <FormSelect
                value={editingPlan?.duration ?? "Monthly"}
                onChange={(v) =>
                  setEditingPlan((prev) => (prev ? { ...prev, duration: v } : null))
                }
                options={[
                  { value: "—", label: "N/A (Free)" },
                  { value: "Monthly", label: "Monthly" },
                  { value: "Annual", label: "Annual" },
                ]}
              />
            </FormField>
          </div>
          <FormField label="Status">
            <FormSelect
              value={editingPlan?.status ?? "Active"}
              onChange={(v) =>
                setEditingPlan((prev) =>
                  prev ? { ...prev, status: v as "Active" | "Inactive" } : null
                )
              }
              options={[
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
              ]}
            />
          </FormField>
          <div className="flex gap-3 pt-3 border-t border-border">
            <AdminButton
              variant="primary"
              size="md"
              onClick={() => {
                toast.success("Plan updated successfully!");
                setShowEdit(false);
              }}
            >
              SAVE CHANGES
            </AdminButton>
            <AdminButton variant="secondary" size="md" onClick={() => setShowEdit(false)}>
              Cancel
            </AdminButton>
          </div>
        </div>
      </AdminModal>

      {/* Create New Entitlement Modal */}
      <AdminModal
        open={showNewEntitlement}
        onClose={() => setShowNewEntitlement(false)}
        title="Add Entitlement Rule"
      >
        <div className="space-y-4">
          <FormField label="Feature Name" required>
            <FormInput
              value={newEntFeature}
              onChange={setNewEntFeature}
              placeholder="e.g. Offline Video Downloads"
            />
          </FormField>
          <FormField label="Description">
            <FormInput
              value={newEntDesc}
              onChange={setNewEntDesc}
              placeholder="e.g. Download episodes to mobile device for offline watch"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Free Tier Policy">
              <FormInput
                value={newEntFree}
                onChange={setNewEntFree}
                placeholder="e.g. Disabled"
              />
            </FormField>
            <FormField label="VIP Tier Policy">
              <FormInput
                value={newEntVip}
                onChange={setNewEntVip}
                placeholder="e.g. Up to 25 downloads"
              />
            </FormField>
          </div>
          <div className="flex gap-3 pt-3 border-t border-border">
            <AdminButton variant="primary" size="md" onClick={handleCreateEntitlement}>
              CREATE ENTITLEMENT
            </AdminButton>
            <AdminButton
              variant="secondary"
              size="md"
              onClick={() => setShowNewEntitlement(false)}
            >
              Cancel
            </AdminButton>
          </div>
        </div>
      </AdminModal>
    </AdminPage>
  );
}
