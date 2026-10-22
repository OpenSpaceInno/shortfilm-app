export interface GraphValidationResultDto {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    nodeCount: number;
    choiceCount: number;
    endingCount: number;
    maxDepth: number;
  };
}
