import { ApiProperty } from '@nestjs/swagger';
import {
  ExecutiveKpiItemDto,
  PlatformSnapshotItemDto,
  FunnelStepDto,
  AttentionItemDto,
} from './executive-kpis.dto';
import { BusinessSignalResponseDto } from './business-signals.dto';

export class BusinessOverviewResponseDto {
  @ApiProperty({ type: [ExecutiveKpiItemDto] })
  kpis!: ExecutiveKpiItemDto[];

  @ApiProperty({ type: [PlatformSnapshotItemDto] })
  snapshot!: PlatformSnapshotItemDto[];

  @ApiProperty({ type: [FunnelStepDto] })
  funnel!: FunnelStepDto[];

  @ApiProperty({ type: [BusinessSignalResponseDto] })
  signals!: BusinessSignalResponseDto[];

  @ApiProperty({ type: [AttentionItemDto] })
  attentionItems!: AttentionItemDto[];

  @ApiProperty({ example: '2026-10-11T12:00:00.000Z' })
  generatedAt!: string;

  @ApiProperty({ example: true, description: 'True if served from sub-50ms Redis cache' })
  isCached!: boolean;
}
