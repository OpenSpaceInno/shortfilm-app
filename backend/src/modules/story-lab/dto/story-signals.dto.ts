import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateSignalStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class StorySignalResponseDto {
  id: string;
  storyId: string;
  storyTitle?: string;
  storySlug?: string;
  poster?: string;
  creatorName?: string;
  creatorId?: string;
  genre?: string;
  signalType: string;
  strength: string;
  strengthScore: number;
  confidenceScore: number;
  title: string;
  observation: string;
  possibleInterpretation?: string | null;
  suggestedInvestigation?: string | null;
  metricsJson?: Record<string, any> | null;
  windowStart?: Date | null;
  windowEnd?: Date | null;
  detectedAt: Date;
  createdAt: Date;
}
