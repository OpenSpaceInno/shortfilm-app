import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Archive,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Eye,
  Film,
  GitBranch,
  Layers,
  ListVideo,
  Pencil,
  Plus,
  Settings,
  Shield,
  Sparkles,
  Tv,
  Trash2,
  Upload,
  User,
  Vote,
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
  FormTextarea,
  KPICard,
  SearchFilterBar,
  SectionCard,
  StatusBadge,
} from "@/components/admin-components";
import {
  adminSeries,
  adminSeasons,
  adminEpisodes,
  adminCharacters,
  type AdminSeries,
  type ContentStatus,
} from "@/lib/admin-data";
import { adminApi } from "@/lib/api-client";

export const Route = createFileRoute("/admin/series")({
  head: () => ({
    meta: [{ title: "Series — ShortReel Admin" }],
  }),
  component: AdminSeriesPage,
});

function AdminSeriesPage() {
  const [seriesList, setSeriesList] = useState<AdminSeries[]>(adminSeries);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingSeries, setEditingSeries] = useState<AdminSeries | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "seasons" | "episodes" | "characters" | "interactive" | "analytics" | "settings"
  >("overview");

  // Form state for Create Series modal
  const [formTitle, setFormTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formGenre, setFormGenre] = useState("Mystery · Thriller");
  const [formLang, setFormLang] = useState("Hindi");
  const [formRating, setFormRating] = useState("13+");
  const [formType, setFormType] = useState("Original");
  const [formInteractive, setFormInteractive] = useState("Yes");
  const [formStatus, setFormStatus] = useState("Draft");

  useEffect(() => {
    let mounted = true;
    adminApi.listStories()
      .then((res: any) => {
        if (!mounted || !res) return;
        const items = Array.isArray(res) ? res : res.data || res.items;
        if (Array.isArray(items) && items.length > 0) {
          const mapped: AdminSeries[] = items.map((story: any) => ({
            id: story.id,
            title: story.title || "Untitled Story",
            slug: story.slug || story.id,
            description: story.synopsis || story.description || "",
            language: story.language || "Hindi",
            genre: Array.isArray(story.genres) ? story.genres.join(" · ") : (story.genre || "Drama"),
            seasons: story.seasonCount || 1,
            episodes: story.episodeCount || 1,
            status: story.status === "PUBLISHED" ? "Published" : story.status === "ARCHIVED" ? "Archived" : "Draft",
            interactive: Boolean(story.isInteractive),
            visibility: story.visibility || "Public",
            contentType: "Original",
            ageRating: story.ageRating || "13+",
            tags: story.tags || [],
            views: "0",
            completion: "0%",
            watchTime: "0h",
            engagement: "0%",
            creatorId: story.creatorId || "cr-001",
            creatorName: story.creatorName || "Creator",
            featured: Boolean(story.featured),
            spotlightBadge: story.spotlightBadge || (story.featured ? "SPOTLIGHT" : undefined),
            updatedAt: story.updatedAt ? new Date(story.updatedAt).toLocaleDateString("en-GB") : "Today",
            createdAt: story.createdAt ? new Date(story.createdAt).toLocaleDateString("en-GB") : "Today",
          }));
          setSeriesList((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const fresh = mapped.filter((m) => !existingIds.has(m.id));
            return [...prev, ...fresh];
          });
        }
      })
      .catch(() => {
        // Fallback to local adminSeries
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = seriesList.filter((s) => {
    const matchSearch =
      !search ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.slug.toLowerCase().includes(search.toLowerCase()) ||
      s.creatorName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns: Column<AdminSeries>[] = [
    {
      key: "title",
      label: "Series",
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Film className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground truncate">{s.title}</p>
              {s.featured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                  <Sparkles className="size-2.5" /> Featured
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">{s.creatorName}</p>
          </div>
        </div>
      ),
    },
    {
      key: "language",
      label: "Language",
      render: (s) => <span className="text-muted-foreground">{s.language}</span>,
    },
    {
      key: "genre",
      label: "Genre",
      render: (s) => <span className="text-muted-foreground text-xs">{s.genre}</span>,
    },
    {
      key: "seasons",
      label: "Seasons",
      sortable: true,
      render: (s) => <span className="text-foreground font-medium">{s.seasons}</span>,
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
      key: "interactive",
      label: "Interactive",
      render: (s) =>
        s.interactive ? (
          <span className="inline-flex items-center gap-1 text-primary text-xs font-semibold">
            <GitBranch className="size-3" /> Yes
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">No</span>
        ),
    },
    {
      key: "visibility",
      label: "Visibility",
      render: (s) => <span className="text-xs text-muted-foreground">{s.visibility}</span>,
    },
    {
      key: "updatedAt",
      label: "Updated",
      sortable: true,
      render: (s) => <span className="text-xs text-muted-foreground">{s.updatedAt}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      render: (s) => (
        <ActionMenu
          actions={[
            {
              label: "Manage & Edit",
              onClick: () => {
                setEditingSeries(s);
                setActiveTab("overview");
              },
            },
            {
              label: s.featured ? "Remove from Spotlight" : "Pin to Hero Spotlight",
              onClick: () => handleToggleSpotlight(s),
            },
            {
              label: "Duplicate",
              onClick: () => toast.success(`Duplicated: ${s.title}`),
            },
            {
              label: s.status === "Published" ? "Unpublish" : "Publish",
              onClick: () => (s.status === "Published" ? handleUnpublish(s) : handlePublish(s)),
            },
            {
              label: "Archive",
              onClick: () => handleArchive(s),
              danger: true,
            },
          ]}
        />
      ),
    },
  ];

  const handleToggleSpotlight = async (s: AdminSeries) => {
    const nextFeatured = !s.featured;
    try {
      await adminApi.curateStory(s.id, {
        featured: nextFeatured,
        badge: nextFeatured ? "SPOTLIGHT" : undefined,
      });
    } catch {
      // Optimistic local update
    }
    setSeriesList((prev) =>
      prev.map((item) => (item.id === s.id ? { ...item, featured: nextFeatured } : item))
    );
    toast.success(
      nextFeatured
        ? `Pinned "${s.title}" to Featured Carousel & Hero Spotlight!`
        : `Removed "${s.title}" from Spotlight Carousel`
    );
  };

  const handleUnpublish = async (s: AdminSeries) => {
    try {
      await adminApi.unpublishStory(s.id, { reason: "Editorial unpublish" });
    } catch {
      // Optimistic local update
    }
    setSeriesList((prev) =>
      prev.map((item) => (item.id === s.id ? { ...item, status: "Draft" } : item))
    );
    toast.success(`Unpublished: "${s.title}" reverted to Draft`);
  };

  const handlePublish = async (s: AdminSeries) => {
    try {
      await adminApi.curateStory(s.id, { featured: false });
    } catch {
      // Optimistic local update
    }
    setSeriesList((prev) =>
      prev.map((item) => (item.id === s.id ? { ...item, status: "Published" } : item))
    );
    toast.success(`Published: "${s.title}" live in catalog`);
  };

  const handleArchive = async (s: AdminSeries) => {
    try {
      await adminApi.archiveStory(s.id, { rationale: "Administrative catalog deprecation" });
    } catch {
      // Optimistic local update
    }
    setSeriesList((prev) =>
      prev.map((item) => (item.id === s.id ? { ...item, status: "Archived", featured: false } : item))
    );
    if (editingSeries && editingSeries.id === s.id) {
      setEditingSeries(null);
    }
    toast.warning(`Archived: "${s.title}" catalog story`);
  };

  const handleCreateSeries = () => {
    if (!formTitle.trim()) {
      toast.error("Title is required.");
      return;
    }
    toast.success(`Series "${formTitle}" created as draft!`);
    setShowCreate(false);
    setFormTitle("");
    setFormSlug("");
    setFormDesc("");
  };

  // Get series-specific related records
  const seriesSeasons = editingSeries
    ? adminSeasons.filter((sea) => sea.seriesId === editingSeries.id || sea.seriesTitle === editingSeries.title)
    : [];
  const seriesEpisodes = editingSeries
    ? adminEpisodes.filter((ep) => ep.seriesId === editingSeries.id || ep.seriesTitle === editingSeries.title)
    : [];
  const seriesCharacters = editingSeries
    ? adminCharacters.filter((ch) => ch.seriesId === editingSeries.id || ch.seriesTitle === editingSeries.title)
    : [];

  return (
    <AdminPage
      title="Series"
      subtitle="Manage all short-form series on the platform"
      actions={
        <AdminButton variant="primary" size="md" onClick={() => setShowCreate(true)}>
          <Plus className="size-4" /> CREATE SERIES
        </AdminButton>
      }
    >
      <div className="space-y-4">
        <SearchFilterBar
          searchValue={search}
          onSearchChange={setSearch}
          placeholder="Search series by title, slug, or creator..."
          statusOptions={["Draft", "In Review", "Processing", "Published", "Scheduled", "Archived"]}
          selectedStatus={statusFilter}
          onStatusChange={setStatusFilter}
        />

        <DataTable
          data={filtered}
          columns={columns}
          getRowKey={(s) => s.id}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          bulkActions={
            <>
              <AdminButton variant="secondary" onClick={() => toast.success(`Published ${selectedIds.length} series`)}>
                <Upload className="size-3" /> Publish
              </AdminButton>
              <AdminButton variant="secondary" onClick={() => toast.info(`Unpublished ${selectedIds.length} series`)}>
                Unpublish
              </AdminButton>
              <AdminButton variant="secondary" onClick={() => toast.warning(`Archived ${selectedIds.length} series`)}>
                <Archive className="size-3" /> Archive
              </AdminButton>
              <AdminButton variant="secondary" onClick={() => toast.info("Export started")}>
                <Download className="size-3" /> Export
              </AdminButton>
            </>
          }
          emptyMessage="No series found matching your filters."
        />
      </div>

      {/* =========================================================================
          SECTION 10: CREATE SERIES MODAL
          ========================================================================= */}
      <AdminModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Series"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Title" required>
              <FormInput
                value={formTitle}
                onChange={(v) => {
                  setFormTitle(v);
                  setFormSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
                }}
                placeholder="e.g. The Missing Phone"
              />
            </FormField>
            <FormField label="Slug">
              <FormInput value={formSlug} onChange={setFormSlug} placeholder="auto-generated" />
            </FormField>
          </div>

          <FormField label="Description">
            <FormTextarea value={formDesc} onChange={setFormDesc} placeholder="Series description..." />
          </FormField>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <FormField label="Genre">
              <FormSelect
                value={formGenre}
                onChange={setFormGenre}
                options={[
                  { value: "Mystery · Thriller", label: "Mystery · Thriller" },
                  { value: "Romance · Drama", label: "Romance · Drama" },
                  { value: "Cyberpunk · Sci-Fi", label: "Cyberpunk · Sci-Fi" },
                  { value: "Supernatural · Suspense", label: "Supernatural · Suspense" },
                  { value: "Horror · Mystery", label: "Horror · Mystery" },
                  { value: "Anthology · Drama", label: "Anthology · Drama" },
                ]}
              />
            </FormField>
            <FormField label="Language">
              <FormSelect
                value={formLang}
                onChange={setFormLang}
                options={[
                  { value: "Hindi", label: "Hindi" },
                  { value: "Telugu", label: "Telugu" },
                  { value: "Tamil", label: "Tamil" },
                  { value: "Hinglish", label: "Hinglish" },
                  { value: "English", label: "English" },
                ]}
              />
            </FormField>
            <FormField label="Age Rating">
              <FormSelect
                value={formRating}
                onChange={setFormRating}
                options={[
                  { value: "U", label: "U" },
                  { value: "U/A 7+", label: "U/A 7+" },
                  { value: "13+", label: "13+" },
                  { value: "16+", label: "16+" },
                  { value: "18+", label: "18+" },
                ]}
              />
            </FormField>
            <FormField label="Content Type">
              <FormSelect
                value={formType}
                onChange={setFormType}
                options={[
                  { value: "Original", label: "Original" },
                  { value: "Creator Original", label: "Creator Original" },
                  { value: "Licensed", label: "Licensed" },
                  { value: "Pilot", label: "Pilot" },
                ]}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Interactive">
              <FormSelect
                value={formInteractive}
                onChange={setFormInteractive}
                options={[
                  { value: "Yes", label: "Yes" },
                  { value: "No", label: "No" },
                ]}
              />
            </FormField>
            <FormField label="Status">
              <FormSelect
                value={formStatus}
                onChange={setFormStatus}
                options={[
                  { value: "Draft", label: "Draft" },
                  { value: "In Review", label: "In Review" },
                  { value: "Published", label: "Published" },
                  { value: "Archived", label: "Archived" },
                ]}
              />
            </FormField>
          </div>

          {/* Poster / Banner / Trailer placeholders */}
          <div className="grid grid-cols-3 gap-4">
            {["Poster", "Banner", "Trailer"].map((label) => (
              <FormField key={label} label={label}>
                <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/10 h-20 text-muted-foreground hover:border-primary/40 transition-colors cursor-pointer">
                  <span className="text-xs">Upload {label}</span>
                </div>
              </FormField>
            ))}
          </div>

          <FormField label="Tags">
            <FormInput value="" onChange={() => {}} placeholder="mystery, thriller, interactive (comma-separated)" />
          </FormField>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-3 border-t border-border">
            <AdminButton variant="primary" size="md" onClick={handleCreateSeries}>
              SAVE DRAFT
            </AdminButton>
            <AdminButton variant="secondary" size="md" onClick={() => toast.info("Preview mode launched")}>
              <Eye className="size-3.5" /> PREVIEW
            </AdminButton>
            <AdminButton
              variant="secondary"
              size="md"
              onClick={() => {
                handleCreateSeries();
                toast.info("Submitted for editorial review");
              }}
            >
              SUBMIT FOR REVIEW
            </AdminButton>
          </div>
        </div>
      </AdminModal>

      {/* =========================================================================
          SECTION 11: SERIES EDIT & CENTRAL MANAGEMENT (7 TABS)
          ========================================================================= */}
      {editingSeries && (
        <AdminModal
          open={!!editingSeries}
          onClose={() => setEditingSeries(null)}
          title={`Series Management: ${editingSeries.title}`}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-6">
            {/* Header summary badge */}
            <div className="flex items-center justify-between border-b border-border pb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Tv className="size-6" />
                </div>
                <div>
                  <h3 className="font-display text-lg text-foreground">{editingSeries.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    By {editingSeries.creatorName} · {editingSeries.genre} · {editingSeries.language} · {editingSeries.ageRating}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={editingSeries.status} />
                <span className="text-xs font-mono text-muted-foreground px-2 py-1 rounded bg-muted/30">
                  ID: {editingSeries.id}
                </span>
              </div>
            </div>

            {/* 7 Tabs Bar */}
            <div className="flex items-center gap-1 border-b border-border pb-px overflow-x-auto text-xs">
              {[
                { key: "overview" as const, label: "Overview", icon: Film },
                { key: "seasons" as const, label: `Seasons (${seriesSeasons.length || editingSeries.seasons})`, icon: Layers },
                { key: "episodes" as const, label: `Episodes (${seriesEpisodes.length || editingSeries.episodes})`, icon: ListVideo },
                { key: "characters" as const, label: `Characters (${seriesCharacters.length})`, icon: User },
                { key: "interactive" as const, label: "Interactive", icon: GitBranch },
                { key: "analytics" as const, label: "Analytics", icon: BarChart3 },
                { key: "settings" as const, label: "Settings", icon: Settings },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex items-center gap-2 px-3.5 py-2 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === t.key
                      ? "border-primary text-primary bg-primary/5"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <t.icon className="size-3.5" />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Overview */}
            {activeTab === "overview" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Title">
                    <FormInput value={editingSeries.title} onChange={() => {}} />
                  </FormField>
                  <FormField label="Slug">
                    <FormInput value={editingSeries.slug} onChange={() => {}} />
                  </FormField>
                </div>
                <FormField label="Description">
                  <FormTextarea value={editingSeries.description} onChange={() => {}} />
                </FormField>
                <div className="grid grid-cols-3 gap-4">
                  <FormField label="Genre">
                    <FormInput value={editingSeries.genre} onChange={() => {}} />
                  </FormField>
                  <FormField label="Language">
                    <FormInput value={editingSeries.language} onChange={() => {}} />
                  </FormField>
                  <FormField label="Age Rating">
                    <FormInput value={editingSeries.ageRating} onChange={() => {}} />
                  </FormField>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField label="Content Type">
                    <FormInput value={editingSeries.contentType} onChange={() => {}} />
                  </FormField>
                  <FormField label="Visibility">
                    <FormInput value={editingSeries.visibility} onChange={() => {}} />
                  </FormField>
                  <FormField label="Interactive">
                    <FormInput value={editingSeries.interactive ? "Yes (Branching Active)" : "No (Linear)"} onChange={() => {}} />
                  </FormField>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <AdminButton variant="primary" onClick={() => toast.success("Series overview saved!")}>
                    Save Changes
                  </AdminButton>
                </div>
              </div>
            )}

            {/* Tab 2: Seasons */}
            {activeTab === "seasons" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Manage seasons for this title</p>
                  <AdminButton variant="secondary" size="sm" onClick={() => toast.success("New season added to series")}>
                    <Plus className="size-3" /> Add Season
                  </AdminButton>
                </div>
                <div className="space-y-2">
                  {seriesSeasons.length > 0 ? (
                    seriesSeasons.map((sea) => (
                      <div key={sea.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                        <div className="flex items-center gap-3">
                          <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                            S{sea.number}
                          </span>
                          <div>
                            <p className="font-semibold text-sm text-foreground">{sea.name}</p>
                            <p className="text-xs text-muted-foreground">{sea.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">{sea.episodes} Episodes</span>
                          <StatusBadge status={sea.status} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center rounded-xl bg-muted/10 border border-border text-xs text-muted-foreground">
                      {editingSeries.seasons} Season(s) registered in catalog.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 3: Episodes */}
            {activeTab === "episodes" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Episodes linked to {editingSeries.title}</p>
                  <AdminButton variant="secondary" size="sm" onClick={() => toast.info("Create Episode drawer")}>
                    <Plus className="size-3" /> New Episode
                  </AdminButton>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {seriesEpisodes.length > 0 ? (
                    seriesEpisodes.map((ep) => (
                      <div key={ep.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                        <div className="flex items-center gap-3">
                          <span className="grid size-7 place-items-center rounded bg-muted/40 text-xs font-mono">
                            E{ep.number}
                          </span>
                          <div>
                            <p className="font-semibold text-xs text-foreground">{ep.title}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {ep.duration} · {ep.views} views · {ep.free ? "Free Episode" : "VIP"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {ep.choicePoint && (
                            <span className="inline-flex items-center gap-1 text-[10px] rounded-full bg-accent/15 text-accent px-2 py-0.5 font-bold">
                              <Sparkles className="size-2.5" /> Choice Point
                            </span>
                          )}
                          <StatusBadge status={ep.status} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center rounded-xl bg-muted/10 border border-border text-xs text-muted-foreground">
                      {editingSeries.episodes} Episodes registered.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 4: Characters */}
            {activeTab === "characters" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Cast and story personas</p>
                  <AdminButton variant="secondary" size="sm" onClick={() => toast.info("Add character")}>
                    <Plus className="size-3" /> Add Character
                  </AdminButton>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {seriesCharacters.length > 0 ? (
                    seriesCharacters.map((ch) => (
                      <div key={ch.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                        <div className="grid size-9 place-items-center rounded-full bg-primary/20 text-primary font-bold text-xs">
                          {ch.name.slice(0, 2)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs text-foreground truncate">{ch.name}</p>
                          <p className="text-[10px] text-muted-foreground">{ch.role} · Popularity {ch.popularity}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground">
                          {ch.followers} fans
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="col-span-2 text-center text-xs text-muted-foreground py-4">
                      No standalone character profiles registered yet.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Tab 5: Interactive (Section 3: Enable Interactive Story Toggle & Config) */}
            {activeTab === "interactive" && (
              <div className="space-y-4">
                {/* Toggle Bar */}
                <div className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card">
                  <div className="space-y-0.5">
                    <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <GitBranch className="size-4 text-primary" /> Interactive Story Engine
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Enable audience voting, branching pathways, and multiple endings for this series.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {editingSeries.interactive ? "ENABLED" : "DISABLED"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        editingSeries.interactive = !editingSeries.interactive;
                        toast.success(
                          editingSeries.interactive
                            ? "Interactive Storytelling enabled!"
                            : "Interactive Storytelling disabled."
                        );
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        editingSeries.interactive ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          editingSeries.interactive ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {editingSeries.interactive ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <KPICard
                        label="Branching State"
                        value="Active"
                        trend="Live"
                        icon={<GitBranch className="size-4" />}
                      />
                      <KPICard
                        label="Choice Points"
                        value="12 Points"
                        icon={<Vote className="size-4" />}
                      />
                      <KPICard
                        label="Possible Endings"
                        value="4 Endings"
                        icon={<Sparkles className="size-4" />}
                      />
                    </div>

                    <div className="p-5 rounded-2xl border border-primary/30 bg-primary/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                          Interactive Story Configuration
                        </span>
                        <span className="text-[10px] text-primary bg-primary/10 px-2.5 py-1 rounded-full font-bold">
                          Graph Active
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Audience decision points are routed through the Story Engine node graph. Viewers cast votes during episode playback to determine character actions and narrative splits.
                      </p>
                      <div className="pt-2 flex items-center justify-between gap-3">
                        <span className="text-xs text-muted-foreground">
                          Configured in <strong>Story Builder</strong>
                        </span>
                        <a
                          href="/admin/builder"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors shadow"
                        >
                          <GitBranch className="size-3.5" /> Launch Story Builder <ChevronRight className="size-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center rounded-2xl border border-dashed border-border bg-muted/10 space-y-3">
                    <p className="font-semibold text-sm text-foreground">Interactive Story is currently OFF</p>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      This series plays as a standard linear narrative. Toggle the switch above to configure interactive choice nodes, viewer voting windows, and branch destinations.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 6: Analytics */}
            {activeTab === "analytics" && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  <KPICard label="Total Views" value={editingSeries.views} icon={<Film className="size-4" />} />
                  <KPICard label="Completion" value={editingSeries.completion} icon={<CheckCircle2 className="size-4" />} />
                  <KPICard label="Watch Time" value={editingSeries.watchTime} icon={<Clock className="size-4" />} />
                  <KPICard label="Engagement" value={editingSeries.engagement} icon={<Sparkles className="size-4" />} />
                </div>
                <div className="p-4 rounded-xl border border-border bg-card">
                  <h4 className="text-xs font-semibold text-foreground mb-2">Audience Drop-Off Curve</h4>
                  <div className="flex items-end gap-2 h-20 pt-4 border-b border-border pb-2">
                    {[100, 94, 88, 85, 82, 79, 78].map((pct, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-primary/40 rounded-t" style={{ height: `${pct * 0.6}px` }} />
                        <span className="text-[9px] text-muted-foreground">E{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 7: Settings */}
            {activeTab === "settings" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Visibility Mode">
                    <FormSelect
                      value={editingSeries.visibility}
                      onChange={() => {}}
                      options={[
                        { value: "Public", label: "Public (App & Web)" },
                        { value: "Unlisted", label: "Unlisted (Direct Link)" },
                        { value: "VIP Only", label: "VIP Subscribers Only" },
                        { value: "Private", label: "Private (Admin Only)" },
                      ]}
                    />
                  </FormField>
                  <FormField label="Geo-Availability">
                    <FormSelect
                      value="IN"
                      onChange={() => {}}
                      options={[
                        { value: "IN", label: "India Only (Domestic)" },
                        { value: "GLOBAL", label: "Worldwide Distribution" },
                        { value: "SAARC", label: "South Asia (SAARC)" },
                      ]}
                    />
                  </FormField>
                </div>
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-2">
                  <h4 className="text-xs font-bold text-red-400">Danger Zone</h4>
                  <p className="text-xs text-muted-foreground">
                    Archiving removes this series from user recommendations and home feeds.
                  </p>
                  <AdminButton
                    variant="danger"
                    size="sm"
                    onClick={() => handleArchive(editingSeries)}
                  >
                    Archive Series
                  </AdminButton>
                </div>
              </div>
            )}

            {/* Bottom Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-[11px] text-muted-foreground">
                Last modified: {editingSeries.updatedAt}
              </span>
              <div className="flex gap-2">
                <AdminButton variant="secondary" onClick={() => setEditingSeries(null)}>
                  Close
                </AdminButton>
                <AdminButton
                  variant="primary"
                  onClick={() => {
                    toast.success(`Changes saved for ${editingSeries.title}`);
                    setEditingSeries(null);
                  }}
                >
                  Save All
                </AdminButton>
              </div>
            </div>
          </div>
        </AdminModal>
      )}
    </AdminPage>
  );
}
