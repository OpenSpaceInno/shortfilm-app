import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FeatureUsageStatDto {
  @ApiProperty({ example: 5 })
  calls: number;

  @ApiProperty({ example: 4200 })
  tokens: number;
}

export class AiUsageSummaryDto {
  @ApiProperty({ example: 12 })
  totalCalls: number;

  @ApiProperty({ example: 12450 })
  totalTokens: number;

  @ApiProperty({ example: 4500 })
  totalPromptTokens: number;

  @ApiProperty({ example: 7950 })
  totalCompletionTokens: number;

  @ApiProperty({ example: '0.045000' })
  totalEstimatedCostUsd: string;

  @ApiProperty({
    description: 'Breakdown of usage per creative feature',
    example: {
      CONCEPT_EXPAND: { calls: 4, tokens: 3600 },
      CHARACTER_FORGE: { calls: 3, tokens: 2800 },
      BRANCH_DILEMMA: { calls: 2, tokens: 1800 },
      CLIFFHANGER: { calls: 2, tokens: 1200 },
      PRODUCTION_PACK: { calls: 1, tokens: 3050 },
    },
  })
  featureBreakdown: Record<string, FeatureUsageStatDto>;
}

export class AiUsageLogResponseDto {
  @ApiProperty({ example: '01HA0123456789ABCDEF000001' })
  id: string;

  @ApiProperty({ example: '01HA9999999999ABCDEF000001' })
  userId: string;

  @ApiPropertyOptional({ example: '01HA8888888888ABCDEF000001' })
  creatorId?: string | null;

  @ApiProperty({ example: 'CONCEPT_EXPAND' })
  feature: string;

  @ApiProperty({ example: 'CLAUDE' })
  provider: string;

  @ApiProperty({ example: 'claude-3-5-sonnet-20241022' })
  model: string;

  @ApiProperty({ example: 250 })
  promptTokens: number;

  @ApiProperty({ example: 620 })
  completionTokens: number;

  @ApiProperty({ example: 870 })
  totalTokens: number;

  @ApiProperty({ example: '0.003500' })
  estimatedCostUsd: string;

  @ApiProperty({ example: 'SUCCESS' })
  status: string;

  @ApiProperty({ example: 850 })
  latencyMs: number;

  @ApiProperty()
  createdAt: Date;
}
