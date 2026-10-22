import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { ContentModule } from '../content/content.module';
import { VideosModule } from '../videos/videos.module';
import { InteractiveController } from './controllers/interactive.controller';
import { InteractiveService } from './services/interactive.service';
import { ChoiceEngineService } from './services/choice-engine.service';
import { StoryLifecycleService } from './services/story-lifecycle.service';
import { DagValidatorService } from './services/dag-validator.service';
import { StoryVersionsRepository } from './repositories/story-versions.repository';
import { StoryNodesRepository } from './repositories/story-nodes.repository';
import { ChoicesRepository } from './repositories/choices.repository';
import { ChoiceOptionsRepository } from './repositories/choice-options.repository';
import { UserChoicesRepository } from './repositories/user-choices.repository';
import { XpLedgerRepository } from './repositories/xp-ledger.repository';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    ContentModule,
    VideosModule,
  ],
  controllers: [InteractiveController],
  providers: [
    InteractiveService,
    ChoiceEngineService,
    StoryLifecycleService,
    DagValidatorService,
    StoryVersionsRepository,
    StoryNodesRepository,
    ChoicesRepository,
    ChoiceOptionsRepository,
    UserChoicesRepository,
    XpLedgerRepository,
  ],
  exports: [
    InteractiveService,
    ChoiceEngineService,
    StoryLifecycleService,
    DagValidatorService,
    StoryVersionsRepository,
    StoryNodesRepository,
    ChoicesRepository,
    ChoiceOptionsRepository,
    UserChoicesRepository,
    XpLedgerRepository,
  ],
})
export class InteractiveModule {}
