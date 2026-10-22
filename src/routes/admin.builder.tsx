import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  GitBranch,
  Layers,
  Play,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Trophy,
  Tv,
  Upload,
  Vote,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPage } from "@/components/admin-layout";
import { AdminButton, FormSelect } from "@/components/admin-components";
import { VisualGraph } from "@/components/story-builder/visual-graph";
import { NodeEditorDrawer } from "@/components/story-builder/node-editor-drawer";
import { PathTesterModal } from "@/components/story-builder/path-tester-modal";
import { StoryValidationDrawer } from "@/components/story-builder/story-validation-drawer";
import { StoryPreviewModal } from "@/components/story-builder/story-preview-modal";
import { AddNodeModal } from "@/components/story-builder/add-node-modal";
import {
  mockInteractiveStories,
  mockMissingPhoneNodes,
  validateStoryGraph,
  type InteractiveStory,
  type StoryNode,
} from "@/lib/story-engine-data";
import { adminSeries } from "@/lib/admin-data";

export const Route = createFileRoute("/admin/builder")({
  head: () => ({
    meta: [
      { title: "Story Builder — ShortReel Admin" },
      {
        name: "description",
        content: "Visual interactive story tree CMS and node branching engine.",
      },
    ],
  }),
  component: StoryBuilderPage,
});

