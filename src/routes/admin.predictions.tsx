import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  Coins,
  Crown,
  HelpCircle,
  Plus,
  Sparkles,
  Trophy,
  Users,
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
  KPICard,
  SectionCard,
  StatusBadge,
} from "@/components/admin-components";
import {
  mockPredictions,
  type StoryPrediction,
} from "@/lib/story-engine-data";
import { adminSeries } from "@/lib/admin-data";

export const Route = createFileRoute("/admin/predictions")({
  head: () => ({
    meta: [
      { title: "Predictions — ShortReel Admin" },
      {
        name: "description",
        content: "Configure narrative prediction questions, XP incentives, and story bets.",
      },
    ],
  }),
  component: AdminPredictionsPage,
});

function AdminPredictionsPage() {
  const [predictions, setPredictions] = useState<StoryPrediction[]>(mockPredictions);
  const [showCreate, setShowCreate] = useState(false);

  // Form state
  const [formSeriesId, setFormSeriesId] = useState("ser-001");
  const [formQuestion, setFormQuestion] = useState("");
  const [formOptions, setFormOptions] = useState("Arjun, Maya, Kabir, Unknown");
  const [formCorrect, setFormCorrect] = useState("Kabir");
  const [formReward, setFormReward] = useState("50");
  const [formStartDate, setFormStartDate] = useState("01 Oct 2026");
  const [formEndDate, setFormEndDate] = useState("15 Oct 2026");

  const handleCreatePrediction = () => {
    if (!formQuestion.trim()) {
      toast.error("Please enter a prediction question.");
      return;
    }
    const seriesObj = adminSeries.find((s) => s.id === formSeriesId);
    const parsedOptions = formOptions.split(",").map((o) => o.trim()).filter(Boolean);

    const newPred: StoryPrediction = {
      id: `pred-${Date.now().toString(36)}`,
      seriesId: formSeriesId,
      seriesTitle: seriesObj?.title ?? "The Missing Phone",
      question: formQuestion,
      options: parsedOptions.length > 0 ? parsedOptions : ["Option A", "Option B"],
      correctAnswer: formCorrect,
      startDate: formStartDate,
      endDate: formEndDate,
      xpReward: parseInt(formReward) || 50,
      totalPredictors: 0,
      status: "Active",
    };

    setPredictions([newPred, ...predictions]);
    setShowCreate(false);
    setFormQuestion("");
    toast.success("Story prediction created and live!");
  };

  const columns: Column<StoryPrediction>[] = [
    {
      key: "question",
      label: "Prediction Question",
      sortable: true,
      render: (p) => (
        <div className="min-w-[200px]">
          <p className="font-semibold text-foreground text-sm">{p.question}</p>
          <p className="text-[11px] text-muted-foreground">{p.seriesTitle}</p>
        </div>
      ),
    },
    {
      key: "options",
      label: "Answer Choices",
      render: (p) => (
        <div className="flex flex-wrap gap-1 max-w-[220px]">
          {p.options.map((opt) => (
            <span
              key={opt}
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                opt === p.correctAnswer
                  ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30"
                  : "bg-muted/40 text-muted-foreground"
              }`}
            >
              {opt}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "correctAnswer",
      label: "Correct Solution",
      render: (p) => (
        <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
          <CheckCircle2 className="size-3.5" /> {p.correctAnswer}
        </span>
      ),
    },
    {
      key: "xpReward",
      label: "XP Reward",
      sortable: true,
      render: (p) => (
        <span className="inline-flex items-center gap-1 text-primary font-bold text-xs">
          <Sparkles className="size-3" /> +{p.xpReward} XP
        </span>
      ),
    },
    {
      key: "totalPredictors",
      label: "Participants",
      sortable: true,
      render: (p) => (
        <span className="font-mono text-foreground font-medium text-xs">
          {p.totalPredictors.toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (p) => <StatusBadge status={p.status === "Active" ? "Published" : p.status === "Settled" ? "Ready" : "Draft"} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (p) => (
        <ActionMenu
          actions={[
            {
              label: p.status === "Settled" ? "View Payouts" : "Settle Prediction",
              onClick: () => toast.success(`Prediction settled! Distributed XP to winners.`),
            },
            {
              label: "Edit Question",
              onClick: () => toast.info(`Editing prediction: ${p.question}`),
            },
            {
              label: "Export Roster",
              onClick: () => toast.info(`Exporting prediction ledger`),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <AdminPage
      title="Prediction Management"
      subtitle="Gamified narrative predictions, audience XP rewards, and plot outcome wagering"
      actions={
        <AdminButton variant="primary" size="md" onClick={() => setShowCreate(true)}>
          <Plus className="size-4" /> CREATE PREDICTION
        </AdminButton>
      }
    >
      <div className="space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard
            label="Active Predictions"
            value={predictions.filter((p) => p.status === "Active").length.toString()}
            icon={<HelpCircle className="size-4" />}
          />
          <KPICard
            label="Total Predictions Cast"
            value="90.7K"
            trend="+28.4%"
            icon={<Users className="size-4" />}
          />
          <KPICard
            label="XP Awarded to Viewers"
            value="3.2M XP"
            icon={<Sparkles className="size-4" />}
          />
          <KPICard
            label="Viewer Retention Uplift"
            value="+42%"
            sublabel="on predicted titles"
            icon={<Trophy className="size-4" />}
          />
        </div>

        {/* Predictions Directory */}
        <SectionCard
          title="Narrative Prediction Quests"
          subtitle="Configure questions, valid answers, and XP bounties for interactive viewers"
        >
          <DataTable data={predictions} columns={columns} getRowKey={(p) => p.id} />
        </SectionCard>
      </div>

      {/* Create Prediction Modal (Section 19) */}
      <AdminModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Story Prediction"
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <FormField label="Target Series" required>
            <FormSelect
              value={formSeriesId}
              onChange={setFormSeriesId}
              options={adminSeries.map((s) => ({ value: s.id, label: s.title }))}
            />
          </FormField>

          <FormField label="Prediction Question" required>
            <FormInput
              value={formQuestion}
              onChange={setFormQuestion}
              placeholder="e.g. WHO IS THE TRAITOR?"
            />
          </FormField>

          <FormField label="Options (Comma separated)" required>
            <FormInput
              value={formOptions}
              onChange={setFormOptions}
              placeholder="e.g. Arjun, Maya, Kabir, Unknown"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Correct Answer (Solution)">
              <FormInput
                value={formCorrect}
                onChange={setFormCorrect}
                placeholder="e.g. Kabir"
              />
            </FormField>
            <FormField label="XP Reward Bounty">
              <FormInput
                value={formReward}
                onChange={setFormReward}
                placeholder="50"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Date">
              <FormInput value={formStartDate} onChange={setFormStartDate} />
            </FormField>
            <FormField label="End Date (Reveal Date)">
              <FormInput value={formEndDate} onChange={setFormEndDate} />
            </FormField>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <AdminButton variant="secondary" size="md" onClick={() => setShowCreate(false)}>
              Cancel
            </AdminButton>
            <AdminButton variant="primary" size="md" onClick={handleCreatePrediction}>
              Publish Prediction Quest
            </AdminButton>
          </div>
        </div>
      </AdminModal>
    </AdminPage>
  );
}
