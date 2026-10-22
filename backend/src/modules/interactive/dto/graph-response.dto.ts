export interface GraphChoiceOptionDto {
  id: string;
  label: string;
  destinationNodeId: string;
  voteCount: number;
  displayOrder: number;
}

export interface GraphChoiceDto {
  id: string;
  prompt: string;
  votingOpensAt?: Date | null;
  votingEndsAt?: Date | null;
  options: GraphChoiceOptionDto[];
}

export interface GraphNodeDto {
  id: string;
  episodeId: string;
  episodeTitle?: string;
  episodeNumber?: number;
  nodeType: string;
  isRoot: boolean;
  sequenceOrder: number;
  votingEndsAt?: Date | null;
  fallbackOptionId?: string | null;
  choice?: GraphChoiceDto | null;
}

export interface GraphEdgeDto {
  sourceNodeId: string;
  destinationNodeId: string;
  choiceId: string;
  optionId: string;
  label: string;
}

export interface StoryGraphDto {
  storyId: string;
  versionId: string;
  versionNumber: number;
  status: string;
  rootNodeId?: string | null;
  publishedAt?: Date | null;
  nodes: GraphNodeDto[];
  edges: GraphEdgeDto[];
}
