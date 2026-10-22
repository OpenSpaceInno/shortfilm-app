export type HeatmapLevel = 'COOL' | 'WARM' | 'HOT' | 'CRITICAL_DROP';

export interface OptionHeatmapStat {
  optionId: string;
  label: string;
  voteCount: number;
  percentage: number;
  nextCompletionRate: number;
}

export interface NodeHeatmapItem {
  nodeId: string;
  episodeId?: string;
  episodeNumber: number;
  title: string;
  nodeType: string;
  impressions: number;
  completions: number;
  dropOffRate: number; // 0.00 to 1.00
  completionRate: number; // 0.00 to 1.00
  avgWatchTimeSec: number;
  heatLevel: HeatmapLevel;
  isChoicePoint: boolean;
  choiceQuestion?: string;
  options?: OptionHeatmapStat[];
}

export class StoryNodeHeatmapDto {
  storyId: string;
  storyTitle: string;
  totalViewers: number;
  overallCompletionRate: number;
  nodes: NodeHeatmapItem[];
  highestDropOffNode?: {
    nodeId: string;
    episodeNumber: number;
    title: string;
    dropOffRate: number;
    observation: string;
    suggestedInvestigation: string;
  };
}
