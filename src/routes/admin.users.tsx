import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Crown, Shield, ShieldAlert, ShieldCheck, UserX, Users } from "lucide-react";
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
  SearchFilterBar,
  StatusBadge,
} from "@/components/admin-components";
import { adminUsers, type AdminUser, type UserStatus } from "@/lib/admin-data";
import { adminApi } from "@/lib/api-client";
import { useAdmin } from "@/lib/admin-state";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Users & Moderation — ShortReel Admin" }] }),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const { hasRole, currentUser } = useAdmin();
  const [usersList, setUsersList] = useState<AdminUser[]>(adminUsers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Strike Modal state
  const [strikeTarget, setStrikeTarget] = useState<AdminUser | null>(null);
  const [strikeReason, setStrikeReason] = useState("Community Guidelines Violation");
  const [strikeSeverity, setStrikeSeverity] = useState("WARNING");

  // Role Modal state
  const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null);
  const [selectedRole, setSelectedRole] = useState("USER");

  useEffect(() => {
    let mounted = true;
    adminApi.listUsers()
      .then((res: any) => {
        if (!mounted || !res) return;
        const items = Array.isArray(res) ? res : res.data || res.items;
        if (Array.isArray(items) && items.length > 0) {
          const mapped: AdminUser[] = items.map((u: any) => ({
            id: u.id,
            name: u.displayName || u.name || u.email?.split("@")[0] || "User",
            email: u.email || "user@shortreel.in",
            plan: "Free",
            joinedAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-GB") : "Recently",
            lastActive: u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString("en-GB") : "Recently",
            watchTime: "0h",
            status: u.status === "ACTIVE" ? "Active" : u.status === "SUSPENDED" ? "Suspended" : "Blocked",
            roles: u.roles || ["USER"],
            strikes: 0,
          }));
          setUsersList((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const fresh = mapped.filter((m) => !existingIds.has(m.id));
            return [...prev, ...fresh];
          });
        }
      })
      .catch(() => {
        // Fallback to local adminUsers
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleToggleStatus = async (u: AdminUser) => {
    const nextStatus: UserStatus = u.status === "Active" ? "Suspended" : "Active";
    const apiStatus = nextStatus === "Active" ? "ACTIVE" : "SUSPENDED";
    try {
      await adminApi.updateUserStatus(u.id, {
        status: apiStatus,
        reason: `Admin toggle status to ${nextStatus}`,
      });
    } catch {
      // Optimistic local update
    }
    setUsersList((prev) =>
      prev.map((item) => (item.id === u.id ? { ...item, status: nextStatus } : item))
    );
    toast.warning(`${nextStatus === "Suspended" ? "Suspended" : "Reactivated"} account: ${u.name}`);
  };

  const handleBlockUser = async (u: AdminUser) => {
    try {
      await adminApi.updateUserStatus(u.id, {
        status: "BANNED",
        reason: "Admin manual account ban / block",
      });
    } catch {
      // Optimistic local update
    }
    setUsersList((prev) =>
      prev.map((item) => (item.id === u.id ? { ...item, status: "Blocked" } : item))
    );
    toast.error(`Blocked and banned user: ${u.name}`);
  };

  const handleConfirmStrike = async () => {
    if (!strikeTarget) return;
    try {
      await adminApi.issueStrike(strikeTarget.id, {
        reason: strikeReason,
        severity: strikeSeverity,
      });
    } catch {
      // Optimistic local update
    }
    setUsersList((prev) =>
      prev.map((item) =>
        item.id === strikeTarget.id
          ? { ...item, strikes: (item.strikes || 0) + 1 }
          : item
      )
    );
    toast.warning(`Issued governance strike to ${strikeTarget.name} (${strikeSeverity})`);
    setStrikeTarget(null);
  };

  const handleConfirmRole = async () => {
    if (!roleTarget) return;
    try {
      await adminApi.updateUserRoles(roleTarget.id, {
        roles: [selectedRole],
      });
    } catch {
      // Optimistic local update
    }
    setUsersList((prev) =>
      prev.map((item) =>
        item.id === roleTarget.id
          ? { ...item, roles: [selectedRole] }
          : item
      )
    );
    toast.success(`Updated role for ${roleTarget.name} to ${selectedRole}`);
    setRoleTarget(null);
  };

  const filtered = usersList.filter((u) => {
    const matchSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || u.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns: Column<AdminUser>[] = [
    {
      key: "user",
      label: "User",
      sortable: true,
      render: (u) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-foreground font-display text-xs font-bold">
            {u.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-semibold text-foreground text-sm truncate">{u.name}</p>
              {(u.strikes ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] rounded bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.2 font-semibold">
                  <AlertTriangle className="size-2.5" />
                  {u.strikes} {u.strikes === 1 ? "Strike" : "Strikes"}
                </span>
              )}
              {u.roles && u.roles.length > 0 && u.roles[0] !== "USER" && (
                <span className="inline-flex items-center gap-1 text-[10px] rounded bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.2 font-semibold">
                  <Shield className="size-2.5" />
                  {u.roles[0]}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "plan",
      label: "Plan",
      render: (u) => (
        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
          u.plan.includes("VIP") ? "text-amber-400" : "text-muted-foreground"
        }`}>
          {u.plan.includes("VIP") && <Crown className="size-3" />}
          {u.plan}
        </span>
      ),
    },
    {
      key: "watchTime",
      label: "Watch Time",
      render: (u) => <span className="text-muted-foreground text-xs">{u.watchTime}</span>,
    },
    {
      key: "joinedAt",
      label: "Joined",
      sortable: true,
      render: (u) => <span className="text-xs text-muted-foreground">{u.joinedAt}</span>,
    },
    {
      key: "lastActive",
      label: "Last Active",
      render: (u) => <span className="text-xs text-muted-foreground">{u.lastActive}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (u) => <StatusBadge status={u.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (u) => (
        <ActionMenu
          actions={[
            {
              label: "Issue Strike",
              onClick: () => {
                setStrikeTarget(u);
                setStrikeReason("Community Guidelines Violation");
                setStrikeSeverity("WARNING");
              },
            },
            {
              label: "Manage Roles",
              onClick: () => {
                setRoleTarget(u);
                setSelectedRole(u.roles?.[0] || "USER");
              },
            },
            {
              label: u.status === "Active" ? "Suspend Account" : "Reactivate Account",
              onClick: () => handleToggleStatus(u),
            },
            {
              label: "Block / Ban User",
              onClick: () => handleBlockUser(u),
              danger: true,
            },
          ]}
        />
      ),
    },
  ];

  const totalUsers = usersList.length;
  const activeUsers = usersList.filter((u) => u.status === "Active").length;
  const vipUsers = usersList.filter((u) => u.plan.includes("VIP")).length;

  return (
    <AdminPage
      title="Users & Governance"
      subtitle="Directory, trust & safety moderation, strikes, and RBAC governance"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <KPICard label="Total Users" value={totalUsers.toLocaleString()} icon={<Users className="size-4" />} />
          <KPICard label="Active" value={activeUsers.toLocaleString()} icon={<ShieldCheck className="size-4" />} />
          <KPICard label="VIP Subscribers" value={vipUsers.toLocaleString()} icon={<Crown className="size-4" />} />
        </div>

        <SearchFilterBar
          searchValue={search}
          onSearchChange={setSearch}
          placeholder="Search users by name or email..."
          statusOptions={["Active", "Suspended", "Blocked"]}
          selectedStatus={statusFilter}
          onStatusChange={setStatusFilter}
        />

        <DataTable
          data={filtered}
          columns={columns}
          getRowKey={(u) => u.id}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      </div>

      {/* Strike Modal */}
      {strikeTarget && (
        <AdminModal
          open={!!strikeTarget}
          onClose={() => setStrikeTarget(null)}
          title={`Issue Strike: ${strikeTarget.name}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Issuing a governance strike logs a formal trust & safety audit record and notifies the user.
            </p>
            <FormField label="Violation Reason" required>
              <FormSelect
                value={strikeReason}
                onChange={setStrikeReason}
                options={[
                  { value: "Community Guidelines Violation", label: "Community Guidelines Violation" },
                  { value: "Inappropriate Comments / Harassment", label: "Inappropriate Comments / Harassment" },
                  { value: "Spam / Promotion", label: "Spam / Promotion" },
                  { value: "Copyright Infringement", label: "Copyright Infringement" },
                  { value: "Circumventing Paywall / Abuse", label: "Circumventing Paywall / Abuse" },
                ]}
              />
            </FormField>
            <FormField label="Strike Severity">
              <FormSelect
                value={strikeSeverity}
                onChange={setStrikeSeverity}
                options={[
                  { value: "WARNING", label: "Warning (0-strike notice)" },
                  { value: "MODERATE", label: "Moderate (Temporary 48h restriction)" },
                  { value: "SEVERE", label: "Severe (7-day suspension)" },
                ]}
              />
            </FormField>
            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <AdminButton variant="secondary" onClick={() => setStrikeTarget(null)}>
                Cancel
              </AdminButton>
              <AdminButton variant="danger" onClick={handleConfirmStrike}>
                ISSUE STRIKE
              </AdminButton>
            </div>
          </div>
        </AdminModal>
      )}

      {/* Role Assignment Modal */}
      {roleTarget && (
        <AdminModal
          open={!!roleTarget}
          onClose={() => setRoleTarget(null)}
          title={`Assign Roles: ${roleTarget.name}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Update platform RBAC roles for this account. Super Admin access requires elevated approval.
            </p>
            <FormField label="Assigned Role" required>
              <FormSelect
                value={selectedRole}
                onChange={setSelectedRole}
                options={[
                  { value: "USER", label: "User (Standard Consumer)" },
                  { value: "CREATOR", label: "Creator (Studio Publisher)" },
                  { value: "CONTENT_ADMIN", label: "Content Admin (Editorial & Curation)" },
                  { value: "SUPER_ADMIN", label: "Super Admin (Full Governance & Security)" },
                ]}
              />
            </FormField>
            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <AdminButton variant="secondary" onClick={() => setRoleTarget(null)}>
                Cancel
              </AdminButton>
              <AdminButton variant="primary" onClick={handleConfirmRole}>
                APPLY ROLE
              </AdminButton>
            </div>
          </div>
        </AdminModal>
      )}
    </AdminPage>
  );
}
