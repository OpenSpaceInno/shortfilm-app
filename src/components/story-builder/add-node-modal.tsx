import { useState } from "react";
import { Film, GitBranch, Trophy, Vote } from "lucide-react";
import { toast } from "sonner";
import {
  AdminButton,
  AdminModal,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/components/admin-components";
import {
  type StoryNode,
  type StoryNodeType,
  type StoryNodeStatus,
} from "@/lib/story-engine-data";

interface AddNodeModalProps {
  open: boolean;
  onClose: () => void;
  onAddNode: (newNode: StoryNode) => void;
  existingNodesCount: number;
}

export function AddNodeModal({
  open,
  onClose,
  onAddNode,
  existingNodesCount,
}: AddNodeModalProps) {
  const [nodeType, setNodeType] = useState<StoryNodeType>("Episode");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [episodeNumber, setEpisodeNumber] = useState(String(existingNodesCount + 1));
  const [duration, setDuration] = useState("2:00");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnail, setThumbnail] = useState(
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80"
  );
  const [branchTag, setBranchTag] = useState("");
  const [question, setQuestion] = useState("");
  const [optAText, setOptAText] = useState("Investigate further");
  const [optBText, setOptBText] = useState("Flee the scene");

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Please enter a title for the node.");
      return;
    }

    const id = `node-${Date.now().toString(36)}`;
    const newNode: StoryNode = {
      id,
      title,
      description: description || "New narrative beat in story timeline",
      type: nodeType,
      status: "Draft",
      duration,
      videoUrl: videoUrl || undefined,
      thumbnail,
      episodeNumber: nodeType === "Episode" ? parseInt(episodeNumber) || 1 : undefined,
      branchTag: branchTag || undefined,
      characters: ["Maya"],
      // Default coordinates
      x: 350 + (existingNodesCount % 2 === 0 ? 30 : -30),
      y: 100 + existingNodesCount * 90,
      choiceConfig:
        nodeType === "Choice"
          ? {
              id: `choice-${id}`,
              question: question || "What should the character do next?",
              options: [
                { id: "opt-a", label: "Option A", text: optAText, destinationNodeId: "" },
                { id: "opt-b", label: "Option B", text: optBText, destinationNodeId: "" },
              ],
              votingDurationSeconds: 86400,
              minimumAudienceCount: 500,
              resultVisibility: "Immediate",
              status: "Active",
            }
          : undefined,
    };

    onAddNode(newNode);
    toast.success(`Node "${title}" added to story builder!`);
    onClose();
    setTitle("");
    setDescription("");
    setQuestion("");
  };

  return (
    <AdminModal open={open} onClose={onClose} title="Add Story Node" maxWidth="max-w-xl">
      <div className="space-y-4">
        {/* Type Selection Tiles */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { type: "Episode" as const, label: "Episode", icon: Film },
            { type: "Choice" as const, label: "Choice", icon: Vote },
            { type: "Branch" as const, label: "Branch", icon: GitBranch },
            { type: "Ending" as const, label: "Ending", icon: Trophy },
          ].map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => setNodeType(item.type)}
              className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                nodeType === item.type
                  ? "border-primary bg-primary/10 text-primary font-bold shadow-md"
                  : "border-border bg-card/60 hover:bg-muted text-muted-foreground"
              }`}
            >
              <item.icon className="size-4" />
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>

        <FormField label="Node Title" required>
          <FormInput
            value={title}
            onChange={setTitle}
            placeholder={
              nodeType === "Choice" ? "e.g. Maya's Decision Point" : "e.g. Episode 4: The Alibi"
            }
          />
        </FormField>

        {nodeType === "Choice" ? (
          <>
            <FormField label="Audience Voting Question" required>
              <FormTextarea
                value={question}
                onChange={setQuestion}
                placeholder="What choice will you prompt viewers with?"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Option A Text">
                <FormInput value={optAText} onChange={setOptAText} />
              </FormField>
              <FormField label="Option B Text">
                <FormInput value={optBText} onChange={setOptBText} />
              </FormField>
            </div>
          </>
        ) : (
          <>
            <FormField label="Narrative Synopsis">
              <FormTextarea
                value={description}
                onChange={setDescription}
                placeholder="What happens in this episode or scene?"
              />
            </FormField>

            <div className="grid grid-cols-3 gap-3">
              {nodeType === "Episode" && (
                <FormField label="Episode #">
                  <FormInput value={episodeNumber} onChange={setEpisodeNumber} />
                </FormField>
              )}
              <FormField label="Duration">
                <FormInput value={duration} onChange={setDuration} />
              </FormField>
              <FormField label="Branch Tag">
                <FormInput
                  value={branchTag}
                  onChange={setBranchTag}
                  placeholder="e.g. Path A"
                />
              </FormField>
            </div>

            <FormField label="Video URL (Optional)">
              <FormInput
                value={videoUrl}
                onChange={setVideoUrl}
                placeholder="https://assets...mp4"
              />
            </FormField>
          </>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <AdminButton variant="secondary" size="md" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton variant="primary" size="md" onClick={handleSubmit}>
            Create Node
          </AdminButton>
        </div>
      </div>
    </AdminModal>
  );
}
