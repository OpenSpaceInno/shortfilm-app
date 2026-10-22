import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { HardDrive, Video } from "lucide-react";
import { toast } from "sonner";
import { AdminPage } from "@/components/admin-layout";
import {
  ActionMenu,
  type Column,
  DataTable,
  SearchFilterBar,
  StatusBadge,
} from "@/components/admin-components";
import { adminVideos, type AdminVideo } from "@/lib/admin-data";

export const Route = createFileRoute("/admin/videos")({
  head: () => ({ meta: [{ title: "Videos — ShortReel Admin" }] }),
  component: AdminVideosPage,
});

function AdminVideosPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = adminVideos.filter((v) => {
    const matchSearch =
      !search ||
      v.episodeTitle.toLowerCase().includes(search.toLowerCase()) ||
      v.seriesTitle.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || v.processingStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns: Column<AdminVideo>[] = [
    {
      key: "video",
      label: "Video",
      render: (v) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Video className="size-3.5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">{v.episodeTitle}</p>
            <p className="text-[11px] text-muted-foreground truncate">{v.seriesTitle}</p>
          </div>
        </div>
      ),
    },
    {
      key: "duration",
      label: "Duration",
      render: (v) => <span className="text-foreground font-medium text-xs">{v.duration}</span>,
    },
    {
      key: "resolution",
      label: "Resolution",
      render: (v) => <span className="text-xs text-muted-foreground">{v.resolution}</span>,
    },
    {
      key: "fileSize",
      label: "Size",
      render: (v) => <span className="text-xs text-muted-foreground">{v.fileSize}</span>,
    },
    {
      key: "format",
      label: "Format",
      render: (v) => <span className="text-xs text-muted-foreground font-mono">{v.format}</span>,
    },
    {
      key: "processing",
      label: "Processing",
      render: (v) => <StatusBadge status={v.processingStatus} />,
    },
    {
      key: "streaming",
      label: "Streaming",
      render: (v) => <StatusBadge status={v.streamingStatus} />,
    },
    {
      key: "uploaded",
      label: "Uploaded",
      render: (v) => <span className="text-xs text-muted-foreground">{v.uploadDate}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      render: (v) => (
        <ActionMenu
          actions={[
            { label: "View Details", onClick: () => toast.info(`Video: ${v.episodeTitle}`) },
            {
              label: "Re-process",
              onClick: () => toast.info(`Re-processing: ${v.episodeTitle}`),
              disabled: v.processingStatus === "Ready",
            },
            {
              label: "Replace Video",
              onClick: () => toast.info("Upload replacement video"),
            },
            {
              label: "Delete",
              onClick: () => toast.warning(`Deleted: ${v.episodeTitle}`),
              danger: true,
            },
          ]}
        />
      ),
    },
  ];

  return (
    <AdminPage title="Videos" subtitle="Video assets and processing status">
      <div className="space-y-4">
        <SearchFilterBar
          searchValue={search}
          onSearchChange={setSearch}
          placeholder="Search videos by episode or series..."
          statusOptions={["Uploaded", "Processing", "Ready", "Failed"]}
          selectedStatus={statusFilter}
          onStatusChange={setStatusFilter}
        />
        <DataTable data={filtered} columns={columns} getRowKey={(v) => v.id} />

        {/* Processing summary */}
        <div className="grid grid-cols-4 gap-3">
          {(["Ready", "Processing", "Uploaded", "Failed"] as const).map((status) => {
            const count = adminVideos.filter((v) => v.processingStatus === status).length;
            return (
              <div key={status} className="rounded-xl border border-border bg-card p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{status}</p>
                  <p className="font-display text-xl text-foreground">{count}</p>
                </div>
                <StatusBadge status={status} />
              </div>
            );
          })}
        </div>
      </div>
    </AdminPage>
  );
}
