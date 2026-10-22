import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, Plus, Send, Users } from "lucide-react";
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
  SearchFilterBar,
  StatusBadge,
} from "@/components/admin-components";
import { adminNotifications, type AdminNotification } from "@/lib/admin-data";

export const Route = createFileRoute("/admin/notifications")({
  head: () => ({ meta: [{ title: "Notifications — ShortReel Admin" }] }),
  component: AdminNotificationsPage,
});

function AdminNotificationsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const filtered = adminNotifications.filter((n) => {
    const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || n.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns: Column<AdminNotification>[] = [
    {
      key: "notification",
      label: "Notification",
      render: (n) => (
        <div className="flex items-center gap-3 min-w-[250px]">
          <div className={`grid size-8 shrink-0 place-items-center rounded-lg ${
            n.type === "Push" ? "bg-violet-500/15 text-violet-400" :
            n.type === "New Episode" ? "bg-blue-500/15 text-blue-400" :
            n.type === "Story Vote" ? "bg-amber-500/15 text-amber-400" :
            n.type === "Creator Release" ? "bg-emerald-500/15 text-emerald-400" :
            "bg-primary/15 text-primary"
          }`}>
            {n.type === "Push" ? <Send className="size-3.5" /> :
             n.type === "New Episode" ? <Bell className="size-3.5" /> :
             <Bell className="size-3.5" />}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">{n.title}</p>
            <p className="text-[11px] text-muted-foreground truncate">{n.message}</p>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (n) => <span className="text-xs text-muted-foreground">{n.type}</span>,
    },
    {
      key: "audience",
      label: "Audience",
      render: (n) => (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="size-3" />
          {n.targetAudience}
        </span>
      ),
    },
    {
      key: "sentTo",
      label: "Sent To",
      render: (n) => <span className="text-foreground font-medium">{n.sentTo}</span>,
    },
    {
      key: "schedule",
      label: "Schedule",
      render: (n) => <span className="text-xs text-muted-foreground">{n.schedule}</span>,
    },
    {
      key: "createdAt",
      label: "Created",
      render: (n) => <span className="text-xs text-muted-foreground">{n.createdAt}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (n) => <StatusBadge status={n.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (n) => (
        <ActionMenu
          actions={[
            { label: "View Details", onClick: () => toast.info(`Viewing: ${n.title}`) },
            { label: "Duplicate", onClick: () => toast.success(`Duplicated: ${n.title}`) },
            { label: n.status === "Draft" ? "Send Now" : "Resend", onClick: () => toast.success(`Sent: ${n.title}`) },
            { label: "Delete", onClick: () => toast.warning(`Deleted: ${n.title}`), danger: true },
          ]}
        />
      ),
    },
  ];

  return (
    <AdminPage
      title="Notifications"
      subtitle="Push, in-app, and campaign notifications"
      actions={
        <AdminButton variant="primary" size="md" onClick={() => setShowCreate(true)}>
          <Plus className="size-4" /> CREATE NOTIFICATION
        </AdminButton>
      }
    >
      <div className="space-y-4">
        <SearchFilterBar
          searchValue={search}
          onSearchChange={setSearch}
          placeholder="Search notifications..."
          statusOptions={["Draft", "Scheduled", "Sent", "Failed"]}
          selectedStatus={statusFilter}
          onStatusChange={setStatusFilter}
        />
        <DataTable data={filtered} columns={columns} getRowKey={(n) => n.id} />
      </div>

      <AdminModal open={showCreate} onClose={() => setShowCreate(false)} title="Create Notification" maxWidth="max-w-2xl">
        <div className="space-y-4">
          <FormField label="Title" required>
            <FormInput value="" onChange={() => {}} placeholder="Notification title" />
          </FormField>
          <FormField label="Message" required>
            <FormTextarea value="" onChange={() => {}} placeholder="Notification body..." />
          </FormField>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Type">
              <FormSelect value="Push" onChange={() => {}} options={[
                { value: "Push", label: "Push" },
                { value: "New Episode", label: "New Episode" },
                { value: "Story Vote", label: "Story Vote" },
                { value: "Creator Release", label: "Creator Release" },
                { value: "Subscription", label: "Subscription" },
              ]} />
            </FormField>
            <FormField label="Audience">
              <FormSelect value="All Users" onChange={() => {}} options={[
                { value: "All Users", label: "All Users" },
                { value: "VIP Only", label: "VIP Only" },
                { value: "Free Only", label: "Free Only" },
                { value: "Segment", label: "Segment" },
              ]} />
            </FormField>
            <FormField label="Schedule">
              <FormInput value="" onChange={() => {}} type="datetime-local" />
            </FormField>
          </div>
          <div className="flex gap-3 pt-3 border-t border-border">
            <AdminButton variant="primary" size="md" onClick={() => { toast.success("Notification created!"); setShowCreate(false); }}>
              SAVE DRAFT
            </AdminButton>
            <AdminButton variant="secondary" size="md" onClick={() => toast.success("Notification sent!")}>
              <Send className="size-3.5" /> SEND NOW
            </AdminButton>
          </div>
        </div>
      </AdminModal>
    </AdminPage>
  );
}
