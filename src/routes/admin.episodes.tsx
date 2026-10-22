import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GitBranch, ListVideo, Play, Plus } from "lucide-react";
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
import { adminEpisodes, type AdminEpisode } from "@/lib/admin-data";

export const Route = createFileRoute("/admin/episodes")({
  head: () => ({ meta: [{ title: "Episodes — ShortReel Admin" }] }),
  component: AdminEpisodesPage,
});

function AdminEpisodesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  const filtered = adminEpisodes.filter((e) => {
    const matchSearch =
      !search ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.seriesTitle.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns: Column<AdminEpisode>[] = [
    {
      key: "episode",
      label: "Episode",
      sortable: true,
      render: (e) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary font-display text-xs font-bold">
            {e.number}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">{e.title}</p>
            <p className="text-[11px] text-muted-foreground truncate">{e.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: "series",
      label: "Series",
      render: (e) => <span className="text-muted-foreground text-xs">{e.seriesTitle}</span>,
    },
    {
      key: "season",
      label: "Season",
      render: (e) => <span className="text-muted-foreground text-xs">S{e.seasonNumber}</span>,
    },
    {
      key: "duration",
      label: "Duration",
      render: (e) => <span className="text-foreground font-medium text-xs">{e.duration}</span>,
    },
    {
      key: "views",
      label: "Views",
      sortable: true,
      render: (e) => <span className="text-muted-foreground">{e.views}</span>,
    },
    {
      key: "completion",
      label: "Completion",
      render: (e) => <span className="text-muted-foreground">{e.completion}</span>,
    },
    {
      key: "interactive",
      label: "Interactive",
      render: (e) =>
        e.interactive ? (
          <span className="inline-flex items-center gap-1 text-primary text-xs font-semibold">
            <GitBranch className="size-3" />
            {e.choicePoint ? "Choice" : "Yes"}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">No</span>
        ),
    },
    {
      key: "status",
      label: "Status",
      render: (e) => <StatusBadge status={e.status} />,
    },
    {
      key: "published",
      label: "Published",
      render: (e) => (
        <span className="text-xs text-muted-foreground">{e.publishedDate || "—"}</span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (e) => (
        <ActionMenu
          actions={[
            { label: "Edit", onClick: () => toast.info(`Editing: ${e.title}`) },
            { label: "Preview", onClick: () => toast.info("Preview mode") },
            {
              label: e.status === "Published" ? "Unpublish" : "Publish",
              onClick: () => toast.success(`Status changed for ${e.title}`),
            },
            { label: "Delete Draft", onClick: () => toast.warning(`Deleted: ${e.title}`), danger: true, disabled: e.status === "Published" },
          ]}
        />
      ),
    },
  ];

  return (
    <AdminPage
      title="Episodes"
      subtitle="Manage all episodes across series"
      actions={
        <AdminButton variant="primary" size="md" onClick={() => setShowCreate(true)}>
          <Plus className="size-4" /> CREATE EPISODE
        </AdminButton>
      }
    >
      <div className="space-y-4">
        <SearchFilterBar
          searchValue={search}
          onSearchChange={setSearch}
          placeholder="Search episodes or series..."
          statusOptions={["Draft", "In Review", "Processing", "Ready", "Published", "Scheduled"]}
          selectedStatus={statusFilter}
          onStatusChange={setStatusFilter}
        />
        <DataTable
          data={filtered}
          columns={columns}
          getRowKey={(e) => e.id}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          bulkActions={
            <>
              <AdminButton variant="secondary" onClick={() => toast.success(`Published ${selectedIds.length} episodes`)}>
                Publish
              </AdminButton>
              <AdminButton variant="secondary" onClick={() => toast.info(`Unpublished ${selectedIds.length} episodes`)}>
                Unpublish
              </AdminButton>
            </>
          }
        />
      </div>

      <AdminModal open={showCreate} onClose={() => setShowCreate(false)} title="Create Episode" maxWidth="max-w-2xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Episode Number" required>
              <FormInput value="1" onChange={() => {}} type="number" />
            </FormField>
            <FormField label="Title" required>
              <FormInput value="" onChange={() => {}} placeholder="Episode title" />
            </FormField>
          </div>
          <FormField label="Description">
            <FormTextarea value="" onChange={() => {}} placeholder="Episode description..." />
          </FormField>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Series">
              <FormSelect value="ser-001" onChange={() => {}} options={[
                { value: "ser-001", label: "The Missing Phone" },
                { value: "ser-002", label: "Shadow Campus" },
              ]} />
            </FormField>
            <FormField label="Season">
              <FormSelect value="sea-001" onChange={() => {}} options={[
                { value: "sea-001", label: "Season 1" },
                { value: "sea-002", label: "Season 2" },
              ]} />
            </FormField>
            <FormField label="Duration">
              <FormInput value="" onChange={() => {}} placeholder="1:45" />
            </FormField>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <FormField label="Free / Premium">
              <FormSelect value="Free" onChange={() => {}} options={[
                { value: "Free", label: "Free" },
                { value: "Premium", label: "Premium" },
              ]} />
            </FormField>
            <FormField label="Interactive">
              <FormSelect value="No" onChange={() => {}} options={[
                { value: "Yes", label: "Yes" },
                { value: "No", label: "No" },
              ]} />
            </FormField>
            <FormField label="Choice Point">
              <FormSelect value="No" onChange={() => {}} options={[
                { value: "Yes", label: "Yes" },
                { value: "No", label: "No" },
              ]} />
            </FormField>
            <FormField label="Status">
              <FormSelect value="Draft" onChange={() => {}} options={[
                { value: "Draft", label: "Draft" },
                { value: "Processing", label: "Processing" },
                { value: "In Review", label: "In Review" },
                { value: "Published", label: "Published" },
              ]} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Thumbnail">
              <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/10 h-20 text-muted-foreground hover:border-primary/40 transition-colors cursor-pointer">
                <span className="text-xs">Upload Thumbnail</span>
              </div>
            </FormField>
            <FormField label="Video">
              <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/10 h-20 text-muted-foreground hover:border-primary/40 transition-colors cursor-pointer">
                <span className="text-xs">Upload Video (9:16)</span>
              </div>
            </FormField>
          </div>
          <div className="flex gap-3 pt-3 border-t border-border">
            <AdminButton variant="primary" size="md" onClick={() => { toast.success("Episode created!"); setShowCreate(false); }}>
              SAVE DRAFT
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
