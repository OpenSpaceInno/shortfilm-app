import { useState, useEffect } from "react";
import {
  BarChart3,
  CheckCircle2,
  Copy,
  Eye,
  Film,
  GitBranch,
  Layers,
  Play,
  Plus,
  Save,
  Trash2,
  User,
  Users,
  Vote,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  AdminButton,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  StatusBadge,
} from "@/components/admin-components";
import {
  type StoryNode,
  type StoryNodeType,
  type StoryNodeStatus,
  type ChoiceOption,
} from "@/lib/story-engine-data";
import { adminCharacters } from "@/lib/admin-data";

interface NodeEditorDrawerProps {
  node: StoryNode | null;
  allNodes: StoryNode[];
  onClose: () => void;
  onSaveNode: (updatedNode: StoryNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onDuplicateNode: (node: StoryNode) => void;
  onPreviewNode: (node: StoryNode) => void;
}

export function NodeEditorDrawer({
  node,
  allNodes,
  onClose,
  onSaveNode,
  onDeleteNode,
  onDuplicateNode,
  onPreviewNode,
}: NodeEditorDrawerProps) {
  if (!node) return null;

  const [title, setTitle] = useState(node.title);
  const [description, setDescription] = useState(node.description);
  const [type, setType] = useState<StoryNodeType>(node.type);
  const [status, setStatus] = useState<StoryNodeStatus>(node.status);
  const [duration, setDuration] = useState(node.duration ?? "2:00");
  const [videoUrl, setVideoUrl] = useState(node.videoUrl ?? "");
  const [thumbnail, setThumbnail] = useState(node.thumbnail);
  const [branchTag, setBranchTag] = useState(node.branchTag ?? "");
  const [nextNodeId, setNextNodeId] = useState(node.nextNodeId ?? "");
  const [characters, setCharacters] = useState<string[]>(node.characters ?? []);

  // Choice configuration
  const [choiceQuestion, setChoiceQuestion] = useState(node.choiceConfig?.question ?? "");
  const [options, setOptions] = useState<ChoiceOption[]>(
    node.choiceConfig?.options ?? [
      { id: "opt-a", label: "Option A", text: "", destinationNodeId: "" },
      { id: "opt-b", label: "Option B", text: "", destinationNodeId: "" },
    ]
  );
  const [votingDuration, setVotingDuration] = useState(
    node.choiceConfig?.votingDurationSeconds ? String(node.choiceConfig.votingDurationSeconds) : "86400"
  );
  const [minAudience, setMinAudience] = useState(
    node.choiceConfig?.minimumAudienceCount ? String(node.choiceConfig.minimumAudienceCount) : "1000"
  );
  const [resultVisibility, setResultVisibility] = useState(
    node.choiceConfig?.resultVisibility ?? "Immediate"
  );

  const [activeTab, setActiveTab] = useState<"details" | "choice" | "connections" | "analytics">("details");

  // Keep state in sync when selected node changes
  useEffect(() => {
    setTitle(node.title);
    setDescription(node.description);
    setType(node.type);
    setStatus(node.status);
    setDuration(node.duration ?? "2:00");
    setVideoUrl(node.videoUrl ?? "");
    setThumbnail(node.thumbnail);
    setBranchTag(node.branchTag ?? "");
    setNextNodeId(node.nextNodeId ?? "");
    setCharacters(node.characters ?? []);

    if (node.choiceConfig) {
      setChoiceQuestion(node.choiceConfig.question);
      setOptions(node.choiceConfig.options);
      setVotingDuration(String(node.choiceConfig.votingDurationSeconds));
      setMinAudience(String(node.choiceConfig.minimumAudienceCount));
      setResultVisibility(node.choiceConfig.resultVisibility);
      setActiveTab("choice");
    } else {
      setActiveTab("details");
    }
  }, [node]);

  const handleSave = () => {
    const updated: StoryNode = {
      ...node,
      title,
      description,
      type,
      status,
      duration: duration || undefined,
      videoUrl: videoUrl || undefined,
      thumbnail,
      branchTag: branchTag || undefined,
      nextNodeId: type === "Choice" || type === "Ending" ? undefined : (nextNodeId || undefined),
      characters,
      choiceConfig:
        type === "Choice"
          ? {
              id: node.choiceConfig?.id ?? `choice-${Date.now()}`,
              question: choiceQuestion,
              options,
              votingDurationSeconds: parseInt(votingDuration) || 86400,
              minimumAudienceCount: parseInt(minAudience) || 500,
              resultVisibility: resultVisibility as "Immediate" | "AfterVotingEnds" | "Hidden",
              status: "Active",
            }
          : undefined,
    };
    onSaveNode(updated);
    toast.success(`Node "${title}" saved successfully!`);
  };

  const handleAddOption = () => {
    if (options.length >= 4) {
      toast.warning("Maximum 4 choice options allowed.");
      return;
    }
    const labelLetter = String.fromCharCode(65 + options.length);
    setOptions([
      ...options,
      {
        id: `opt-${labelLetter.toLowerCase()}`,
        label: `Option ${labelLetter}`,
        text: `New Choice ${labelLetter}`,
        destinationNodeId: "",
      },
    ]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      toast.warning("A choice node requires at least 2 options.");
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  const otherNodes = allNodes.filter((n) => n.id !== node.id);

  // Available cast for quick addition
  const availableCast = ["Maya", "Arjun", "Kabir", "Unknown Caller", "Inspector Mehra", "Dean Vasudev"];

  return (
    <div className="fixed top-0 right-0 z-50 h-screen w-full max-w-md bg-card/95 backdrop-blur-md border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4 bg-muted/20">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary font-bold text-xs shrink-0">
            {type === "Choice" ? <Vote className="size-4" /> : <Film className="size-4" />}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate">{title}</h3>
            <p className="text-[11px] text-muted-foreground font-mono">ID: {node.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPreviewNode(node)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Preview Node"
          >
            <Play className="size-4" />
          </button>
          <button
            onClick={() => onDuplicateNode(node)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Duplicate Node"
          >
            <Copy className="size-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border px-3 pt-2 text-xs">
        <button
          onClick={() => setActiveTab("details")}
          className={`flex-1 py-2 font-semibold border-b-2 text-center transition-colors ${
            activeTab === "details"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Details
        </button>
        {type === "Choice" && (
          <button
            onClick={() => setActiveTab("choice")}
            className={`flex-1 py-2 font-semibold border-b-2 text-center transition-colors ${
              activeTab === "choice"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Choice ({options.length})
          </button>
        )}
        {type !== "Ending" && type !== "Choice" && (
          <button
            onClick={() => setActiveTab("connections")}
            className={`flex-1 py-2 font-semibold border-b-2 text-center transition-colors ${
              activeTab === "connections"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Next Node
          </button>
        )}
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex-1 py-2 font-semibold border-b-2 text-center transition-colors ${
            activeTab === "analytics"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Analytics
        </button>
      </div>

      {/* Form Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {activeTab === "details" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Node Type">
                <FormSelect
                  value={type}
                  onChange={(v) => setType(v as StoryNodeType)}
                  options={[
                    { value: "Episode", label: "Episode Node" },
                    { value: "Choice", label: "Choice Node (A/B)" },
                    { value: "Branch", label: "Branch Junction" },
                    { value: "Ending", label: "Story Ending" },
                  ]}
                />
              </FormField>
              <FormField label="Status">
                <FormSelect
                  value={status}
                  onChange={(v) => setStatus(v as StoryNodeStatus)}
                  options={[
                    { value: "Draft", label: "Draft" },
                    { value: "Ready", label: "Ready" },
                    { value: "Published", label: "Published" },
                  ]}
                />
              </FormField>
            </div>

            <FormField label="Title" required>
              <FormInput value={title} onChange={setTitle} placeholder="Node Title" />
            </FormField>

            <FormField label="Description">
              <FormTextarea
                value={description}
                onChange={setDescription}
                placeholder="Brief narrative summary of this episode or scene..."
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Duration">
                <FormInput value={duration} onChange={setDuration} placeholder="e.g. 2:15" />
              </FormField>
              <FormField label="Branch Tag (Optional)">
                <FormInput
                  value={branchTag}
                  onChange={setBranchTag}
                  placeholder="e.g. Path A or Path B"
                />
              </FormField>
            </div>

            <FormField label="Thumbnail URL">
              <FormInput
                value={thumbnail}
                onChange={setThumbnail}
                placeholder="https://..."
              />
            </FormField>

            <FormField label="Video Asset URL">
              <FormInput
                value={videoUrl}
                onChange={setVideoUrl}
                placeholder="https://assets...mp4"
              />
            </FormField>

            {/* Section 23: Character Connection */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <User className="size-3.5 text-primary" /> Associated Characters
                </span>
                <span className="text-[10px] text-muted-foreground">Powers fan journeys</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {characters.map((ch) => (
                  <span
                    key={ch}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/15 text-primary px-2.5 py-1 text-[11px] font-medium"
                  >
                    {ch}
                    <button
                      onClick={() => setCharacters(characters.filter((c) => c !== ch))}
                      className="hover:text-destructive"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="pt-1 flex flex-wrap gap-1">
                <span className="text-[10px] text-muted-foreground mr-1 self-center">Add:</span>
                {availableCast
                  .filter((c) => !characters.includes(c))
                  .map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCharacters([...characters, c])}
                      className="text-[10px] rounded bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground px-2 py-0.5 transition-colors"
                    >
                      + {c}
                    </button>
                  ))}
              </div>
            </div>
          </>
        )}

        {/* Section 8 & 9: Choice Configuration */}
        {activeTab === "choice" && (
          <div className="space-y-4">
            <FormField label="Audience Question" required>
              <FormTextarea
                value={choiceQuestion}
                onChange={setChoiceQuestion}
                placeholder="e.g. Should Maya decrypt the phone or destroy it?"
              />
            </FormField>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Decision Options</span>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-primary text-[11px] font-bold hover:underline flex items-center gap-1"
                >
                  <Plus className="size-3" /> Add Option
                </button>
              </div>

              {options.map((opt, idx) => (
                <div
                  key={opt.id}
                  className="p-3 rounded-xl border border-border bg-[#11141E] space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-amber-400">{opt.label}</span>
                    {options.length > 2 && (
                      <button
                        onClick={() => handleRemoveOption(idx)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                  <FormInput
                    value={opt.text}
                    onChange={(v) => {
                      const copy = [...options];
                      const item = copy[idx];
                      if (item) {
                        item.text = v;
                        setOptions(copy);
                      }
                    }}
                    placeholder="Choice option description..."
                  />
                  <FormField label="Next Destination Node">
                    <FormSelect
                      value={opt.destinationNodeId}
                      onChange={(v) => {
                        const copy = [...options];
                        const item = copy[idx];
                        if (item) {
                          item.destinationNodeId = v;
                          setOptions(copy);
                        }
                      }}
                      options={[
                        { value: "", label: "— Select Destination Node —" },
                        ...otherNodes.map((n) => ({
                          value: n.id,
                          label: `${n.title} (${n.type})`,
                        })),
                      ]}
                    />
                  </FormField>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <FormField label="Voting Duration (Sec)">
                <FormInput
                  value={votingDuration}
                  onChange={setVotingDuration}
                  placeholder="86400"
                />
              </FormField>
              <FormField label="Min Audience">
                <FormInput
                  value={minAudience}
                  onChange={setMinAudience}
                  placeholder="1000"
                />
              </FormField>
            </div>

            <FormField label="Result Visibility">
              <FormSelect
                value={resultVisibility}
                onChange={(v) =>
                  setResultVisibility(
                    v as "Immediate" | "AfterVotingEnds" | "Hidden"
                  )
                }
                options={[
                  { value: "Immediate", label: "Immediate (Real-time live bars)" },
                  { value: "AfterVotingEnds", label: "After Voting Closes" },
                  { value: "Hidden", label: "Hidden (Secret Branch until Air Date)" },
                ]}
              />
            </FormField>
          </div>
        )}

        {/* Linear Connections */}
        {activeTab === "connections" && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Configure which story node plays immediately after this episode concludes.
            </p>
            <FormField label="Next Destination Node">
              <FormSelect
                value={nextNodeId}
                onChange={setNextNodeId}
                options={[
                  { value: "", label: "— None (Terminal Node / Ending) —" },
                  ...otherNodes.map((n) => ({
                    value: n.id,
                    label: `${n.title} (${n.type})`,
                  })),
                ]}
              />
            </FormField>
            {nextNodeId && (
              <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 flex items-center gap-2.5">
                <GitBranch className="size-4 text-primary shrink-0" />
                <span className="text-xs text-foreground">
                  Connects forward to:{" "}
                  <strong>{allNodes.find((n) => n.id === nextNodeId)?.title}</strong>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Node Analytics */}
        {activeTab === "analytics" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl border border-border bg-card">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Node Views</p>
                <p className="font-display text-lg text-foreground mt-0.5">2.4M</p>
              </div>
              <div className="p-3 rounded-xl border border-border bg-card">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Completion</p>
                <p className="font-display text-lg text-emerald-400 mt-0.5">91.4%</p>
              </div>
            </div>
            <div className="p-3 rounded-xl border border-border bg-muted/10 space-y-1">
              <p className="font-semibold text-xs text-foreground">Audience Retention</p>
              <p className="text-xs text-muted-foreground">
                98% of viewers completed this scene and made the following branch selection.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-border p-4 bg-muted/20 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            onDeleteNode(node.id);
            onClose();
          }}
          className="text-destructive hover:bg-destructive/10 p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
        >
          <Trash2 className="size-3.5" /> Delete
        </button>

        <div className="flex items-center gap-2">
          <AdminButton variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton variant="primary" size="sm" onClick={handleSave}>
            <Save className="size-3.5" /> Save Node
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