function StoryBuilderPage() {
  const [selectedSeriesId, setSelectedSeriesId] = useState("ser-001");
  const [currentStory, setCurrentStory] = useState<InteractiveStory>(
    mockInteractiveStories[0]!
  );
  const [nodes, setNodes] = useState<StoryNode[]>(mockMissingPhoneNodes);
  const [selectedNode, setSelectedNode] = useState<StoryNode | null>(null);

  // Modals & Panels state
  const [showAddNode, setShowAddNode] = useState(false);
  const [showPathTester, setShowPathTester] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewStartNode, setPreviewStartNode] = useState<StoryNode>(
    mockMissingPhoneNodes[0]!
  );
  const [highlightedPathIds, setHighlightedPathIds] = useState<string[]>([]);
  const [selectedVersion, setSelectedVersion] = useState("1");

  // Dynamic Validation Engine calculation
  const validation = useMemo(() => validateStoryGraph(nodes), [nodes]);

  // Series selection handler
  const handleSelectSeries = (seriesId: string) => {
    setSelectedSeriesId(seriesId);
    const story = mockInteractiveStories.find((s) => s.seriesId === seriesId);
    if (story && story.nodes.length > 0) {
      setCurrentStory(story);
      setNodes(story.nodes);
    } else {
      const seriesObj = adminSeries.find((s) => s.id === seriesId);
      const emptyStory: InteractiveStory = {
        id: `story-${seriesId}`,
        seriesId,
        seriesTitle: seriesObj?.title ?? "Interactive Title",
        title: `${seriesObj?.title ?? "Series"} — Branch Tree`,
        description: "Custom interactive timeline",
        currentVersion: 1,
        versions: [
          {
            version: 1,
            label: "v1.0 (Draft)",
            status: "Draft",
            updatedAt: "24 Sep 2026",
            updatedBy: "Admin",
            nodesCount: 0,
          },
        ],
        nodes: [],
        status: "Draft",
        activeVotesCount: 0,
        completionRate: "0%",
        engagementScore: "0%",
        updatedAt: "24 Sep 2026",
      };
      setCurrentStory(emptyStory);
      setNodes([]);
    }
    setSelectedNode(null);
    setHighlightedPathIds([]);
  };

  // Node CRUD operations
  const handleSaveNode = (updated: StoryNode) => {
    setNodes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    setSelectedNode(updated);
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
    toast.info("Node deleted from branch graph.");
  };

  const handleDuplicateNode = (node: StoryNode) => {
    const copy: StoryNode = {
      ...node,
      id: `node-${Date.now().toString(36)}`,
      title: `${node.title} (Copy)`,
      x: node.x + 30,
      y: node.y + 40,
    };
    setNodes((prev) => [...prev, copy]);
    setSelectedNode(copy);
    toast.success(`Duplicated node "${node.title}"`);
  };

  const handleAddNode = (newNode: StoryNode) => {
    setNodes((prev) => [...prev, newNode]);
    setSelectedNode(newNode);
  };

  const handleDuplicateStory = () => {
    const nextVer = currentStory.versions.length + 1;
    const duplicatedVersion = {
      version: nextVer,
      label: `v${nextVer}.0 (Fork)`,
      status: "Draft" as const,
      updatedAt: "Just now",
      updatedBy: "Super Admin",
      nodesCount: nodes.length,
    };
    setCurrentStory({
      ...currentStory,
      versions: [duplicatedVersion, ...currentStory.versions],
      currentVersion: nextVer,
    });
    setSelectedVersion(String(nextVer));
    toast.success(`Story branched to new Version ${nextVer}.0!`);
  };

  const handlePublishStory = () => {
    if (!validation.isValid) {
      toast.error("Cannot publish: Please fix all validation errors first.");
      setShowValidation(true);
      return;
    }
    setCurrentStory((prev) => ({ ...prev, status: "Published" }));
    toast.success(`"${currentStory.title}" is now published to live edge network!`);
  };

  const handleLaunchPreview = (start?: StoryNode) => {
    setPreviewStartNode(start ?? (nodes[0] ?? mockMissingPhoneNodes[0]!));
    setShowPreview(true);
  };

  return (
    <AdminPage
      title="Story Builder"
      subtitle="Design how your audience experiences the story through visual branches and decisions."
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          {/* Series Switcher Dropdown */}
          <div className="w-52">
            <FormSelect
              value={selectedSeriesId}
              onChange={handleSelectSeries}
              options={adminSeries
                .filter((s) => s.interactive || s.id === "ser-001")
                .map((s) => ({
                  value: s.id,
                  label: s.title,
                }))}
            />
          </div>

          <AdminButton
            variant="secondary"
            size="md"
            onClick={() => setShowPathTester(true)}
          >
            <GitBranch className="size-3.5" /> TEST PATH
          </AdminButton>

          <div className="relative">
            <AdminButton
              variant="secondary"
              size="md"
              onClick={() => setShowValidation(true)}
            >
              <ShieldCheck className="size-3.5" /> VALIDATE
              {!validation.isValid && (
                <span className="ml-1.5 size-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </AdminButton>
          </div>

          <AdminButton
            variant="secondary"
            size="md"
            onClick={() => handleLaunchPreview()}
          >
            <Play className="size-3.5" /> PREVIEW STORY
          </AdminButton>

          <AdminButton
            variant="primary"
            size="md"
            disabled={!validation.isValid}
            onClick={handlePublishStory}
          >
            <Upload className="size-3.5" /> PUBLISH
          </AdminButton>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Story Engine Control & Versioning Bar (Sections 20 & 21) */}
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-border bg-card/90 backdrop-blur-md flex-wrap text-xs shadow-md">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground font-display text-sm tracking-wide">
                {currentStory.seriesTitle}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  currentStory.status === "Published"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-amber-500/15 text-amber-400"
                }`}
              >
                {currentStory.status}
              </span>
            </div>

            {/* Version Switcher */}
            <div className="flex items-center gap-1.5 bg-muted/40 px-2 py-1 rounded-xl">
              <span className="text-[11px] text-muted-foreground font-semibold">Version:</span>
              <select
                value={selectedVersion}
                onChange={(e) => {
                  setSelectedVersion(e.target.value);
                  toast.info(`Switched to version ${e.target.value}`);
                }}
                className="bg-transparent text-foreground font-bold focus:outline-none cursor-pointer"
              >
                {currentStory.versions.map((v) => (
                  <option key={v.version} value={v.version} className="bg-card text-foreground">
                    {v.label} ({v.status})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleDuplicateStory}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
              title="Duplicate entire story graph into a draft version"
            >
              <Copy className="size-3" /> Duplicate Story
            </button>
          </div>

          {/* Quick Metrics & Add Node Launcher */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 text-muted-foreground text-[11px]">
              <span>
                Nodes: <strong className="text-foreground">{nodes.length}</strong>
              </span>
              <span>•</span>
              <span>
                Choices:{" "}
                <strong className="text-amber-400">
                  {nodes.filter((n) => n.type === "Choice").length}
                </strong>
              </span>
              <span>•</span>
              <span>
                Endings:{" "}
                <strong className="text-emerald-400">
                  {nodes.filter((n) => n.type === "Ending").length}
                </strong>
              </span>
            </div>

            <AdminButton
              variant="primary"
              size="sm"
              onClick={() => setShowAddNode(true)}
            >
              <Plus className="size-3.5" /> ADD NODE
            </AdminButton>
          </div>
        </div>

        {/* Visual Graph Canvas (Sections 5 & 25 & 26) */}
        <div className="relative">
          <VisualGraph
            nodes={nodes}
            selectedNodeId={selectedNode?.id ?? null}
            onSelectNode={(node) => setSelectedNode(node)}
            activePathHighlight={highlightedPathIds}
          />

          {/* Clear Path Highlight Floating Chip */}
          {highlightedPathIds.length > 0 && (
            <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-xl bg-card/90 border border-primary/40 px-3 py-1.5 backdrop-blur-md shadow-xl text-xs">
              <span className="text-primary font-semibold flex items-center gap-1">
                <Sparkles className="size-3" /> Highlighting Active Test Path ({highlightedPathIds.length} nodes)
              </span>
              <button
                type="button"
                onClick={() => setHighlightedPathIds([])}
                className="text-muted-foreground hover:text-foreground text-[11px] underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Node Editor Side Panel (Section 10) */}
      <NodeEditorDrawer
        node={selectedNode}
        allNodes={nodes}
        onClose={() => setSelectedNode(null)}
        onSaveNode={handleSaveNode}
        onDeleteNode={handleDeleteNode}
        onDuplicateNode={handleDuplicateNode}
        onPreviewNode={(node) => handleLaunchPreview(node)}
      />

      {/* Path Testing Engine Modal (Section 12) */}
      <PathTesterModal
        open={showPathTester}
        onClose={() => setShowPathTester(false)}
        nodes={nodes}
        onHighlightPathOnCanvas={(pathIds) => setHighlightedPathIds(pathIds)}
        onLaunchPreviewForPath={(pathNodes) => {
          if (pathNodes.length > 0) {
            handleLaunchPreview(pathNodes[0]);
          }
        }}
      />

      {/* Story Validation Drawer (Section 13 & 14) */}
      <StoryValidationDrawer
        open={showValidation}
        onClose={() => setShowValidation(false)}
        validation={validation}
        onPublishStory={handlePublishStory}
      />

      {/* Interactive Consumer Simulator Preview (Section 22) */}
      <StoryPreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        startNode={previewStartNode}
        allNodes={nodes}
      />

      {/* Add Story Node Modal (Section 7) */}
      <AddNodeModal
        open={showAddNode}
        onClose={() => setShowAddNode(false)}
        onAddNode={handleAddNode}
        existingNodesCount={nodes.length}
      />
    </AdminPage>
  );
}
