import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Layers, Plus } from "lucide-react";
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
import { adminSeasons, type AdminSeason } from "@/lib/admin-data";

export const Route = createFileRoute("/admin/seasons")({
  head: () => ({ meta: [{ title: "Seasons — ShortReel Admin" }] }),
  component: AdminSeasonsPage,
});

function AdminSeasonsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [formName, setFormName] = useState("");
  const [formNumber, setFormNumber] = useState("1");
  const [formDesc, setFormDesc] = useState("");
  const [formSeries, setFormSeries] = useState("ser-001");
  const [formStatus, setFormStatus] = useState("Draft");

  const filtered = adminSeasons.filter((s) => {
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.seriesTitle.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns: Column<AdminSeason>[] = [
    {
      key: "name",
      label: "Season",
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-3 min-w-[180px]">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Layers className="size-3.5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">{s.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{s.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: "series",
      label: "Series",
      render: (s) => <span className="text-muted-foreground text-sm">{s.seriesTitle}</span>,
    },
    {
      key: "number",
      label: "#",
      sortable: true,
      render: (s) => <span className="text-foreground font-medium">{s.number}</span>,
    },
    {
      key: "episodes",
      label: "Episodes",
      sortable: true,
      render: (s) => <span className="text-foreground font-medium">{s.episodes}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (s) => <StatusBadge status={s.status} />,
    },
    {
      key: "createdAt",
      label: "Created",
      render: (s) => <span className="text-xs text-muted-foreground">{s.createdAt}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      render: (s) => (
        <ActionMenu
          actions={[
            { label: "Edit", onClick: () => toast.info(`Editing: ${s.name}`) },
            { label: "Reorder Episodes", onClick: () => toast.info("Reorder mode") },
            { label: s.status === "Published" ? "Unpublish" : "Publish", onClick: () => toast.success(`Status changed for ${s.name}`) },
            { label: "Delete Draft", onClick: () => toast.warning(`Deleted: ${s.name}`), danger: true, disabled: s.status === "Published" },
          ]}
        />
      ),
    },
  ];

  return (
    <AdminPage
      title="Seasons"
      subtitle="Manage series seasons"
      actions={
        <AdminButton variant="primary" size="md" onClick={() => setShowCreate(true)}>
          <Plus className="size-4" /> CREATE SEASON
        </AdminButton>
      }
    >
      <div className="space-y-4">
        <SearchFilterBar
          searchValue={search}
          onSearchChange={setSearch}
          placeholder="Search seasons or series..."
          statusOptions={["Draft", "In Review", "Processing", "Published", "Archived"]}
          selectedStatus={statusFilter}
          onStatusChange={setStatusFilter}
        />
        <DataTable data={filtered} columns={columns} getRowKey={(s) => s.id} />
      </div>

      <AdminModal open={showCreate} onClose={() => setShowCreate(false)} title="Create Season">
        <div className="space-y-4">
          <FormField label="Season Name" required>
            <FormInput value={formName} onChange={setFormName} placeholder="e.g. Season 1: The Discovery" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Season Number">
              <FormInput value={formNumber} onChange={setFormNumber} type="number" />
            </FormField>
            <FormField label="Series">
              <FormSelect value={formSeries} onChange={setFormSeries} options={[
                { value: "ser-001", label: "The Missing Phone" },
                { value: "ser-002", label: "Shadow Campus" },
                { value: "ser-003", label: "Monsoon Room 302" },
                { value: "ser-004", label: "Neon Karma 2099" },
              ]} />
            </FormField>
          </div>
          <FormField label="Description">
            <FormTextarea value={formDesc} onChange={setFormDesc} placeholder="Season description..." />
          </FormField>
          <FormField label="Status">
            <FormSelect value={formStatus} onChange={setFormStatus} options={[
              { value: "Draft", label: "Draft" },
              { value: "In Review", label: "In Review" },
              { value: "Published", label: "Published" },
            ]} />
          </FormField>
          <div className="flex gap-3 pt-3 border-t border-border">
            <AdminButton variant="primary" size="md" onClick={() => { toast.success("Season created!"); setShowCreate(false); }}>
              SAVE
            </AdminButton>
            <AdminButton variant="secondary" size="md" onClick={() => setShowCreate(false)}>
              Cancel
            </AdminButton>
          </div>
        </div>
      </AdminModal>
    </AdminPage>
  );
}
