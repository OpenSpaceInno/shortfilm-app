import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { AdminPage } from "@/components/admin-layout";
import {
  ActionMenu,
  type Column,
  DataTable,
  SearchFilterBar,
  StatusBadge,
} from "@/components/admin-components";
import { adminCharacters, type AdminCharacter } from "@/lib/admin-data";

export const Route = createFileRoute("/admin/characters")({
  head: () => ({ meta: [{ title: "Characters — ShortReel Admin" }] }),
  component: AdminCharactersPage,
});

function AdminCharactersPage() {
  const [search, setSearch] = useState("");

  const filtered = adminCharacters.filter((c) => {
    return (
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.seriesTitle.toLowerCase().includes(search.toLowerCase())
    );
  });

  const columns: Column<AdminCharacter>[] = [
    {
      key: "character",
      label: "Character",
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-3 min-w-[180px]">
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-display text-xs font-bold">
            {c.name[0]}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">{c.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{c.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: "series",
      label: "Series",
      render: (c) => <span className="text-muted-foreground text-xs">{c.seriesTitle}</span>,
    },
    {
      key: "role",
      label: "Role",
      render: (c) => (
        <span className={`text-xs font-semibold ${
          c.role === "Protagonist" ? "text-primary" :
          c.role === "Antagonist" ? "text-rose-700 dark:text-red-400" :
          "text-muted-foreground"
        }`}>
          {c.role}
        </span>
      ),
    },
    {
      key: "followers",
      label: "Followers",
      sortable: true,
      render: (c) => (
        <span className="inline-flex items-center gap-1 text-foreground font-medium">
          <Heart className="size-3 text-rose-600 dark:text-red-400 fill-rose-600/20" />
          {c.followers}
        </span>
      ),
    },
    {
      key: "popularity",
      label: "Popularity",
      render: (c) => <span className="text-muted-foreground">{c.popularity}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (c) => <StatusBadge status={c.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (c) => (
        <ActionMenu
          actions={[
            { label: "Edit", onClick: () => toast.info(`Editing: ${c.name}`) },
            { label: "View in Series", onClick: () => toast.info(`Navigating to: ${c.seriesTitle}`) },
            { label: c.status === "Active" ? "Archive" : "Activate", onClick: () => toast.success(`Updated: ${c.name}`) },
          ]}
        />
      ),
    },
  ];

  return (
    <AdminPage title="Characters" subtitle="Manage series characters">
      <div className="space-y-4">
        <SearchFilterBar
          searchValue={search}
          onSearchChange={setSearch}
          placeholder="Search characters or series..."
        />
        <DataTable data={filtered} columns={columns} getRowKey={(c) => c.id} />
      </div>
    </AdminPage>
  );
}
