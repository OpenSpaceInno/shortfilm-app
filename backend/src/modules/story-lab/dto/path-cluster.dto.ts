export interface PathStepItem {
  stepNumber: number;
  nodeId: string;
  episodeNumber: number;
  title: string;
  choicePrompt?: string;
  selectedOptionLabel?: string;
  selectedOptionId?: string;
}

export interface PathClusterItem {
  clusterId: string;
  name: string; // e.g. "Primary Canonical Route (62%)", "Underworld Investigator Path (24%)", "Early Abandonment Loop (14%)"
  description: string;
  percentage: number;
  userCount: number;
  pathSteps: PathStepItem[];
  terminalNodeType: string; // 'ENDING' or 'DROP_OFF'
  completionRate: number;
  averageSessionDurationMinutes: number;
  loyaltySegment: 'CASUAL' | 'CORE' | 'POWER_FAN';
}

export class StoryPathClusteringDto {
  storyId: string;
  storyTitle: string;
  totalInteractiveSessions: number;
  clusters: PathClusterItem[];
  primaryDivergenceNode?: {
    nodeId: string;
    episodeNumber: number;
    prompt: string;
    impactSummary: string;
  };
}
