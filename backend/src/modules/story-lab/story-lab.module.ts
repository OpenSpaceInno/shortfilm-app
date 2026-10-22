import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';
import { StoryLabRepository } from './repositories/story-lab.repository';
import { ExperimentEngineService } from './services/experiment-engine.service';
import { NodeHeatmapService } from './services/node-heatmap.service';
import { NarrativeInsightService } from './services/narrative-insight.service';
import { StoryLabService } from './services/story-lab.service';
import { StoryLabController } from './controllers/story-lab.controller';
import { AdminStoryLabController } from './controllers/admin-story-lab.controller';

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [StoryLabController, AdminStoryLabController],
  providers: [
    StoryLabRepository,
    ExperimentEngineService,
    NodeHeatmapService,
    NarrativeInsightService,
    StoryLabService,
  ],
  exports: [
    StoryLabService,
    ExperimentEngineService,
    NodeHeatmapService,
    NarrativeInsightService,
    StoryLabRepository,
  ],
})
export class StoryLabModule {}
