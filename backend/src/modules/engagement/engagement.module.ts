import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { ContentModule } from '../content/content.module';
import { InteractiveModule } from '../interactive/interactive.module';
import { GamificationModule } from '../gamification/gamification.module';
import { EngagementController } from './controllers/engagement.controller';
import { EngagementService } from './services/engagement.service';
import { WatchProgressRepository } from './repositories/watch-progress.repository';
import { WatchHistoryRepository } from './repositories/watch-history.repository';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    ContentModule,
    InteractiveModule,
    forwardRef(() => GamificationModule),
  ],

  controllers: [EngagementController],
  providers: [
    EngagementService,
    WatchProgressRepository,
    WatchHistoryRepository,
  ],
  exports: [
    EngagementService,
    WatchProgressRepository,
    WatchHistoryRepository,
  ],
})
export class EngagementModule {}
